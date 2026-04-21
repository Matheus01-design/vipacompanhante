'use client'
import { useState } from 'react'
import { Flag, X, AlertTriangle, CheckCircle } from 'lucide-react'

const COR = '#8B0000'

const MOTIVOS = [
  'Fotos falsas ou roubadas',
  'Perfil de menor de idade',
  'Golpe ou fraude',
  'Perfil duplicado',
  'Informações falsas',
  'Spam ou propaganda',
  'Conteúdo ofensivo',
  'Outro'
]

interface Props {
  acompanhanteId: string
  acompanhanteNome: string
}

export default function BotaoDenuncia({ acompanhanteId, acompanhanteNome }: Props) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const enviar = async () => {
    if (!motivo) {
      setErro('Selecione um motivo')
      return
    }
    
    setEnviando(true)
    setErro('')
    
    try {
      const res = await fetch('/api/denuncias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acompanhante_id: acompanhanteId,
          motivo,
          descricao,
          email
        })
      })
      
      if (res.ok) {
        setEnviado(true)
      } else {
        setErro('Erro ao enviar. Tente novamente.')
      }
    } catch (e) {
      setErro('Erro de conexão. Tente novamente.')
    }
    
    setEnviando(false)
  }

  const fechar = () => {
    setAberto(false)
    setMotivo('')
    setDescricao('')
    setEmail('')
    setEnviado(false)
    setErro('')
  }

  return (
    <>
      {/* Botão */}
      <button
        onClick={() => setAberto(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: '1px solid #ddd',
          padding: '10px 16px',
          borderRadius: '6px',
          color: '#888',
          fontSize: '13px',
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
          marginTop: '16px'
        }}
      >
        <Flag size={14} />
        Denunciar anúncio
      </button>

      {/* Modal */}
      {aberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '450px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color={COR} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#222' }}>
                  Denunciar Anúncio
                </h3>
              </div>
              <button onClick={fechar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#888" />
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '20px' }}>
              {enviado ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle size={48} color="#00b450" style={{ marginBottom: '12px' }} />
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#222', marginBottom: '8px' }}>
                    Denúncia Enviada!
                  </h4>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                    Obrigado por ajudar a manter nossa plataforma segura. Vamos analisar sua denúncia em breve.
                  </p>
                  <button
                    onClick={fechar}
                    style={{
                      background: COR,
                      color: '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                    Denunciando: <strong>{acompanhanteNome}</strong>
                  </p>

                  {/* Motivo */}
                  <label style={{ display: 'block', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>
                      Motivo da denúncia *
                    </span>
                    <select
                      value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#333',
                        background: '#fff'
                      }}
                    >
                      <option value="">Selecione...</option>
                      {MOTIVOS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </label>

                  {/* Descrição */}
                  <label style={{ display: 'block', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>
                      Detalhes (opcional)
                    </span>
                    <textarea
                      value={descricao}
                      onChange={e => setDescricao(e.target.value)}
                      placeholder="Descreva o problema com mais detalhes..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#333',
                        resize: 'vertical'
                      }}
                    />
                  </label>

                  {/* Email */}
                  <label style={{ display: 'block', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>
                      Seu email (opcional)
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Para recebermos retorno"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#333'
                      }}
                    />
                  </label>

                  {erro && (
                    <p style={{ color: '#d32f2f', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>
                  )}

                  <button
                    onClick={enviar}
                    disabled={enviando}
                    style={{
                      width: '100%',
                      background: COR,
                      color: '#fff',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: enviando ? 'wait' : 'pointer',
                      opacity: enviando ? 0.7 : 1
                    }}
                  >
                    {enviando ? 'Enviando...' : 'Enviar Denúncia'}
                  </button>

                  <p style={{ color: '#999', fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>
                    Denúncias falsas podem resultar em bloqueio da sua conta.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
