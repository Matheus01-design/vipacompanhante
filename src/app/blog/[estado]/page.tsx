import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ESTADOS_CONTEUDO, CIDADES_TOP, FAQ_ACOMPANHANTES } from '../conteudo-seo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  params: { estado: string }
}

export async function generateStaticParams() {
  return Object.keys(ESTADOS_CONTEUDO).map(estado => ({ estado }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const estado = ESTADOS_CONTEUDO[params.estado]
  if (!estado) return {}

  const titulo = `Acompanhantes em ${estado.nome} - Guia Completo ${new Date().getFullYear()}`
  const descricao = `Encontre as melhores acompanhantes em ${estado.capital} e ${estado.nome}. Guia completo com dicas de vida noturna, hotéis, bairros e encontros discretos.`

  return {
    title: titulo,
    description: descricao,
    keywords: estado.palavrasChave.join(', '),
    openGraph: {
      title: titulo,
      description: descricao,
      type: 'article',
    },
    alternates: {
      canonical: `https://vipacompanhante.com/blog/${params.estado}`
    }
  }
}

async function getDadosEstado(sigla: string) {
  const estado = ESTADOS_CONTEUDO[sigla]
  if (!estado) return null

  // Buscar dados reais do banco
  const { count: totalPerfis } = await supabase
    .from('acompanhantes')
    .select('*', { count: 'exact', head: true })
    .eq('estado', sigla.toUpperCase())
    .eq('status', 'ativo')

  // Buscar cidades com mais perfis
  const { data: cidadesData } = await supabase
    .from('acompanhantes')
    .select('cidade')
    .eq('estado', sigla.toUpperCase())
    .eq('status', 'ativo')

  const contagemCidades: Record<string, number> = {}
  cidadesData?.forEach(p => {
    if (p.cidade) {
      contagemCidades[p.cidade] = (contagemCidades[p.cidade] || 0) + 1
    }
  })

  const cidadesTop = Object.entries(contagemCidades)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cidade, qtd]) => ({ cidade, quantidade: qtd }))

  // Buscar bairros mais populares
  const { data: bairrosData } = await supabase
    .from('acompanhantes')
    .select('bairro')
    .eq('estado', sigla.toUpperCase())
    .eq('status', 'ativo')
    .not('bairro', 'is', null)

  const contagemBairros: Record<string, number> = {}
  bairrosData?.forEach(p => {
    if (p.bairro) {
      contagemBairros[p.bairro] = (contagemBairros[p.bairro] || 0) + 1
    }
  })

  const bairrosTop = Object.entries(contagemBairros)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([bairro, qtd]) => ({ bairro, quantidade: qtd }))

  return {
    estado,
    totalPerfis: totalPerfis || 0,
    cidadesTop,
    bairrosTop
  }
}

