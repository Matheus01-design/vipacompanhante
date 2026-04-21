import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ESTADOS_CONTEUDO, FAQ_ACOMPANHANTES } from '../../conteudo-seo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  params: { estado: string; cidade: string }
}

function formatarCidade(slug: string): string {
  return slug
    .split('-')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const estado = ESTADOS_CONTEUDO[params.estado]
  if (!estado) return {}

  const cidadeNome = formatarCidade(params.cidade)
  const ano = new Date().getFullYear()
  
  const titulo = `Acompanhantes em ${cidadeNome}, ${estado.sigla} - Guia Completo ${ano}`
  const descricao = `Encontre acompanhantes em ${cidadeNome}, ${estado.nome}. Guia com dicas de vida noturna, melhores bairros, hotéis e como encontrar acompanhantes de confiança em ${cidadeNome}.`

  return {
    title: titulo,
    description: descricao,
    keywords: `acompanhantes ${cidadeNome.toLowerCase()}, garotas de programa ${cidadeNome.toLowerCase()}, encontros ${cidadeNome.toLowerCase()}, acompanhantes ${estado.sigla.toLowerCase()}`,
    openGraph: {
      title: titulo,
      description: descricao,
      type: 'article',
    },
    alternates: {
      canonical: `https://vipacompanhante.com/blog/${params.estado}/${params.cidade}`
    }
  }
}

async function getDadosCidade(sigla: string, cidadeSlug: string) {
  const estado = ESTADOS_CONTEUDO[sigla]
  if (!estado) return null

  const cidadeNome = formatarCidade(cidadeSlug)

  // Buscar perfis da cidade
  const { data: perfis, count } = await supabase
    .from('acompanhantes')
    .select('id, nome, bairro, idade, preco', { count: 'exact' })
    .eq('estado', sigla.toUpperCase())
    .ilike('cidade', `%${cidadeNome}%`)
    .eq('status', 'ativo')
    .limit(50)

  // Contar bairros
  const contagemBairros: Record<string, number> = {}
  perfis?.forEach(p => {
    if (p.bairro) {
      contagemBairros[p.bairro] = (contagemBairros[p.bairro] || 0) + 1
    }
  })

  const bairrosTop = Object.entries(contagemBairros)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([bairro, qtd]) => ({ bairro, quantidade: qtd }))

  // Calcular preço médio
  const precos = perfis?.filter(p => p.preco && p.preco > 0).map(p => p.preco) || []
  const precoMedio = precos.length > 0 
    ? Math.round(precos.reduce((a, b) => a + b, 0) / precos.length)
    : null

  // Idade média
  const idades = perfis?.filter(p => p.idade).map(p => p.idade) || []
  const idadeMedia = idades.length > 0
    ? Math.round(idades.reduce((a, b) => a + b, 0) / idades.length)
    : null

  return {
    estado,
    cidadeNome,
    totalPerfis: count || 0,
    bairrosTop,
    precoMedio,
    idadeMedia
  }
}

// Conteúdo dinâmico baseado na cidade
function gerarConteudoCidade(cidade: string, estado: typeof ESTADOS_CONTEUDO['sp'], totalPerfis: number, bairros: string[]) {
  const isCapital = cidade.toLowerCase() === estado.capital.toLowerCase()
  
  const introducao = isCapital
    ? `${cidade} é a capital do ${estado.nome} e oferece uma das maiores variedades de acompanhantes do estado. A cidade é conhecida pela vida noturna movimentada e opções para todos os gostos e bolsos.`
    : `${cidade} é uma das principais cidades do ${estado.nome} para quem busca acompanhantes de qualidade. Mesmo não sendo a capital, a cidade oferece excelentes opções para encontros discretos.`

  const sobreVidaNoturna = isCapital
    ? estado.vidaNoturna
    : `${cidade} tem sua própria cena de vida noturna, com bares, restaurantes e casas noturnas que funcionam principalmente nos finais de semana. A cidade oferece um ambiente mais tranquilo e discreto comparado à capital.`

  const dicasLocais = isCapital
    ? estado.dicasEncontro
    : `Em ${cidade}, os melhores locais para encontros são hotéis no centro da cidade ou em bairros comerciais. A cidade oferece mais privacidade que grandes centros, sendo ideal para quem busca discrição total.`

  const hoteisLocal = isCapital
    ? estado.hoteisSugeridos
    : `${cidade} conta com hotéis executivos no centro e motéis nas estradas de acesso. Para encontros discretos, prefira hotéis com entrada independente ou motéis na saída da cidade.`

  const bairrosTexto = bairros.length > 0
    ? `Os bairros mais populares para encontros em ${cidade} incluem ${bairros.slice(0, 4).join(', ')}. Essas regiões concentram a maioria das acompanhantes ativas na cidade.`
    : `${cidade} oferece diversas opções de bairros para encontros discretos. Consulte os perfis das acompanhantes para verificar a região de atendimento.`

  return {
    introducao,
    sobreVidaNoturna,
    dicasLocais,
    hoteisLocal,
    bairrosTexto
  }
}

