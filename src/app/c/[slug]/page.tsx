'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPin, Camera, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const COR = '#8B0000'

const TODOS_ESTADOS: {[key: string]: string} = {
  'ac': 'Acre', 'al': 'Alagoas', 'ap': 'Amapá', 'am': 'Amazonas', 
  'ba': 'Bahia', 'ce': 'Ceará', 'df': 'Distrito Federal', 'es': 'Espírito Santo',
  'go': 'Goiás', 'ma': 'Maranhão', 'mt': 'Mato Grosso', 'ms': 'Mato Grosso do Sul',
  'mg': 'Minas Gerais', 'pa': 'Pará', 'pb': 'Paraíba', 'pr': 'Paraná',
  'pe': 'Pernambuco', 'pi': 'Piauí', 'rj': 'Rio de Janeiro', 'rn': 'Rio Grande do Norte',
  'rs': 'Rio Grande do Sul', 'ro': 'Rondônia', 'rr': 'Roraima', 'sc': 'Santa Catarina',
  'sp': 'São Paulo', 'se': 'Sergipe', 'to': 'Tocantins'
}

// Mapeamento de slugs para filtros
const FILTROS_CABELO: {[key: string]: string} = {
  'loiras': 'Loira',
  'morenas': 'Morena',
  'ruivas': 'Ruiva',
  'negras': 'Preto',
  'castanhas': 'Castanho',
  'coloridas': 'Colorido'
}

const FILTROS_ETNIA: {[key: string]: string} = {
  'brancas': 'Branca',
  'morenas': 'Morena',
  'negras': 'Negra',
  'mulatas': 'Mulata',
  'asiaticas': 'Asiática',
  'latinas': 'Latina'
}

const FILTROS_CORPO: {[key: string]: string} = {
  'magras': 'Magra',
  'slim': 'Slim',
  'atleticas': 'Atlética',
  'curvilineas': 'Curvilínea',
  'gordinhas': 'Normal'
}

const FILTROS_ESPECIAIS: {[key: string]: {campo: string, valor: any}} = {
  'com-local': { campo: 'tem_local', valor: true },
  'verificadas': { campo: 'verificado', valor: true },
  'super-vip': { campo: 'plano', valor: 'super_vip' },
  'vip': { campo: 'plano', valor: 'vip' },
  'novas': { campo: 'novas', valor: true } // Últimos 7 dias
}

const FILTROS_SEIOS: {[key: string]: string} = {
  'seios-pequenos': 'Pequenos',
  'seios-medios': 'Médios',
  'seios-grandes': 'Grandes',
  'seios-silicone': 'Silicone'
}

function parseSlug(slug: string): { filtros: any, estado?: string, cidade?: string, titulo: string, descricao: string } {
  const partes = slug.toLowerCase().split('-')
  const filtros: any = {}
  let estado: string | undefined
  let cidade: string | undefined
  let caracteristica = ''
  
  // Tentar encontrar estado no final (2 letras)
  const ultimaParte = partes[partes.length - 1]
  if (ultimaParte.length === 2 && TODOS_ESTADOS[ultimaParte]) {
    estado = ultimaParte.toUpperCase()
    partes.pop()
  }
  
  // Reconstruir a característica
  caracteristica = partes.join('-')
  
  // Identificar tipo de filtro
  if (FILTROS_CABELO[caracteristica]) {
    filtros.cabelo = FILTROS_CABELO[caracteristica]
  } else if (FILTROS_ETNIA[caracteristica]) {
    filtros.etnia = FILTROS_ETNIA[caracteristica]
  } else if (FILTROS_CORPO[caracteristica]) {
    filtros.corpo = FILTROS_CORPO[caracteristica]
  } else if (FILTROS_SEIOS[caracteristica]) {
    filtros.seios = FILTROS_SEIOS[caracteristica]
  } else if (FILTROS_ESPECIAIS[caracteristica]) {
    const esp = FILTROS_ESPECIAIS[caracteristica]
    filtros[esp.campo] = esp.valor
  }
  
  // Gerar título e descrição SEO
  const estadoNome = estado ? TODOS_ESTADOS[estado.toLowerCase()] : 'Brasil'
  let titulo = ''
  let descricao = ''
  
  if (filtros.cabelo) {
    titulo = `Acompanhantes ${caracteristica.charAt(0).toUpperCase() + caracteristica.slice(1)} em ${estadoNome}`
    descricao = `Encontre as melhores acompanhantes ${caracteristica} em ${estadoNome}. Fotos reais, perfis verificados e contato direto.`
  } else if (filtros.etnia) {
    titulo = `Acompanhantes ${caracteristica.charAt(0).toUpperCase() + caracteristica.slice(1)} em ${estadoNome}`
    descricao = `As mais lindas acompanhantes ${caracteristica} em ${estadoNome}. Perfis completos com fotos e vídeos.`
  } else if (filtros.corpo) {
    titulo = `Acompanhantes ${caracteristica.charAt(0).toUpperCase() + caracteristica.slice(1)} em ${estadoNome}`
    descricao = `Acompanhantes ${caracteristica} em ${estadoNome}. Encontre seu tipo ideal.`
  } else if (filtros.tem_local) {
    titulo = `Acompanhantes com Local Próprio em ${estadoNome}`
    descricao = `Acompanhantes que possuem local próprio para atendimento em ${estadoNome}. Privacidade e conforto garantidos.`
  } else if (filtros.verificado) {
    titulo = `Acompanhantes Verificadas em ${estadoNome}`
    descricao = `Acompanhantes com identidade verificada em ${estadoNome}. Fotos 100% reais e perfis autênticos.`
  } else if (filtros.plano === 'super_vip') {
    titulo = `Acompanhantes Super VIP em ${estadoNome}`
    descricao = `As melhores acompanhantes Super VIP em ${estadoNome}. Alto padrão e atendimento exclusivo.`
  } else if (filtros.seios) {
    titulo = `Acompanhantes com ${FILTROS_SEIOS[caracteristica]} Seios em ${estadoNome}`
    descricao = `Encontre acompanhantes com ${FILTROS_SEIOS[caracteristica].toLowerCase()} seios em ${estadoNome}.`
  } else {
    titulo = `Acompanhantes em ${estadoNome}`
    descricao = `Encontre acompanhantes em ${estadoNome}. Milhares de perfis disponíveis.`
  }
  
  return { filtros, estado, cidade, titulo, descricao }
}

