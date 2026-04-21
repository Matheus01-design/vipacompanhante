'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
      return
    }

    // Verificar tipo de usuário para redirecionar
    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('user_id', data.user.id)
      .single()

    if (perfil?.tipo === 'admin') {
      router.push('/admin')
    } else if (perfil?.tipo === 'acompanhante') {
      router.push('/minha-conta')
    } else {
      router.push('/')
    }
  }

  return (
    <main style={{
      background: '#0a0a0a', minHeight: '100vh', color: '#fff',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '3rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#d4af37' }}>
          VIP<span style={{ color: '#fff' }}>Acompanhante</span>
        </span>
      </Link>

      <div style={{
        width: '100%', maxWidth: '420px',
        border: '1px solid rgba(212,175,55,0.2)', borderRadius: '4px',
        padding: '3rem', background: 'rgba(255,255,255,0.02)'
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 300, marginBottom: '0.5rem', textAlign: 'center' }}>
          Bem-vinda de volta
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginBottom: '2.5rem', fontFamily: 'system-ui, sans-serif', fontSize: '0.9rem' }}>
          Entre com sua conta
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* E-mail */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'system-ui, sans-serif' }}>
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '0.9rem 1rem 0.9rem 2.7rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '2px', color: '#fff', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'system-ui, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontFamily: 'system-ui, sans-serif' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha} onChange={e => setSenha(e.target.value)}
                required placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.9rem 3rem 0.9rem 2.7rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '2px', color: '#fff', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'system-ui, sans-serif'
                }}
              />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{
                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', padding: 0
              }}>
                {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {erro && (
            <p style={{ color: '#ff6b6b', fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando} style={{
            background: '#d4af37', border: 'none', padding: '1rem',
            color: '#0a0a0a', fontWeight: 700, fontSize: '0.9rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            borderRadius: '2px', cursor: carregando ? 'not-allowed' : 'pointer',
            opacity: carregando ? 0.7 : 1, fontFamily: 'system-ui, sans-serif',
            marginTop: '0.5rem'
          }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: '0.85rem' }}>
          <Link href="/recuperar-senha" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            Esqueci minha senha
          </Link>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          Não tem conta?{' '}
          <Link href="/cadastro" style={{ color: '#d4af37', textDecoration: 'none' }}>
            Cadastre-se grátis
          </Link>
        </div>
      </div>
    </main>
  )
}
