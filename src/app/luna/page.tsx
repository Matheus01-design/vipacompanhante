'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
  time: string
}

interface LunaConfig {
  foto_url: string
  nome: string
  emoji: string
  cor_primaria: string
  cor_fundo: string
  ativo: boolean
}

const CONFIG_PADRAO: LunaConfig = {
  foto_url: '',
  nome: 'Luna',
  emoji: '😈',
  cor_primaria: '#ff6b6b',
  cor_fundo: '#1a0a0a',
  ativo: true
}

export default function ChatLuna() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [started, setStarted] = useState(false)
  const [config, setConfig] = useState<LunaConfig>(CONFIG_PADRAO)
  const [carregando, setCarregando] = useState(true)
  const [sessaoId] = useState(() => `luna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [inicioSessao] = useState(() => Date.now())
  const [totalMensagens, setTotalMensagens] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Carregar configuração
  useEffect(() => {
    async function carregarConfig() {
      try {
        const res = await fetch('/api/luna')
        const data = await res.json()
        if (data && data.nome) {
          setConfig({
            foto_url: data.foto_url || '',
            nome: data.nome || 'Luna',
            emoji: data.emoji || '😈',
            cor_primaria: data.cor_primaria || '#ff6b6b',
            cor_fundo: data.cor_fundo || '#1a0a0a',
            ativo: data.ativo !== false
          })
        }
      } catch (e) {
        console.error('Erro ao carregar config:', e)
      }
      setCarregando(false)
    }
    carregarConfig()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const registrarFim = async () => {
      if (started && totalMensagens > 0) {
        const tempoSessao = Math.floor((Date.now() - inicioSessao) / 1000)
        await supabase.from('luna_metricas').insert({
          sessao_id: sessaoId,
          evento: 'fim',
          tempo_sessao: tempoSessao,
          total_mensagens: totalMensagens
        })
      }
    }

    window.addEventListener('beforeunload', registrarFim)
    return () => {
      window.removeEventListener('beforeunload', registrarFim)
      registrarFim()
    }
  }, [started, totalMensagens])

  const getTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const registrarEvento = async (evento: string) => {
    try {
      await supabase.from('luna_metricas').insert({
        sessao_id: sessaoId,
        evento,
        tempo_sessao: Math.floor((Date.now() - inicioSessao) / 1000),
        total_mensagens: totalMensagens
      })
    } catch (e) {
      console.error('Erro ao registrar evento:', e)
    }
  }

  const startChat = async () => {
    setStarted(true)
    setIsTyping(true)
    
    await registrarEvento('inicio')

    try {
      const response = await fetch('/api/luna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Oi!' }]
        })
      })

      const data = await response.json()
      const aiText = data.text || `Oi gato... que bom te ver por aqui ${config.emoji}`

      setMessages([
        { id: 1, text: aiText, sender: 'ai', time: getTime() }
      ])
    } catch (error) {
      setMessages([
        { id: 1, text: `Oi gato... tava te esperando ${config.emoji}💋`, sender: 'ai', time: getTime() }
      ])
    }

    setIsTyping(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      time: getTime()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    
    const novoTotal = totalMensagens + 1
    setTotalMensagens(novoTotal)
    
    await registrarEvento('mensagem')

    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }))

    history.push({ role: 'user', content: userMessage.text })

    try {
      const response = await fetch('/api/luna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      })

      const data = await response.json()
      const aiText = data.text || `Hmm não entendi gato... repete? ${config.emoji}`

      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiText,
        sender: 'ai',
        time: getTime()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: `Ops, deu um probleminha... tenta de novo? ${config.emoji}`,
        sender: 'ai',
        time: getTime()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Cores dinâmicas
  const corPrimaria = config.cor_primaria
  const corFundo = config.cor_fundo
  const corPrimariaRGB = corPrimaria // fallback

  if (carregando) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        Carregando...
      </div>
    )
  }

  if (!config.ativo) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p>A Luna está offline no momento 😔</p>
        <Link href="/" style={{ color: corPrimaria }}>Voltar para o site</Link>
      </div>
    )
  }

  if (!started) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${corFundo} 0%, #2d1020 50%, #0f0f15 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Link href="/" style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}>
          <ArrowLeft size={18} /> Voltar
        </Link>
        
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          border: `1px solid ${corPrimaria}30`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            margin: '0 auto 24px',
            overflow: 'hidden',
            border: `3px solid ${corPrimaria}60`,
            boxShadow: `0 8px 32px ${corPrimaria}40`,
            background: config.foto_url ? 'none' : `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}aa 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {config.foto_url ? (
              <img 
                src={config.foto_url} 
                alt={config.nome}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <span style={{ fontSize: '48px' }}>{config.emoji}</span>
            )}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            {config.nome} {config.emoji}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
            Estou molhadinha te esperando.<br/>Vem conversar comigo... 💋
          </p>
          <button
            onClick={startChat}
            style={{
              background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}cc 100%)`,
              color: '#fff',
              border: 'none',
              padding: '16px 48px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 8px 24px ${corPrimaria}60`,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Conversar 🔥
          </button>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '24px' }}>
            💬 Chat ao vivo grátis 🟢
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(180deg, ${corFundo} 0%, #0f0f15 100%)`
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(10px)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: `1px solid ${corPrimaria}20`
      }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: `2px solid ${corPrimaria}60`,
          boxShadow: `0 4px 12px ${corPrimaria}30`,
          background: config.foto_url ? 'none' : `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}aa 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {config.foto_url ? (
            <img 
              src={config.foto_url} 
              alt={config.nome}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '20px' }}>{config.emoji}</span>
          )}
        </div>
        <div>
          <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', margin: 0 }}>
            {config.nome} {config.emoji}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
            {isTyping ? 'Digitando...' : 'Online agora'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: msg.sender === 'user' 
                ? '18px 18px 4px 18px' 
                : '18px 18px 18px 4px',
              background: msg.sender === 'user' 
                ? `linear-gradient(135deg, #8B0000 0%, #5c0000 100%)` 
                : 'rgba(255,255,255,0.08)',
              color: '#fff',
              boxShadow: msg.sender === 'user'
                ? '0 4px 12px rgba(139, 0, 0, 0.3)'
                : '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5' }}>{msg.text}</p>
              <p style={{
                margin: '6px 0 0',
                fontSize: '10px',
                opacity: 0.6,
                textAlign: 'right'
              }}>{msg.time}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '16px 20px',
              borderRadius: '18px 18px 18px 4px'
            }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span key={i} style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: `${corPrimaria}99`,
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: `${delay}s`
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderTop: `1px solid ${corPrimaria}20`,
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          disabled={isTyping}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: '25px',
            border: `1px solid ${corPrimaria}30`,
            fontSize: '15px',
            outline: 'none',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isTyping || !input.trim()}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: input.trim() && !isTyping
              ? `linear-gradient(135deg, ${corPrimaria} 0%, ${corPrimaria}cc 100%)`
              : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: input.trim() && !isTyping ? `0 4px 12px ${corPrimaria}50` : 'none'
          }}
        >
          <Send size={20} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.4);
        }
      `}</style>
    </div>
  )
}
