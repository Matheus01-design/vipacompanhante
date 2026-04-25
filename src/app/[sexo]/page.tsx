import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Filter, Shield, Crown, Star, ChevronDown } from 'lucide-react'
import { getAcompanhantes } from '@/lib/queries'
import { ESTADOS_BR, type Sexo } from '@/types'

interface Props {
  params: { sexo: string }
  searchParams: { estado?: string; cidade?: string; pagina?: string; plano?: string; atendimento?: string }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const sexoLabel = params.sexo === 'mulheres' ? 'Mulheres Acompanhantes' : 'Homens Acompanhantes'
  const estadoLabel = searchParams.estado ? ` no ${ESTADOS_BR[searchParams.estado] || searchParams.estado}` : ' no Brasil'
  const cidadeLabel = searchParams.cidade ? ` em ${searchParams.cidade}` : ''
  return {
    title: `${sexoLabel}${cidadeLabel}${estadoLabel}`,
    description: `Encontre ${sexoLabel.toLowerCase()}${cidadeLabel}${estadoLabel}. Perfis verificados, fotos reais e total discrição.`,
    alternates: { canonical: `https://www.vipacompanhante.com/${params.sexo}/` },
  }
}

export default async function ListagemPage({ params, searchParams }: Props) {
  const sexo = params.sexo === 'mulheres' ? 'mulher' : 'homem' as Sexo
  const pagina = parseInt(searchParams.pagina || '1')

  const { acompanhantes, total } = await getAcompanhantes({
    sexo,
    estado: searchParams.estado,
    cidade: searchParams.cidade,
    plano: searchParams.plano as any,
  }, pagina)

  const totalPaginas = Math.ceil(total / 24)
  const titulo = params.sexo === 'mulheres' ? 'Mulheres Acompanhantes' : 'Homens Acompanhantes'

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>

      {/* HEADER */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        padding: '0 2rem', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.05em', color: '#d4af37' }}>
            VIP<span style={{ color: '#fff' }}>Acompanhante</span>
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <Link href="/mulheres" style={{ color: params.sexo === 'mulheres' ? '#d4af37' : '#ccc', textDecoration: 'none', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mulheres</Link>
          <Link href="/homens" style={{ color: params.sexo === 'homens' ? '#d4af37' : '#ccc', textDecoration: 'none', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Homens</Link>
          <Link href="/planos" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Planos</Link>
          <Link href="/login" style={{
            color: '#0a0a0a', background: '#d4af37', textDecoration: 'none',
            padding: '0.45rem 1.2rem', borderRadius: '2px',
            fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600
          }}>Entrar</Link>
        </nav>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

        {/* BREADCRUMB + TÍTULO */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem', fontFamily: 'system-ui, sans-serif' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Início</Link>
            {' '}/{' '}
            <span style={{ color: '#d4af37' }}>{titulo}</span>
            {searchParams.estado && <> / {ESTADOS_BR[searchParams.estado]}</>}
            {searchParams.cidade && <> / {searchParams.cidade}</>}
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 300 }}>
            {titulo}
            {searchParams.cidade && <> em <em style={{ fontStyle: 'italic', color: '#d4af37' }}>{searchParams.cidade}</em></>}
            {!searchParams.cidade && searchParams.estado && <> no <em style={{ fontStyle: 'italic', color: '#d4af37' }}>{ESTADOS_BR[searchParams.estado]}</em></>}
            {!searchParams.cidade && !searchParams.estado && <> no <em style={{ fontStyle: 'italic', color: '#d4af37' }}>Brasil</em></>}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.5rem', fontFamily: 'system-ui, sans-serif' }}>
            {total} perfis encontrados
          </p>
        </div>

        {/* FILTROS */}
        <form style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem',
          padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '4px', background: 'rgba(255,255,255,0.02)'
        }}>
          <select name="estado" defaultValue={searchParams.estado || ''} style={{
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', padding: '0.6rem 1rem', borderRadius: '2px',
            fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
            fontFamily: 'system-ui, sans-serif', minWidth: '160px'
          }}>
            <option value="">Todos os estados</option>
            {Object.entries(ESTADOS_BR).sort((a,b) => a[1].localeCompare(b[1])).map(([s, n]) => (
              <option key={s} value={s}>{n}</option>
            ))}
          </select>

          <select name="plano" defaultValue={searchParams.plano || ''} style={{
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', padding: '0.6rem 1rem', borderRadius: '2px',
            fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
            fontFamily: 'system-ui, sans-serif', minWidth: '140px'
          }}>
            <option value="">Todos os planos</option>
            <option value="super_vip">Super VIP</option>
            <option value="vip">VIP</option>
            <option value="gratis">Grátis</option>
          </select>

          <select name="atendimento" defaultValue={searchParams.atendimento || ''} style={{
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', padding: '0.6rem 1rem', borderRadius: '2px',
            fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
            fontFamily: 'system-ui, sans-serif', minWidth: '160px'
          }}>
            <option value="">Atende quem?</option>
            <option value="homens">Homens</option>
            <option value="mulheres">Mulheres</option>
            <option value="casais">Casais</option>
          </select>

          <button type="submit" style={{
            background: '#d4af37', border: 'none', padding: '0.6rem 1.5rem',
            cursor: 'pointer', color: '#0a0a0a', fontWeight: 600,
            fontSize: '0.85rem', letterSpacing: '0.05em', borderRadius: '2px',
            fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Filter size={14} /> Filtrar
          </button>
        </form>

        {/* GRID */}
        {acompanhantes.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '4rem'
          }}>
            {acompanhantes.map(a => {
              const badgeLabel = a.plano === 'super_vip' ? 'Super VIP' : a.plano === 'vip' ? 'VIP' : null
              const badgeColor = a.plano === 'super_vip' ? '#d4af37' : '#c0c0c0'
              return (
                <Link key={a.id} href={`/acompanhante/${a.slug}/`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <article style={{
                    border: `1px solid ${a.plano === 'super_vip' ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '4px', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)', cursor: 'pointer'
                  }}>
                    <div style={{ position: 'relative', aspectRatio: '3/4', background: '#151515' }}>
                      {a.foto_capa ? (
                        <Image src={a.foto_capa} alt={a.nome} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '2.5rem' }}>✦</div>
                      )}
                      {badgeLabel && (
                        <div style={{
                          position: 'absolute', top: '0.6rem', left: '0.6rem',
                          background: badgeColor, color: '#0a0a0a',
                          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                          padding: '0.2rem 0.5rem', borderRadius: '2px', textTransform: 'uppercase',
                          fontFamily: 'system-ui, sans-serif'
                        }}>{badgeLabel}</div>
                      )}
                      {a.verificado && (
                        <div style={{
                          position: 'absolute', top: '0.6rem', right: '0.6rem',
                          background: 'rgba(0,180,80,0.9)', color: '#fff',
                          fontSize: '0.55rem', fontWeight: 700,
                          padding: '0.2rem 0.4rem', borderRadius: '2px',
                          fontFamily: 'system-ui, sans-serif',
                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                        }}>
                          <Shield size={8} /> OK
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '0.9rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 400, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={10} /> {a.cidade} – {a.estado}
                      </p>
                      {a.preco && <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#d4af37', fontFamily: 'system-ui, sans-serif' }}>{a.preco}</p>}
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>✦</p>
            <p style={{ fontFamily: 'system-ui, sans-serif' }}>Nenhum perfil encontrado para os filtros selecionados.</p>
          </div>
        )}

        {/* PAGINAÇÃO */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
            {Array.from({ length: Math.min(totalPaginas, 10) }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`?${new URLSearchParams({ ...searchParams, pagina: String(p) })}`} style={{
                padding: '0.5rem 0.9rem',
                border: `1px solid ${p === pagina ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
                color: p === pagina ? '#d4af37' : 'rgba(255,255,255,0.5)',
                textDecoration: 'none', borderRadius: '2px',
                fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif',
                background: p === pagina ? 'rgba(212,175,55,0.08)' : 'transparent'
              }}>{p}</Link>
            ))}
          </div>
        )}

        {/* TEXTO SEO */}
        <section style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '3rem', marginTop: '2rem',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'system-ui, sans-serif', fontSize: '0.85rem', lineHeight: 1.8
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 400, marginBottom: '1rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit' }}>
            {titulo}{searchParams.estado ? ` no ${ESTADOS_BR[searchParams.estado]}` : ' no Brasil'}
          </h2>
          <p>
            A VipAcompanhante é a maior plataforma de {titulo.toLowerCase()} do Brasil,
            com perfis verificados em todos os estados e cidades do país.
            Encontre {titulo.toLowerCase()} com fotos reais, informações completas e contato direto.
            Nossa plataforma oferece total discrição e segurança para todos os usuários.
          </p>
        </section>
      </div>
    </main>
  )
}
