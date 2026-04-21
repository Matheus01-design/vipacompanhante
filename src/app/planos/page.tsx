import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Crown, Star, Zap } from 'lucide-react'
import { PLANOS } from '@/types'

export const metadata: Metadata = {
  title: 'Planos e Preços',
  description: 'Escolha o plano ideal para aumentar sua visibilidade. Comece grátis hoje.',
}

export default function PlanosPage() {
  const icones = { gratis: <Zap size={24} />, vip: <Star size={24} />, super_vip: <Crown size={24} /> }

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(212,175,55,0.15)', padding: '0 2rem', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d4af37' }}>VIP<span style={{ color: '#fff' }}>Acompanhante</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Entrar</Link>
          <Link href="/cadastro" style={{ color: '#0a0a0a', background: '#d4af37', textDecoration: 'none', padding: '0.5rem 1.2rem', borderRadius: '2px', fontSize: '0.85rem', fontWeight: 600 }}>Cadastrar</Link>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <p style={{ color: '#d4af37', fontSize: '0.75rem', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: '1rem' }}>Para acompanhantes</p>
          <h1 style={{ fontSize: '3rem', fontWeight: 300, marginBottom: '1.5rem' }}>
            Escolha seu <em style={{ fontStyle: 'italic', color: '#d4af37' }}>plano</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontFamily: 'system-ui, sans-serif', fontWeight: 300 }}>
            Comece grátis. Faça upgrade quando quiser mais visibilidade.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {PLANOS.map(plano => (
            <div key={plano.id} style={{
              border: `1px solid ${plano.destaque ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '4px', padding: '2.5rem',
              background: plano.destaque ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
              position: 'relative',
              transform: plano.destaque ? 'scale(1.03)' : 'scale(1)'
            }}>
              {plano.destaque && (
                <div style={{
                  position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                  background: '#d4af37', color: '#0a0a0a',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em',
                  padding: '0.3rem 1rem', borderRadius: '0 0 4px 4px',
                  textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif'
                }}>
                  Recomendado
                </div>
              )}

              {/* Ícone */}
              <div style={{ color: plano.destaque ? '#d4af37' : 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                {icones[plano.id]}
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.5rem' }}>{plano.nome}</h2>

              <div style={{ marginBottom: '2rem' }}>
                {plano.preco === 0 ? (
                  <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#d4af37' }}>Grátis</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui, sans-serif' }}>R$</span>
                    <span style={{ fontSize: '3rem', fontWeight: 300, color: '#d4af37', lineHeight: 1 }}>{plano.preco.toFixed(2).replace('.', ',')}</span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'system-ui, sans-serif' }}>/{plano.periodo}</span>
                  </div>
                )}
              </div>

              <ul style={{ listStyle: 'none', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {plano.beneficios.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'system-ui, sans-serif', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                    <Check size={14} style={{ color: '#d4af37', flexShrink: 0 }} />
                    {b}
                  </li>
                ))}
              </ul>

              <Link href={`/cadastro?plano=${plano.id}`} style={{
                display: 'block', textAlign: 'center',
                background: plano.destaque ? '#d4af37' : 'transparent',
                border: `1px solid ${plano.destaque ? '#d4af37' : 'rgba(255,255,255,0.2)'}`,
                color: plano.destaque ? '#0a0a0a' : '#fff',
                padding: '0.9rem', borderRadius: '2px',
                textDecoration: 'none', fontWeight: plano.destaque ? 700 : 400,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif'
              }}>
                {plano.preco === 0 ? 'Começar grátis' : 'Assinar agora'}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '6rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 300, textAlign: 'center', marginBottom: '3rem' }}>
            Dúvidas <em style={{ fontStyle: 'italic', color: '#d4af37' }}>frequentes</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { p: 'Posso começar grátis?', r: 'Sim! O plano grátis é permanente. Você pode anunciar seu perfil sem custo algum.' },
              { p: 'Como funciona o pagamento?', r: 'Pagamento via MercadoPago (PIX, cartão de crédito ou débito). 100% seguro.' },
              { p: 'Posso cancelar a qualquer momento?', r: 'Sim. Você cancela quando quiser direto pelo seu painel, sem burocracia.' },
              { p: 'Quanto tempo leva para meu perfil aparecer?', r: 'Após o cadastro, sua conta passa por verificação em até 24h.' },
            ].map((item, i) => (
              <div key={i} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 400, marginBottom: '0.75rem' }}>{item.p}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, fontWeight: 300 }}>{item.r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
