'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

const COR = '#8B0000'

interface Story {
  id: string
  url: string
  tipo: 'foto' | 'video'
  criado_em: string
  acompanhante: {
    id: string
    nome: string
    slug: string
    foto_capa: string
    plano: string
  }
}

interface AcompanhanteComStories {
  id: string
  nome: string
  slug: string
  foto_capa: string
  plano: string
  stories: Story[]
  visto: boolean
}

export default function StoriesCarrossel() {
  const [acompanhantes, setAcompanhantes] = useState<AcompanhanteComStories[]>([])
  const [storyAberto, setStoryAberto] = useState<{acompanhante: AcompanhanteComStories, index: number} | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [pausado, setPausado] = useState(false)
  const carrosselRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    carregarStories()
  }, [])

  async function carregarStories() {
    const { data } = await supabase
      .from('stories')
      .select(`
        id, url, tipo, criado_em,
        acompanhante:acompanhantes(id, nome, slug, foto_capa, plano)
      `)
      .eq('ativo', true)
      .gt('expira_em', new Date().toISOString())
      .order('criado_em', { ascending: false })
      .limit(50)
    
    if (data) {
      // Agrupar por acompanhante
      const mapa = new Map<string, AcompanhanteComStories>()
      
      data.forEach((s: any) => {
        if (s.acompanhante) {
          const acompId = s.acompanhante.id
          if (!mapa.has(acompId)) {
            mapa.set(acompId, {
              ...s.acompanhante,
              stories: [],
              visto: localStorage.getItem(`story_visto_${acompId}`) === 'true'
            })
          }
          mapa.get(acompId)!.stories.push({
            id: s.id,
            url: s.url,
            tipo: s.tipo || 'foto',
            criado_em: s.criado_em,
            acompanhante: s.acompanhante
          })
        }
      })
      
      // Ordenar: não vistos primeiro, depois por plano
      const lista = Array.from(mapa.values())
        .sort((a, b) => {
          if (a.visto !== b.visto) return a.visto ? 1 : -1
          const ordem = { super_vip: 0, vip: 1, gratis: 2 }
          return (ordem[a.plano as keyof typeof ordem] || 2) - (ordem[b.plano as keyof typeof ordem] || 2)
        })
      
      setAcompanhantes(lista)
    }
  }

  const abrirStory = (acomp: AcompanhanteComStories, index = 0) => {
    setStoryAberto({ acompanhante: acomp, index })
    setProgresso(0)
    iniciarTimer()
    
    // Marcar como visto
    localStorage.setItem(`story_visto_${acomp.id}`, 'true')
    setAcompanhantes(prev => prev.map(a => 
      a.id === acomp.id ? { ...a, visto: true } : a
    ))
  }

  const fecharStory = () => {
    setStoryAberto(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgresso(0)
    
    timerRef.current = setInterval(() => {
      if (!pausado) {
        setProgresso(p => {
          if (p >= 100) {
            proximoStory()
            return 0
          }
          return p + 2 // 5 segundos total (100/2 = 50 * 100ms = 5000ms)
        })
      }
    }, 100)
  }

  const proximoStory = () => {
    if (!storyAberto) return
    
    const { acompanhante, index } = storyAberto
    
    if (index < acompanhante.stories.length - 1) {
      // Próximo story do mesmo acompanhante
      setStoryAberto({ acompanhante, index: index + 1 })
      setProgresso(0)
    } else {
      // Próximo acompanhante
      const idx = acompanhantes.findIndex(a => a.id === acompanhante.id)
      if (idx < acompanhantes.length - 1) {
        abrirStory(acompanhantes[idx + 1], 0)
      } else {
        fecharStory()
      }
    }
  }

  const anteriorStory = () => {
    if (!storyAberto) return
    
    const { acompanhante, index } = storyAberto
    
    if (index > 0) {
      setStoryAberto({ acompanhante, index: index - 1 })
      setProgresso(0)
    } else {
      // Acompanhante anterior
      const idx = acompanhantes.findIndex(a => a.id === acompanhante.id)
      if (idx > 0) {
        const prevAcomp = acompanhantes[idx - 1]
        abrirStory(prevAcomp, prevAcomp.stories.length - 1)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (storyAberto) {
      iniciarTimer()
    }
  }, [storyAberto?.index, pausado])

  if (acompanhantes.length === 0) return null

  return (
    <>
      <style>{`
        .stories-container { 
          padding: 16px 0; 
          overflow-x: auto; 
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .stories-container::-webkit-scrollbar { display: none }
        .stories-list { display: flex; gap: 12px; padding: 0 16px }
        .story-item { 
          flex-shrink: 0; 
          width: 72px; 
          cursor: pointer;
          text-align: center;
        }
        .story-avatar { 
          width: 68px; 
          height: 68px; 
          border-radius: 50%; 
          padding: 3px;
          background: linear-gradient(135deg, ${COR}, #ff6b6b);
        }
        .story-avatar.visto { 
          background: #ddd;
        }
        .story-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid #fff;
          overflow: hidden;
        }
        .story-avatar-inner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .story-nome { 
          font-size: 11px; 
          color: #333; 
          margin-top: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .story-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 800;
        }
        .story-badge.super_vip { background: linear-gradient(135deg, #d4af37, #f5d070); color: #000 }
        .story-badge.vip { background: #666; color: #fff }
        
        .story-modal {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .story-content {
          position: relative;
          width: 100%;
          max-width: 420px;
          height: 100vh;
          max-height: 100vh;
        }
        .story-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #111;
        }
        .story-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 12px;
          background: linear-gradient(to bottom, rgba(0,0,0,.6), transparent);
        }
        .story-progress {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }
        .story-progress-bar {
          flex: 1;
          height: 3px;
          background: rgba(255,255,255,.3);
          border-radius: 2px;
          overflow: hidden;
        }
        .story-progress-fill {
          height: 100%;
          background: #fff;
          transition: width 100ms linear;
        }
        .story-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .story-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #fff;
        }
        .story-user-nome {
          color: #fff;
          font-weight: 600;
          font-size: 14px;
        }
        .story-user-tempo {
          color: rgba(255,255,255,.6);
          font-size: 12px;
        }
        .story-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          z-index: 10;
        }
        .story-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,.2);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .story-nav.prev { left: 10px }
        .story-nav.next { right: 10px }
        .story-touch-left, .story-touch-right {
          position: absolute;
          top: 100px;
          bottom: 100px;
          width: 40%;
        }
        .story-touch-left { left: 0 }
        .story-touch-right { right: 0 }
        .story-pause {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,.2);
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .story-link {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: ${COR};
          color: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }
      `}</style>

      {/* Carrossel de Stories */}
      <div className="stories-container" ref={carrosselRef}>
        <div className="stories-list">
          {acompanhantes.map(acomp => (
            <div key={acomp.id} className="story-item" onClick={() => abrirStory(acomp)}>
              <div style={{position:'relative'}}>
                <div className={`story-avatar ${acomp.visto ? 'visto' : ''}`}>
                  <div className="story-avatar-inner">
                    <img src={acomp.foto_capa} alt={acomp.nome} />
                  </div>
                </div>
                {acomp.plano !== 'gratis' && (
                  <span className={`story-badge ${acomp.plano}`}>
                    {acomp.plano === 'super_vip' ? '★' : '◆'}
                  </span>
                )}
              </div>
              <p className="story-nome">{acomp.nome.split(' ')[0]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Story */}
      {storyAberto && (
        <div className="story-modal">
          <div className="story-content">
            {/* Imagem/Vídeo */}
            {storyAberto.acompanhante.stories[storyAberto.index].tipo === 'video' ? (
              <video 
                src={storyAberto.acompanhante.stories[storyAberto.index].url}
                className="story-image"
                autoPlay
                playsInline
                muted={false}
              />
            ) : (
              <img 
                src={storyAberto.acompanhante.stories[storyAberto.index].url}
                className="story-image"
                alt=""
              />
            )}

            {/* Header com progresso */}
            <div className="story-header">
              <div className="story-progress">
                {storyAberto.acompanhante.stories.map((_, i) => (
                  <div key={i} className="story-progress-bar">
                    <div 
                      className="story-progress-fill" 
                      style={{
                        width: i < storyAberto.index ? '100%' 
                          : i === storyAberto.index ? `${progresso}%` 
                          : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <div className="story-user">
                <img 
                  src={storyAberto.acompanhante.foto_capa} 
                  className="story-user-avatar"
                  alt=""
                />
                <div>
                  <p className="story-user-nome">{storyAberto.acompanhante.nome}</p>
                  <p className="story-user-tempo">
                    {(() => {
                      const mins = Math.floor((Date.now() - new Date(storyAberto.acompanhante.stories[storyAberto.index].criado_em).getTime()) / 60000)
                      if (mins < 60) return `${mins}min`
                      return `${Math.floor(mins / 60)}h`
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Botão fechar */}
            <button className="story-close" onClick={fecharStory}>
              <X size={28} />
            </button>

            {/* Áreas de toque */}
            <div className="story-touch-left" onClick={anteriorStory} />
            <div className="story-touch-right" onClick={proximoStory} />

            {/* Navegação */}
            <button className="story-nav prev" onClick={anteriorStory}>
              <ChevronLeft size={24} />
            </button>
            <button className="story-nav next" onClick={proximoStory}>
              <ChevronRight size={24} />
            </button>

            {/* Link para perfil */}
            <a 
              href={`/acompanhante/${storyAberto.acompanhante.slug}`}
              className="story-link"
              onClick={() => fecharStory()}
            >
              Ver perfil
            </a>

            {/* Pause/Play */}
            <button className="story-pause" onClick={() => setPausado(!pausado)}>
              {pausado ? <Play size={16} /> : <Pause size={16} />}
              {pausado ? 'Continuar' : 'Pausar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
