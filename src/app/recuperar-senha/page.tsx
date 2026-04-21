'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
    if (error) { setErro('Erro ao enviar e-mail. Verifique o endereço.'); setCarregando(false); return }
    setEnviado(true)
    setCarregando(false)
  }

  const s = {
    main: { background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: "'Cormorant Garamond', Georgia, serif", display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '2rem' },
    box: { width: '100%', maxWidth: '420px', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '4px', padding: '3rem', background: 'rgba(255,255,255,0.02)' },
    label: { display: 'block', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', fontFamily: 'system-ui, sans-serif' },
    input: { width: '100%', padding: '0.9rem 1rem 0.9rem 2.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'system-ui, sans-serif' },
    btn: { width: '100%', background: '#d4af37', border: 'none', padding: '1rem', color: '#0a0a0a', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, borderRadius: '2px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', marginTop: '1rem' },
  }

  return (
    <main style={s.main}>
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '3rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#d4af37' }}>VIP<span style={{ color: '#fff' }}>Acompanhante</span></span>
      </Link>
      <div style={s.box}>
        {!enviado ? (
          <>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 300, marginBottom: '0.5rem', textAlign: 'center' }}>Recuperar senha</h1>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginBottom: '2rem', fontFamily: 'system-ui, sans-serif', fontSize: '0.9rem' }}>
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleSubmit}>
              <label style={s.label}>E-mail</label>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Mail size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={s.input} />
              </div>
              {erro && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif', marginBottom: '0.5rem' }}>{erro}</p>}
              <button type="submit" disabled={carregando} style={{ ...s.btn, opacity: carregando ? 0.7 : 1 }}>
                {carregando ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '1rem' }}>E-mail enviado!</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui, sans-serif', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
          </div>
        )}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={13} /> Voltar para o login
          </Link>
        </div>
      </div>
    </main>
  )
}
