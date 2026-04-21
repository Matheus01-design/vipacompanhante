'use client'

import Link from 'next/link'
import { ESTADOS_CONTEUDO } from './conteudo-seo'

const metadata = {
  title: 'Blog - Guia de Acompanhantes no Brasil | VIP Acompanhante',
  description: 'Guia completo de acompanhantes em todas as capitais e cidades do Brasil. Dicas de encontros, vida noturna, hotéis e melhores bairros para encontros discretos.',
  keywords: 'acompanhantes brasil, garotas de programa, guia acompanhantes, encontros discretos, vida noturna brasil',
  openGraph: {
    title: 'Guia de Acompanhantes no Brasil | VIP Acompanhante',
    description: 'Guia completo de acompanhantes em todas as capitais e cidades do Brasil.',
    type: 'website',
  }
}

export default function BlogPage() {
  const estados = Object.entries(ESTADOS_CONTEUDO).sort((a, b) => 
    a[1].nome.localeCompare(b[1].nome)
  )

  const regioes = {
    'Norte': ['ac', 'ap', 'am', 'pa', 'ro', 'rr', 'to'],
    'Nordeste': ['al', 'ba', 'ce', 'ma', 'pb', 'pe', 'pi', 'rn', 'se'],
    'Centro-Oeste': ['df', 'go', 'mt', 'ms'],
    'Sudeste': ['es', 'mg', 'rj', 'sp'],
    'Sul': ['pr', 'rs', 'sc']
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)',
      color: '#fff'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid rgba(139,0,0,0.3)',
        padding: '1rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#d4af37', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700 }}>
            VIP Acompanhante
          </Link>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Início</Link>
            <Link href="/blog" style={{ color: '#d4af37', textDecoration: 'none' }}>Blog</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(139,0,0,0.2) 0%, transparent 100%)'
      }}>
        <h1 style={{ 
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 300,
          marginBottom: '1rem',
          color: '#fff'
        }}>
          Guia de Acompanhantes no Brasil
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'rgba(255,255,255,0.7)',
          maxWidth: '700px',
          margin: '0 auto',
          lineHeight: 1.7
        }}>
          Encontre as melhores acompanhantes em todas as capitais e principais cidades do Brasil. 
          Dicas de vida noturna, hotéis, bairros e tudo que você precisa saber para encontros discretos e seguros.
        </p>
      </section>

      {/* Estados por Região */}
      <section style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {Object.entries(regioes).map(([regiao, siglas]) => (
          <div key={regiao} style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '1.5rem',
              color: '#d4af37',
              borderBottom: '1px solid rgba(212,175,55,0.3)',
              paddingBottom: '0.5rem'
            }}>
              {regiao}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {siglas.map(sigla => {
                const estado = ESTADOS_CONTEUDO[sigla]
                if (!estado) return null
                return (
                  <Link 
                    key={sigla}
                    href={`/blog/${sigla}`}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(139,0,0,0.2)',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(139,0,0,0.15)'
                      e.currentTarget.style.borderColor = 'rgba(139,0,0,0.4)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = 'rgba(139,0,0,0.2)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <h3 style={{ 
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '1.3rem',
                      fontWeight: 500,
                      marginBottom: '0.5rem'
                    }}>
                      {estado.nome} ({estado.sigla})
                    </h3>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '0.75rem'
                    }}>
                      Capital: {estado.capital}
                    </p>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.6
                    }}>
                      {estado.vidaNoturna.slice(0, 120)}...
                    </p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '1rem',
                      fontSize: '0.85rem',
                      color: '#d4af37'
                    }}>
                      Ver guia completo →
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'rgba(0,0,0,0.3)',
        marginTop: '2rem'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '2rem',
            fontWeight: 400,
            marginBottom: '2rem',
            textAlign: 'center',
            color: '#d4af37'
          }}>
            Perguntas Frequentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                p: 'Como encontrar acompanhantes de confiança?',
                r: 'Procure sites especializados com perfis verificados, leia descrições completas e verifique fotos recentes. Prefira acompanhantes com selos de verificação.'
              },
              {
                p: 'Qual o preço médio de uma acompanhante?',
                r: 'Os valores variam por cidade e experiência. Em capitais, partem de R$200/hora, podendo chegar a R$1.000+ para alto padrão.'
              },
              {
                p: 'É seguro contratar acompanhantes pela internet?',
                r: 'Sim, usando sites confiáveis, verificando perfis autênticos e encontrando-se em locais seguros como hotéis.'
              },
              {
                p: 'Acompanhantes atendem em hotéis?',
                r: 'Sim, a maioria atende em hotéis e motéis. Muitas também têm local próprio ou fazem saídas para eventos.'
              }
            ].map((faq, i) => (
              <details key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(139,0,0,0.2)',
                borderRadius: '8px',
                padding: '1rem 1.5rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: '#fff',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {faq.p}
                  <span style={{ color: '#d4af37' }}>+</span>
                </summary>
                <p style={{
                  marginTop: '1rem',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7
                }}>
                  {faq.r}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2rem',
          fontWeight: 400,
          marginBottom: '1rem'
        }}>
          Encontre Acompanhantes Agora
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
          Milhares de perfis verificados em todo o Brasil
        </p>
        <Link href="/" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #8B0000 0%, #5c0000 100%)',
          color: '#fff',
          padding: '1rem 2.5rem',
          borderRadius: '50px',
          textDecoration: 'none',
          fontSize: '1.1rem',
          fontWeight: 500
        }}>
          Ver Acompanhantes
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0,0,0,0.5)',
        borderTop: '1px solid rgba(139,0,0,0.2)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
          © 2026 VIP Acompanhante - Todos os direitos reservados
        </p>
      </footer>
    </main>
  )
}