export default async function EstadoPage({ params }: Props) {
  const dados = await getDadosEstado(params.estado)
  
  if (!dados) {
    notFound()
  }

  const { estado, totalPerfis, cidadesTop, bairrosTop } = dados
  const cidadesTopList = CIDADES_TOP[params.estado] || []

  // Schema markup para SEO
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `Acompanhantes em ${estado.nome} - Guia Completo`,
    "description": `Guia completo de acompanhantes em ${estado.capital} e ${estado.nome}`,
    "author": {
      "@type": "Organization",
      "name": "VIP Acompanhante"
    },
    "publisher": {
      "@type": "Organization",
      "name": "VIP Acompanhante"
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0]
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ACOMPANHANTES.slice(0, 4).map(faq => ({
      "@type": "Question",
      "name": faq.pergunta,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.resposta
      }
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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

        {/* Breadcrumb */}
        <div style={{ padding: '1rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <nav style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Início</Link>
            {' > '}
            <Link href="/blog" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Blog</Link>
            {' > '}
            <span style={{ color: '#d4af37' }}>{estado.nome}</span>
          </nav>
        </div>

        {/* Hero */}
        <section style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(139,0,0,0.2) 0%, transparent 100%)'
        }}>
          <h1 style={{ 
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 300,
            marginBottom: '1rem'
          }}>
            Acompanhantes em {estado.nome}
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '700px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.7
          }}>
            Guia completo para encontrar acompanhantes em {estado.capital} e principais cidades do {estado.nome}. 
            Dicas de vida noturna, melhores bairros e hotéis para encontros discretos.
          </p>
          
          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#d4af37' }}>{totalPerfis}</p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Acompanhantes ativas</p>
            </div>
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff' }}>{cidadesTop.length}</p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Cidades atendidas</p>
            </div>
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff' }}>{bairrosTop.length}+</p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Bairros</p>
            </div>
          </div>
        </section>

        {/* Conteúdo Principal */}
        <article style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
          
          {/* Sobre o Estado */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Sobre {estado.nome}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: '1rem' }}>
              {estado.cultura}
            </p>
          </section>

          {/* Vida Noturna */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Vida Noturna em {estado.capital}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
              {estado.vidaNoturna}
            </p>
          </section>

          {/* Melhores Bairros */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Melhores Bairros para Encontros em {estado.capital}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: '1rem' }}>
              Os bairros mais procurados para encontros com acompanhantes em {estado.capital} são:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              {estado.bairrosTop.map((bairro, i) => (
                <span key={i} style={{
                  background: 'rgba(139,0,0,0.2)',
                  border: '1px solid rgba(139,0,0,0.3)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  textAlign: 'center'
                }}>
                  {bairro}
                </span>
              ))}
            </div>
            {bairrosTop.length > 0 && (
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
                Dados reais: {bairrosTop.slice(0, 5).map(b => `${b.bairro} (${b.quantidade})`).join(', ')}
              </p>
            )}
          </section>

          {/* Dicas de Encontro */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Dicas para Encontros em {estado.nome}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: '1rem' }}>
              {estado.dicasEncontro}
            </p>
            <div style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginTop: '1rem'
            }}>
              <p style={{ color: '#d4af37', fontWeight: 500, marginBottom: '0.5rem' }}>
                ⏰ Melhor horário:
              </p>
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                {estado.melhorHorario}
              </p>
            </div>
          </section>

          {/* Hotéis */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Hotéis e Motéis em {estado.capital}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
              {estado.hoteisSugeridos}
            </p>
          </section>

          {/* Cidades do Estado */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Cidades com Acompanhantes em {estado.nome}
            </h2>
            
            {cidadesTop.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {cidadesTop.map((c, i) => (
                  <Link
                    key={i}
                    href={`/blog/${params.estado}/${c.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(139,0,0,0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      textDecoration: 'none',
                      color: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{c.cidade}</span>
                    <span style={{
                      background: 'rgba(139,0,0,0.3)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      color: '#d4af37'
                    }}>
                      {c.quantidade}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {cidadesTopList.slice(0, 10).map((cidade, i) => (
                  <Link
                    key={i}
                    href={`/blog/${params.estado}/${cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(139,0,0,0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      textDecoration: 'none',
                      color: '#fff'
                    }}
                  >
                    {cidade.charAt(0).toUpperCase() + cidade.slice(1)}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* CTA */}
          <section style={{
            background: 'linear-gradient(135deg, rgba(139,0,0,0.3) 0%, rgba(90,0,0,0.3) 100%)',
            border: '1px solid rgba(139,0,0,0.4)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            marginTop: '3rem'
          }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.5rem',
              marginBottom: '1rem'
            }}>
              Ver Acompanhantes em {estado.nome}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
              {totalPerfis} acompanhantes verificadas disponíveis agora
            </p>
            <Link href={`/mulheres/${params.estado}`} style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #8B0000 0%, #5c0000 100%)',
              color: '#fff',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              Ver Acompanhantes →
            </Link>
          </section>
        </article>

        {/* FAQ */}
        <section style={{
          padding: '4rem 2rem',
          background: 'rgba(0,0,0,0.3)'
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
              {FAQ_ACOMPANHANTES.slice(0, 4).map((faq, i) => (
                <details key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,0,0,0.2)',
                  borderRadius: '8px',
                  padding: '1rem 1.5rem'
                }}>
                  <summary style={{
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    color: '#fff'
                  }}>
                    {faq.pergunta}
                  </summary>
                  <p style={{
                    marginTop: '1rem',
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.7
                  }}>
                    {faq.resposta}
                  </p>
                </details>
              ))}
            </div>
          </div>
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
    </>
  )
}