export default function PaginaSEO() {
  const params = useParams()
  const slug = params.slug as string
  
  const [perfis, setPerfis] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(true)
  const [info, setInfo] = useState<{ titulo: string, descricao: string }>({ titulo: '', descricao: '' })
  
  const supabase = createClient()
  
  useEffect(() => {
    if (slug) {
      const parsed = parseSlug(slug)
      setInfo({ titulo: parsed.titulo, descricao: parsed.descricao })
      buscarPerfis(1, parsed)
    }
  }, [slug])
  
  async function buscarPerfis(p: number, parsed?: ReturnType<typeof parseSlug>) {
    if (p === 1) setCarregando(true)
    
    const { filtros, estado } = parsed || parseSlug(slug)
    
    let query = supabase
      .from('acompanhantes')
      .select('id, slug, nome, cidade, estado, bairro, foto_capa, fotos, plano, verificado')
      .eq('status', 'ativo')
      .eq('sexo', 'mulher')
      .not('foto_capa', 'is', null)
    
    // Aplicar filtros
    if (estado) query = query.eq('estado', estado)
    if (filtros.cabelo) query = query.eq('cabelo', filtros.cabelo)
    if (filtros.etnia) query = query.eq('etnia', filtros.etnia)
    if (filtros.corpo) query = query.eq('corpo', filtros.corpo)
    if (filtros.seios) query = query.eq('seios', filtros.seios)
    if (filtros.tem_local) query = query.eq('tem_local', true)
    if (filtros.verificado) query = query.eq('verificado', true)
    if (filtros.plano) query = query.eq('plano', filtros.plano)
    if (filtros.novas) {
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      query = query.gte('criado_em', seteDiasAtras.toISOString())
    }
    
    query = query
      .order('plano', { ascending: false })
      .order('id', { ascending: false })
      .range((p - 1) * 24, p * 24 - 1)
    
    const { data } = await query
    
    if (p === 1) setPerfis(data || [])
    else setPerfis(prev => [...prev, ...(data || [])])
    
    setTemMais((data || []).length === 24)
    setCarregando(false)
  }
  
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        .grid{display:grid;gap:10px;grid-template-columns:repeat(2,1fr)}
        @media(min-width:600px){.grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:900px){.grid{grid-template-columns:repeat(4,1fr)}}
        .card{border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.1);display:block;text-decoration:none;transition:transform .15s}
        .card:hover{transform:translateY(-2px)}
        .badge-svip{background:linear-gradient(135deg,#d4af37,#f5d070);color:#000;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px}
        .badge-vip{background:#666;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px}
        .badge-verificado{background:#1da1f2;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px}
        .load-more{width:100%;background:${COR};color:#fff;border:none;padding:12px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;margin-top:12px}
        .breadcrumb{display:flex;gap:8px;align-items:center;font-size:13px;color:#666;margin-bottom:16px;flex-wrap:wrap}
        .breadcrumb a{color:${COR};text-decoration:none}
        .seo-text{background:#fff;padding:20px;border-radius:8px;margin-top:24px;line-height:1.7;color:#444}
        .seo-text h2{font-size:18px;color:#222;margin-bottom:12px}
        .seo-text p{margin-bottom:12px}
        .tags-relacionadas{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
        .tag-link{background:#f0f0f0;color:#555;padding:6px 12px;border-radius:20px;text-decoration:none;font-size:12px}
        .tag-link:hover{background:${COR};color:#fff}
      `}</style>

      {/* HEADER */}
      <header style={{background:COR,position:'sticky',top:0,zIndex:200}}>
        <div className="wrap" style={{padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none'}}>
            <span style={{color:'#fff',fontSize:'20px',fontWeight:800}}>VipAcompanhante</span>
          </Link>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <Link href="/cadastro" style={{background:'#fff',color:COR,padding:'8px 14px',borderRadius:'6px',textDecoration:'none',fontSize:'13px',fontWeight:700}}>
              Publicar Anúncio
            </Link>
          </div>
        </div>
      </header>

      <div className="wrap" style={{padding:'20px 16px 40px'}}>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/">Início</Link>
          <span>›</span>
          <span>{info.titulo}</span>
        </div>
        
        {/* Voltar */}
        <Link href="/" style={{display:'inline-flex',alignItems:'center',gap:'6px',color:COR,textDecoration:'none',marginBottom:'16px',fontSize:'14px'}}>
          <ArrowLeft size={16} /> Voltar
        </Link>
        
        {/* Título SEO */}
        <h1 style={{fontSize:'24px',fontWeight:800,color:'#222',marginBottom:'8px'}}>
          {info.titulo}
        </h1>
        <p style={{color:'#666',fontSize:'14px',marginBottom:'20px'}}>
          {perfis.length > 0 ? `${perfis.length}+ anúncios encontrados` : 'Carregando...'}
        </p>

        {carregando ? (
          <div style={{textAlign:'center',padding:'50px',color:'#999'}}>Carregando...</div>
        ) : perfis.length === 0 ? (
          <div style={{textAlign:'center',padding:'50px'}}>
            <p style={{color:'#666',marginBottom:'12px'}}>Nenhuma acompanhante encontrada com esses critérios.</p>
            <Link href="/" style={{color:COR,fontWeight:700}}>Ver todas</Link>
          </div>
        ) : (
          <>
            <div className="grid">
              {perfis.map((p: any) => (
                <Link key={p.id} href={`/acompanhante/${p.slug}`} className="card">
                  <div style={{position:'relative',aspectRatio:'3/4',background:'#1a1a1a',overflow:'hidden'}}>
                    {p.foto_capa && <img src={p.foto_capa} alt={p.nome} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                    <div style={{position:'absolute',top:'6px',left:'6px',display:'flex',flexDirection:'column',gap:'3px'}}>
                      {p.plano==='super_vip' && <span className="badge-svip">★ SUPER VIP</span>}
                      {p.plano==='vip' && <span className="badge-vip">◆ VIP</span>}
                      {p.verificado && <span className="badge-verificado">✓ Verificada</span>}
                    </div>
                    <div style={{position:'absolute',top:'6px',right:'6px',background:'rgba(0,0,0,.6)',color:'#fff',borderRadius:'4px',padding:'2px 6px',fontSize:'10px',display:'flex',alignItems:'center',gap:'3px'}}>
                      <Camera size={10}/> {Math.max((p.fotos||[]).length,1)}
                    </div>
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:`linear-gradient(transparent,${COR}ee)`,padding:'24px 8px 8px'}}>
                      <h3 style={{color:'#fff',fontSize:'14px',fontWeight:700,marginBottom:'2px'}}>{p.nome}</h3>
                      <div style={{color:'rgba(255,255,255,.9)',fontSize:'11px',display:'flex',alignItems:'center',gap:'3px'}}>
                        <MapPin size={10}/> {p.bairro ? `${p.bairro}, ` : ''}{p.cidade}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {temMais && (
              <button className="load-more" onClick={() => { const np = pagina+1; setPagina(np); buscarPerfis(np) }}>
                Ver mais
              </button>
            )}
          </>
        )}
        
        {/* Texto SEO */}
        <div className="seo-text">
          <h2>{info.titulo}</h2>
          <p>{info.descricao}</p>
          <p>
            Navegue pelos perfis completos com fotos, vídeos e informações detalhadas. 
            Entre em contato diretamente pelo WhatsApp ou telefone.
          </p>
          
          {/* Tags relacionadas */}
          <div className="tags-relacionadas">
            <Link href="/c/loiras-sp" className="tag-link">Loiras SP</Link>
            <Link href="/c/morenas-rj" className="tag-link">Morenas RJ</Link>
            <Link href="/c/ruivas-mg" className="tag-link">Ruivas MG</Link>
            <Link href="/c/com-local-sp" className="tag-link">Com Local SP</Link>
            <Link href="/c/verificadas-rj" className="tag-link">Verificadas RJ</Link>
            <Link href="/c/super-vip-sp" className="tag-link">Super VIP SP</Link>
            <Link href="/c/negras-ba" className="tag-link">Negras BA</Link>
            <Link href="/c/asiaticas-sp" className="tag-link">Asiáticas SP</Link>
          </div>
        </div>
      </div>
    </>
  )
}