export default async function CidadePage({ params }: Props) {
  const dados = await getDadosCidade(params.estado, params.cidade)
  
  if (!dados) {
    notFound()
  }

  const { estado, cidadeNome, totalPerfis, bairrosTop, precoMedio, idadeMedia } = dados
  const bairrosNomes = bairrosTop.map(b => b.bairro)
  const conteudo = gerarConteudoCidade(cidadeNome, estado, totalPerfis, bairrosNomes)

  // Schema markup
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `Acompanhantes em ${cidadeNome}, ${estado.sigla}`,
    "description": conteudo.introducao,
    "author": { "@type": "Organization", "name": "VIP Acompanhante" },
    "publisher": { "@type": "Organization", "name": "VIP Acompanhante" },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0]
  }

  const localSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Acompanhantes em ${cidadeNome}`,
    "description": `Encontre acompanhantes em ${cidadeNome}, ${estado.nome}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cidadeNome,
      "addressRegion": estado.sigla,
      "addressCountry": "BR"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }}
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
            <Link href={`/blog/${params.estado}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{estado.nome}</Link>
            {' > '}
            <span style={{ color: '#d4af37' }}>{cidadeNome}</span>
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
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            fontWeight: 300,
            marginBottom: '1rem'
          }}>
            Acompanhantes em {cidadeNome}, {estado.sigla}
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: 1.7
          }}>
            {conteudo.introducao}
          </p>
          
          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2.5rem',
            marginTop: '2rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#d4af37' }}>{totalPerfis}</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Acompanhantes</p>
            </div>
            {precoMedio && (
              <div>
                <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff' }}>R${precoMedio}</p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Valor médio</p>
              </div>
            )}
            {idadeMedia && (
              <div>
                <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff' }}>{idadeMedia}</p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Idade média</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff' }}>{bairrosTop.length}+</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Bairros</p>
            </div>
          </div>
        </section>

        {/* Conteúdo */}
        <article style={{ padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
          
          {/* Vida Noturna */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.7rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Vida Noturna em {cidadeNome}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
              {conteudo.sobreVidaNoturna}
            </p>
          </section>

          {/* Bairros */}
          {bairrosTop.length > 0 && (
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.7rem',
                fontWeight: 400,
                marginBottom: '1rem',
                color: '#d4af37'
              }}>
                Bairros com Acompanhantes em {cidadeNome}
              </h2>
              <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: '1rem' }}>
                {conteudo.bairrosTexto}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.75rem'
              }}>
                {bairrosTop.map((b, i) => (
                  <div key={i} style={{
                    background: 'rgba(139,0,0,0.15)',
                    border: '1px solid rgba(139,0,0,0.25)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{b.bairro}</span>
                    <span style={{ 
                      background: 'rgba(212,175,55,0.2)', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      color: '#d4af37'
                    }}>
                      {b.quantidade}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dicas */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.7rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Dicas para Encontros em {cidadeNome}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
              {conteudo.dicasLocais}
            </p>
            
            <div style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#d4af37', marginBottom: '0.75rem', fontSize: '1rem' }}>
                💡 Dicas de segurança:
              </h4>
              <ul style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, paddingLeft: '1.2rem' }}>
                <li>Sempre combine os detalhes antes por mensagem</li>
                <li>Prefira encontros em locais públicos primeiro ou hotéis conhecidos</li>
                <li>Verifique se o perfil é verificado antes de agendar</li>
                <li>Trate a profissional sempre com respeito</li>
              </ul>
            </div>
          </section>

          {/* Hotéis */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.7rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: '#d4af37'
            }}>
              Hotéis e Motéis em {cidadeNome}
            </h2>
            <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
              {conteudo.hoteisLocal}
            </p>
          </section>

          {/* Preços */}
          {precoMedio && (
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.7rem',
                fontWeight: 400,
                marginBottom: '1rem',
                color: '#d4af37'
              }}>
                Valores em {cidadeNome}
              </h2>
              <p style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
                O valor médio das acompanhantes em {cidadeNome} é de aproximadamente <strong style={{ color: '#d4af37' }}>R${precoMedio}</strong> por hora. 
                Os preços podem variar de acordo com a experiência da profissional, serviços oferecidos e tempo de atendimento. 
                Acompanhantes de alto padrão e com serviços diferenciados podem cobrar valores maiores.
              </p>
            </section>
          )}

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
              Ver Acompanhantes em {cidadeNome}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
              {totalPerfis > 0 
                ? `${totalPerfis} acompanhantes disponíveis agora em ${cidadeNome}`
                : `Encontre acompanhantes em ${cidadeNome} e região`
              }
            </p>
            <Link href={`/mulheres/${params.estado}/${params.cidade}`} style={{
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

          {/* Outras cidades */}
          <section style={{ marginTop: '3rem' }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.3rem',
              fontWeight: 400,
              marginBottom: '1rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              Veja também em {estado.nome}:
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {estado.bairrosTop.slice(0, 6).map((local, i) => (
                <Link
                  key={i}
                  href={`/blog/${params.estado}`}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    textDecoration: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.9rem'
                  }}
                >
                  {local}
                </Link>
              ))}
              <Link
                href={`/blog/${params.estado}`}
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  color: '#d4af37',
                  fontSize: '0.9rem'
                }}
              >
                Ver mais em {estado.nome} →
              </Link>
            </div>
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
              fontSize: '1.8rem',
              fontWeight: 400,
              marginBottom: '2rem',
              textAlign: 'center',
              color: '#d4af37'
            }}>
              Dúvidas Frequentes sobre Acompanhantes em {cidadeNome}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQ_ACOMPANHANTES.slice(0, 3).map((faq, i) => (
                <details key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(139,0,0,0.2)',
                  borderRadius: '8px',
                  padding: '1rem 1.5rem'
                }}>
                  <summary style={{
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#fff'
                  }}>
                    {faq.pergunta.replace('?', ` em ${cidadeNome}?`)}
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
