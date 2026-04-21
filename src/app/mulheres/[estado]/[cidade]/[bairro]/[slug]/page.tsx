import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin, Phone, MessageCircle, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ESTADOS_BR } from '@/types'

interface Props {
  params: { estado: string; cidade: string; bairro: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data: perfil } = await supabase
    .from('acompanhantes')
    .select('nome, descricao, cidade, estado')
    .eq('slug', params.slug)
    .eq('status', 'ativo')
    .single()

  if (!perfil) return { title: 'Perfil não encontrado' }

  const estadoNome = ESTADOS_BR[perfil.estado] || perfil.estado

  return {
    title: `${perfil.nome} - Acompanhante em ${perfil.cidade}, ${estadoNome}`,
    description: perfil.descricao?.slice(0, 160) || `${perfil.nome}, acompanhante em ${perfil.cidade}`,
    alternates: {
      canonical: `https://www.vipacompanhante.com/acompanhante/${params.slug}`,
    },
  }
}

export default async function PerfilCompletoPage({ params }: Props) {
  const supabase = await createClient()
  
  const { data: perfil } = await supabase
    .from('acompanhantes')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'ativo')
    .single()

  if (!perfil) notFound()

  const estadoNome = ESTADOS_BR[perfil.estado] || perfil.estado
  const whatsappLink = perfil.whatsapp 
    ? `https://wa.me/55${perfil.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%2C%20vi%20seu%20perfil%20no%20VipAcompanhante`
    : null

  const COR = perfil.sexo === 'homem' ? '#1e3a5f' : perfil.sexo === 'trans' ? '#6b21a8' : '#8B0000'

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0f0f0;font-family:system-ui,sans-serif}
        .wrap{max-width:900px;margin:0 auto;padding:0 16px}
      `}</style>

      <header style={{background:'#fff',borderBottom:`3px solid ${COR}`,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <div className="wrap" style={{padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{background:COR,borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontSize:'15px',fontWeight:900}}>V</span>
            </div>
            <span style={{fontWeight:800,fontSize:'17px',color:'#222'}}>VipAcompanhante</span>
          </Link>
          <Link href="/" style={{color:'#555',textDecoration:'none',fontSize:'14px',display:'flex',alignItems:'center',gap:'4px'}}>
            <ChevronLeft size={16}/> Início
          </Link>
        </div>
      </header>

      <div className="wrap" style={{padding:'16px 16px 32px'}}>
        <p style={{fontSize:'13px',color:'#888',marginBottom:'16px'}}>
          <Link href="/" style={{color:'#888',textDecoration:'none'}}>Início</Link>
          {' / '}
          <Link href={`/${perfil.sexo === 'homem' ? 'homens' : perfil.sexo === 'trans' ? 'trans' : 'mulheres'}/${params.estado}/`} style={{color:'#888',textDecoration:'none'}}>{estadoNome}</Link>
          {' / '}
          <Link href={`/${perfil.sexo === 'homem' ? 'homens' : perfil.sexo === 'trans' ? 'trans' : 'mulheres'}/${params.estado}/${params.cidade}/`} style={{color:'#888',textDecoration:'none'}}>{perfil.cidade}</Link>
          {' / '}
          <span style={{color:COR,fontWeight:600}}>{perfil.nome}</span>
        </p>

        <div style={{background:'#fff',borderRadius:'12px',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.1)'}}>
          {/* Foto principal */}
          <div style={{position:'relative',width:'100%',aspectRatio:'4/5',maxHeight:'500px',background:'#1a1a1a'}}>
            {perfil.foto_capa ? (
              <img src={perfil.foto_capa} alt={perfil.nome} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ) : (
              <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#444',fontSize:'48px'}}>📷</div>
            )}
            {perfil.plano !== 'gratis' && (
              <div style={{position:'absolute',top:'12px',left:'12px',background:perfil.plano==='super_vip'?'#d4af37':'#444',color:'#fff',borderRadius:'20px',padding:'6px 14px',fontSize:'13px',fontWeight:700}}>
                {perfil.plano==='super_vip'?'★ SUPER VIP':'◆ VIP'}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{padding:'20px'}}>
            <h1 style={{fontSize:'24px',fontWeight:800,color:'#222',marginBottom:'8px'}}>{perfil.nome}</h1>
            
            <div style={{display:'flex',alignItems:'center',gap:'6px',color:'#666',fontSize:'14px',marginBottom:'16px'}}>
              <MapPin size={14}/>
              <span>{perfil.bairro ? `${perfil.bairro}, ` : ''}{perfil.cidade} - {estadoNome}</span>
            </div>

            {perfil.idade && (
              <p style={{fontSize:'15px',color:'#444',marginBottom:'8px'}}><strong>Idade:</strong> {perfil.idade} anos</p>
            )}

            {perfil.preco && (
              <p style={{fontSize:'15px',color:'#444',marginBottom:'16px'}}><strong>Valor:</strong> R$ {perfil.preco}</p>
            )}

            {perfil.descricao && (
              <div style={{marginBottom:'20px'}}>
                <h2 style={{fontSize:'16px',fontWeight:700,color:'#333',marginBottom:'8px'}}>Sobre mim</h2>
                <p style={{fontSize:'14px',color:'#555',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{perfil.descricao}</p>
              </div>
            )}

            {/* Botões de contato */}
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" 
                   style={{flex:1,minWidth:'200px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:'#25D366',color:'#fff',padding:'14px 20px',borderRadius:'8px',textDecoration:'none',fontWeight:700,fontSize:'15px'}}>
                  <MessageCircle size={20}/> WhatsApp
                </a>
              )}
              {perfil.telefone && (
                <a href={`tel:${perfil.telefone}`}
                   style={{flex:1,minWidth:'200px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',background:COR,color:'#fff',padding:'14px 20px',borderRadius:'8px',textDecoration:'none',fontWeight:700,fontSize:'15px'}}>
                  <Phone size={20}/> Ligar
                </a>
              )}
            </div>
          </div>

          {/* Galeria */}
          {perfil.fotos && perfil.fotos.length > 0 && (
            <div style={{padding:'0 20px 20px'}}>
              <h2 style={{fontSize:'16px',fontWeight:700,color:'#333',marginBottom:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
                <Camera size={16}/> Fotos ({perfil.fotos.length})
              </h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',gap:'8px'}}>
                {perfil.fotos.map((foto: string, i: number) => (
                  <div key={i} style={{aspectRatio:'3/4',borderRadius:'8px',overflow:'hidden',background:'#1a1a1a'}}>
                    <img src={foto} alt={`${perfil.nome} foto ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
