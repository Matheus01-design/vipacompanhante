import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, Camera, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ESTADOS_BR } from '@/types'

const COR = '#8B0000'
const SEXO = 'homem'
const TIPO = 'Homens Acompanhantes'
const ROTA = 'homens'

interface Props {
  params: { estado: string; cidade: string }
  searchParams: { pagina?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sigla = params.estado.toUpperCase()
  const estadoNome = ESTADOS_BR[sigla] || sigla
  const cidadeNome = params.cidade.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return {
    title: `${TIPO} em ${cidadeNome} - ${sigla}`,
    description: `Encontre ${TIPO.toLowerCase()} em ${cidadeNome} - ${estadoNome}. Perfis verificados com fotos reais e contato direto.`,
  }
}

export default async function CidadePage({ params, searchParams }: Props) {
  const sigla = params.estado.toUpperCase()
  const estadoNome = ESTADOS_BR[sigla]
  if (!estadoNome) notFound()

  const pagina = parseInt(searchParams.pagina || '1')
  const porPagina = 24
  const supabase = await createClient()

  // Buscar cidade real no banco que bate com o slug
  const cidadeSlug = params.cidade
  const { data: cidadeData } = await supabase
    .from('acompanhantes')
    .select('cidade')
    .eq('estado', sigla)
    .eq('status', 'ativo')
    .limit(500)

  // Encontrar cidade real pelo slug
  const cidades = Array.from(new Set((cidadeData || []).map(d => d.cidade)))
  function toSlug(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  const cidadeReal = cidades.find(c => toSlug(c) === cidadeSlug) || ''
  const cidadeNome = cidadeReal || params.cidade.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const { data: perfis, count } = await supabase
    .from('acompanhantes')
    .select('id,slug,nome,descricao,cidade,estado,foto_capa,fotos,plano', { count: 'exact' })
    .eq('status', 'ativo').eq('sexo', SEXO).eq('estado', sigla)
    .eq('cidade', cidadeReal || cidadeNome)
    .not('foto_capa', 'is', null)
    .order('plano', { ascending: false }).order('id', { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1)

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0f0f0;font-family:system-ui,sans-serif}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        .grid{display:grid;gap:12px}
        @media(max-width:599px){.grid{grid-template-columns:1fr}}
        @media(min-width:600px) and (max-width:899px){.grid{grid-template-columns:1fr 1fr}}
        @media(min-width:900px){.grid{grid-template-columns:1fr 1fr 1fr}}
        @media(min-width:1200px){.grid{grid-template-columns:1fr 1fr 1fr 1fr}}
        .card{border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12);display:block;text-decoration:none;transition:transform .2s,box-shadow .2s}
        .card:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,.18)}
      `}</style>

      <header style={{background:'#fff',borderBottom:`3px solid ${COR}`,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <div className="wrap" style={{padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{background:COR,borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontSize:'15px',fontWeight:900}}>V</span>
            </div>
            <span style={{fontWeight:800,fontSize:'17px',color:'#222'}}>VipAcompanhante</span>
          </Link>
          <Link href={`/${ROTA}/${params.estado}/`} style={{color:'#555',textDecoration:'none',fontSize:'14px',display:'flex',alignItems:'center',gap:'4px'}}>
            <ChevronLeft size={16}/> {estadoNome}
          </Link>
        </div>
      </header>

      <div className="wrap" style={{padding:'16px 16px 32px'}}>
        <p style={{fontSize:'13px',color:'#888',marginBottom:'12px'}}>
          <Link href="/" style={{color:'#888',textDecoration:'none'}}>Início</Link>
          {' / '}
          <Link href={`/${ROTA}/${params.estado}/`} style={{color:'#888',textDecoration:'none'}}>{estadoNome}</Link>
          {' / '}
          <span style={{color:COR,fontWeight:600}}>{cidadeNome}</span>
        </p>

        <h1 style={{fontSize:'22px',fontWeight:800,color:'#222',marginBottom:'8px'}}>
          {TIPO} em {cidadeNome} - {sigla}
        </h1>
        <p style={{fontSize:'14px',color:'#666',marginBottom:'20px'}}>{count || 0} perfis encontrados</p>

        {(perfis || []).length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:'12px'}}>
            <p style={{fontSize:'16px',color:'#666',marginBottom:'16px'}}>Nenhuma acompanhante encontrada em {cidadeNome}.</p>
            <Link href={`/${ROTA}/${params.estado}/`} style={{color:COR,fontWeight:700,textDecoration:'none',border:`1px solid ${COR}`,padding:'10px 24px',borderRadius:'8px',display:'inline-block'}}>
              Ver todas do {estadoNome}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid" style={{marginBottom:'20px'}}>
              {(perfis || []).map(p => (
                <Link key={p.id} href={`/acompanhante/${p.slug}/`} className="card">
                  <div style={{position:'relative',width:'100%',aspectRatio:'3/4',background:'#1a1a1a',overflow:'hidden'}}>
                    {p.foto_capa
                      ? <Image src={p.foto_capa} alt={p.nome} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{objectFit:'cover'}}/>
                      : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#444',fontSize:'36px'}}>📷</div>
                    }
                    <div style={{position:'absolute',top:'10px',right:'10px',background:COR,color:'#fff',borderRadius:'20px',padding:'4px 10px',display:'flex',alignItems:'center',gap:'4px',fontSize:'13px',fontWeight:700}}>
                      <Camera size={12}/> {Math.max((p.fotos||[]).length,1)}
                    </div>
                    {p.plano !== 'gratis' && (
                      <div style={{position:'absolute',top:'10px',left:'10px',background:p.plano==='super_vip'?'#d4af37':'#444',color:'#fff',borderRadius:'20px',padding:'3px 10px',fontSize:'11px',fontWeight:700}}>
                        {p.plano==='super_vip'?'★ SUPER VIP':'◆ VIP'}
                      </div>
                    )}
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:`linear-gradient(transparent,${COR}dd)`,padding:'32px 12px 12px'}}>
                      <h3 style={{color:'#fff',fontSize:'17px',fontWeight:700,marginBottom:'3px'}}>{p.nome}</h3>
                      {p.descricao && <p style={{color:'rgba(255,255,255,.85)',fontSize:'12px',marginBottom:'6px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden',lineHeight:1.4}}>{p.descricao}</p>}
                      <div style={{display:'flex',alignItems:'center',gap:'4px',color:'rgba(255,255,255,.9)',fontSize:'12px'}}>
                        <MapPin size={11}/> {p.cidade} - {p.estado}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {totalPaginas > 1 && (
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginBottom:'24px'}}>
                {Array.from({length:Math.min(totalPaginas,10)},(_,i)=>i+1).map(p=>(
                  <Link key={p} href={`?pagina=${p}`} style={{padding:'8px 14px',border:`1px solid ${p===pagina?COR:'#ddd'}`,borderRadius:'6px',textDecoration:'none',fontSize:'14px',fontWeight:p===pagina?700:400,color:p===pagina?COR:'#555',background:p===pagina?'#fef2f2':'#fff'}}>
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{background:'#fff',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',marginTop:'8px'}}>
          <h2 style={{fontSize:'17px',fontWeight:700,color:'#222',marginBottom:'10px'}}>{TIPO} em {cidadeNome}</h2>
          <p style={{fontSize:'14px',color:'#555',lineHeight:1.8}}>
            Encontre as melhores {TIPO.toLowerCase()} em {cidadeNome} - {estadoNome} na VipAcompanhante.
            Todos os perfis possuem fotos reais e contato direto via WhatsApp ou telefone.
          </p>
        </div>
      </div>
    </>
  )
}
