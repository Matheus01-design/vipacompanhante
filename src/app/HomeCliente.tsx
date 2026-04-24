'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Camera, X, ChevronDown, ChevronRight, ChevronLeft, MessageCircleHeart, Search, Navigation, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ESTADOS_BR } from '@/types'

const COR = '#8B0000'

const TODOS_ESTADOS: {[key: string]: string} = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

interface Sugestao {
  tipo: 'cidade' | 'bairro'
  cidade: string
  estado: string
  bairro?: string
  count: number
}

interface Story {
  id: string
  url: string
  tipo: string
  criado_em: string
  expira_em: string
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

interface Props {
  perfisIniciais: any[]
  superVipsIniciais: any[]
}

export default function HomeCliente({ perfisIniciais, superVipsIniciais }: Props) {
  const [perfis, setPerfis] = useState<any[]>(perfisIniciais)
  const [superVips, setSuperVips] = useState<any[]>(superVipsIniciais)
  const [carregando, setCarregando] = useState(false)
  const [sexo, setSexo] = useState('mulher')
  const [pagina, setPagina] = useState(1)
  const [temMais, setTemMais] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  
  const [cidadeBusca, setCidadeBusca] = useState('')
  const [cidadeSelecionada, setCidadeSelecionada] = useState<{cidade: string, estado: string} | null>(null)
  const [bairroSelecionado, setBairroSelecionado] = useState('')
  const [palavraChave, setPalavraChave] = useState('')
  const [distanciaKm, setDistanciaKm] = useState(25)
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<{lat: number, lng: number} | null>(null)
  const [localizando, setLocalizando] = useState(false)
  const [usandoGeo, setUsandoGeo] = useState(false)
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [mostrarListaCidades, setMostrarListaCidades] = useState(false)
  const [dadosLocais, setDadosLocais] = useState<{[estado: string]: {cidades: {[cidade: string]: {bairros: string[], count: number}}, count: number}}>({})
  const [estadoExpandido, setEstadoExpandido] = useState<string | null>(null)
  const [cidadeExpandida, setCidadeExpandida] = useState<string | null>(null)
  
  // Stories
  const [storiesAcompanhantes, setStoriesAcompanhantes] = useState<AcompanhanteComStories[]>([])
  const [storyAberto, setStoryAberto] = useState<{acompanhante: AcompanhanteComStories, index: number} | null>(null)
  const [progresso, setProgresso] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const cidadeRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('userLocation')
    if (saved) {
      try {
        const loc = JSON.parse(saved)
        setMinhaLocalizacao(loc)
        setUsandoGeo(true)
      } catch {}
    } else {
      pedirLocalizacaoSilenciosa()
    }
    carregarStories()
  }, [])

  // Carregar Stories
  async function carregarStories() {
    try {
      const { data } = await supabase
        .from('stories')
        .select(`
          id, url, tipo, criado_em, expira_em,
          acompanhante:acompanhantes(id, nome, slug, foto_capa, plano)
        `)
        .eq('ativo', true)
        .gt('expira_em', new Date().toISOString())
        .order('criado_em', { ascending: false })
        .limit(50)
      
      if (data) {
        const mapa = new Map<string, AcompanhanteComStories>()
        
        data.forEach((s: any) => {
          if (s.acompanhante) {
            const acompId = s.acompanhante.id
            if (!mapa.has(acompId)) {
              mapa.set(acompId, {
                ...s.acompanhante,
                stories: [],
                visto: localStorage.getItem(`story_${acompId}`) === '1'
              })
            }
            mapa.get(acompId)!.stories.push(s)
          }
        })
        
        const lista = Array.from(mapa.values())
          .sort((a, b) => {
            if (a.visto !== b.visto) return a.visto ? 1 : -1
            const ordem: {[k:string]:number} = { super_vip: 0, vip: 1, gratis: 2 }
            return (ordem[a.plano] || 2) - (ordem[b.plano] || 2)
          })
        
        setStoriesAcompanhantes(lista)
      }
    } catch (e) {
      console.log('Stories não disponível')
    }
  }

  const abrirStory = (acomp: AcompanhanteComStories, index = 0) => {
    setStoryAberto({ acompanhante: acomp, index })
    setProgresso(0)
    localStorage.setItem(`story_${acomp.id}`, '1')
    setStoriesAcompanhantes(prev => prev.map(a => a.id === acomp.id ? { ...a, visto: true } : a))
    iniciarTimer()
  }

  const fecharStory = () => {
    setStoryAberto(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgresso(0)
    timerRef.current = setInterval(() => {
      setProgresso(p => {
        if (p >= 100) {
          proximoStory()
          return 0
        }
        return p + 2
      })
    }, 100)
  }

  const proximoStory = () => {
    if (!storyAberto) return
    const { acompanhante, index } = storyAberto
    if (index < acompanhante.stories.length - 1) {
      setStoryAberto({ acompanhante, index: index + 1 })
      setProgresso(0)
    } else {
      const idx = storiesAcompanhantes.findIndex(a => a.id === acompanhante.id)
      if (idx < storiesAcompanhantes.length - 1) {
        abrirStory(storiesAcompanhantes[idx + 1], 0)
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
    }
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (storyAberto) iniciarTimer()
  }, [storyAberto?.index])

  // CORRIGIDO: Fechar dropdown no click/touch fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (cidadeRef.current && !cidadeRef.current.contains(e.target as Node)) {
        setMostrarSugestoes(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // AUTOCOMPLETE - Buscar cidades e bairros
  useEffect(() => {
    if (cidadeBusca.length < 1) {
      setSugestoes([])
      setMostrarSugestoes(false)
      return
    }
    const buscar = async () => {
      const termo = cidadeBusca.toLowerCase()
      const { data } = await supabase
        .from('acompanhantes')
        .select('cidade, estado, bairro')
        .eq('status', 'ativo')
        .or(`cidade.ilike.%${cidadeBusca}%,bairro.ilike.%${cidadeBusca}%`)
        .limit(500)
      
      const mapCidades = new Map<string, Sugestao>()
      const mapBairros = new Map<string, Sugestao>()
      
      data?.forEach(d => {
        if (d.cidade && d.estado && d.cidade.toLowerCase().includes(termo)) {
          const key = `${d.cidade}-${d.estado}`
          if (!mapCidades.has(key)) {
            mapCidades.set(key, { tipo: 'cidade', cidade: d.cidade, estado: d.estado, count: 0 })
          }
          mapCidades.get(key)!.count++
        }
        if (d.bairro && d.cidade && d.estado && d.bairro.toLowerCase().includes(termo)) {
          const key = `${d.bairro}-${d.cidade}-${d.estado}`
          if (!mapBairros.has(key)) {
            mapBairros.set(key, { tipo: 'bairro', bairro: d.bairro, cidade: d.cidade, estado: d.estado, count: 0 })
          }
          mapBairros.get(key)!.count++
        }
      })
      
      const cidades = Array.from(mapCidades.values())
        .sort((a, b) => {
          const aStarts = a.cidade.toLowerCase().startsWith(termo)
          const bStarts = b.cidade.toLowerCase().startsWith(termo)
          if (aStarts && !bStarts) return -1
          if (!aStarts && bStarts) return 1
          return b.count - a.count
        })
        .slice(0, 8)
      
      const bairros = Array.from(mapBairros.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 7)
      
      setSugestoes([...cidades, ...bairros])
      if (cidades.length > 0 || bairros.length > 0) {
        setMostrarSugestoes(true)
      }
    }
    const t = setTimeout(buscar, 150)
    return () => clearTimeout(t)
  }, [cidadeBusca])

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase
        .from('acompanhantes')
        .select('cidade, estado, bairro')
        .eq('status', 'ativo')
        .limit(10000)
      
      const mapa: typeof dadosLocais = {}
      Object.keys(TODOS_ESTADOS).forEach(uf => {
        mapa[uf] = { cidades: {}, count: 0 }
      })
      
      data?.forEach(d => {
        if (d.estado && d.cidade) {
          if (!mapa[d.estado]) mapa[d.estado] = { cidades: {}, count: 0 }
          mapa[d.estado].count++
          if (!mapa[d.estado].cidades[d.cidade]) {
            mapa[d.estado].cidades[d.cidade] = { bairros: [], count: 0 }
          }
          mapa[d.estado].cidades[d.cidade].count++
          if (d.bairro && !mapa[d.estado].cidades[d.cidade].bairros.includes(d.bairro)) {
            mapa[d.estado].cidades[d.cidade].bairros.push(d.bairro)
          }
        }
      })
      setDadosLocais(mapa)
    }
    carregar()
  }, [])

  useEffect(() => {
    setPagina(1)
    setPerfis([])
    buscarPerfis(1)
    buscarSuperVips()
  }, [sexo, cidadeSelecionada, bairroSelecionado, usandoGeo, distanciaKm])

  const pedirLocalizacaoSilenciosa = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMinhaLocalizacao(loc)
        localStorage.setItem('userLocation', JSON.stringify(loc))
        setUsandoGeo(true)
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    )
  }

  const pedirLocalizacao = () => {
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização')
      return
    }
    setLocalizando(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMinhaLocalizacao(loc)
        localStorage.setItem('userLocation', JSON.stringify(loc))
        setUsandoGeo(true)
        setCidadeSelecionada(null)
        setBairroSelecionado('')
        setCidadeBusca('')
        setLocalizando(false)
      },
      () => {
        setLocalizando(false)
        alert('Não foi possível obter sua localização.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  async function buscarSuperVips() {
    let q = supabase.from('acompanhantes')
      .select('id,slug,nome,cidade,estado,foto_capa,plano,latitude,longitude')
      .eq('status', 'ativo').eq('sexo', sexo).eq('plano', 'super_vip')
      .not('foto_capa', 'is', null).limit(20)
    
    if (cidadeSelecionada) q = q.eq('cidade', cidadeSelecionada.cidade).eq('estado', cidadeSelecionada.estado)
    if (bairroSelecionado) q = q.eq('bairro', bairroSelecionado)
    
    const { data } = await q
    let result = data || []
    
    if (usandoGeo && minhaLocalizacao && distanciaKm > 0 && !cidadeSelecionada) {
      result = result.filter(p => p.latitude && p.longitude && calcularDistancia(minhaLocalizacao.lat, minhaLocalizacao.lng, p.latitude, p.longitude) <= distanciaKm)
        .map(p => ({ ...p, distancia: calcularDistancia(minhaLocalizacao.lat, minhaLocalizacao.lng, p.latitude!, p.longitude!) }))
        .sort((a: any, b: any) => a.distancia - b.distancia)
    }
    setSuperVips(result.slice(0, 6))
  }

  async function buscarPerfis(p: number) {
    if (p === 1) setCarregando(true)
    else setCarregandoMais(true)
    
    let q = supabase.from('acompanhantes')
      .select('id,slug,nome,descricao,cidade,estado,bairro,foto_capa,fotos,plano,latitude,longitude')
      .eq('status', 'ativo').eq('sexo', sexo)
      .not('foto_capa', 'is', null)
      .order('plano', { ascending: false })
      .order('id', { ascending: false })
    
    if (cidadeSelecionada) q = q.eq('cidade', cidadeSelecionada.cidade).eq('estado', cidadeSelecionada.estado)
    if (bairroSelecionado) q = q.eq('bairro', bairroSelecionado)
    if (palavraChave.trim()) {
      const termo = palavraChave.trim()
      q = q.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%,cidade.ilike.%${termo}%,bairro.ilike.%${termo}%`)
    }
    
    if (usandoGeo && minhaLocalizacao && distanciaKm > 0 && !cidadeSelecionada) {
      q = q.not('latitude', 'is', null).limit(1000)
    } else {
      q = q.range((p - 1) * 24, p * 24 - 1)
    }
    
    const { data } = await q
    let novos = data || []
    
    if (usandoGeo && minhaLocalizacao && distanciaKm > 0 && !cidadeSelecionada) {
      novos = novos.filter(perf => perf.latitude && perf.longitude && calcularDistancia(minhaLocalizacao.lat, minhaLocalizacao.lng, perf.latitude, perf.longitude) <= distanciaKm)
        .map(perf => ({ ...perf, distancia: calcularDistancia(minhaLocalizacao.lat, minhaLocalizacao.lng, perf.latitude!, perf.longitude!) }))
        .sort((a: any, b: any) => a.distancia - b.distancia)
      const inicio = (p - 1) * 24
      const paginado = novos.slice(inicio, inicio + 24)
      if (p === 1) setPerfis(paginado)
      else setPerfis(prev => [...prev, ...paginado])
      setTemMais(inicio + 24 < novos.length)
    } else {
      if (p === 1) setPerfis(novos)
      else setPerfis(prev => [...prev, ...novos])
      setTemMais(novos.length === 24)
    }
    setCarregando(false)
    setCarregandoMais(false)
  }

  const selecionarSugestao = (s: Sugestao) => {
    if (s.tipo === 'cidade') {
      setCidadeSelecionada({ cidade: s.cidade, estado: s.estado })
      setCidadeBusca(`${s.cidade}, ${TODOS_ESTADOS[s.estado] || s.estado}`)
      setBairroSelecionado('')
    } else {
      setCidadeSelecionada({ cidade: s.cidade, estado: s.estado })
      setBairroSelecionado(s.bairro || '')
      setCidadeBusca(`${s.bairro}, ${s.cidade}`)
    }
    setMostrarSugestoes(false)
    setUsandoGeo(false)
  }

  const selecionarCidadeLista = (cidade: string, estado: string) => {
    setCidadeSelecionada({ cidade, estado })
    setCidadeBusca(`${cidade}, ${TODOS_ESTADOS[estado] || estado}`)
    setBairroSelecionado('')
    setMostrarListaCidades(false)
    setUsandoGeo(false)
  }

  const selecionarBairroLista = (bairro: string, cidade: string, estado: string) => {
    setCidadeSelecionada({ cidade, estado })
    setBairroSelecionado(bairro)
    setCidadeBusca(`${bairro}, ${cidade}`)
    setMostrarListaCidades(false)
    setUsandoGeo(false)
  }

  const limparCidade = () => {
    setCidadeSelecionada(null)
    setBairroSelecionado('')
    setCidadeBusca('')
  }

  const limparTudo = () => {
    setCidadeSelecionada(null)
    setBairroSelecionado('')
    setCidadeBusca('')
    setPalavraChave('')
    setUsandoGeo(false)
  }

  const executarBusca = () => {
    setPagina(1)
    setPerfis([])
    buscarPerfis(1)
    buscarSuperVips()
  }

  // CORRIGIDO: Função para abrir sugestões
  const abrirSugestoes = () => {
    if (cidadeBusca.length >= 1 && sugestoes.length > 0) {
      setMostrarSugestoes(true)
    }
  }

  const temFiltroAtivo = cidadeSelecionada || bairroSelecionado || palavraChave || usandoGeo

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        .grid{display:grid;gap:10px;grid-template-columns:repeat(2,1fr)}
        @media(min-width:600px){.grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:900px){.grid{grid-template-columns:repeat(4,1fr)}}
        .svip-grid{display:grid;gap:10px;grid-template-columns:repeat(2,1fr)}
        @media(min-width:600px){.svip-grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:900px){.svip-grid{grid-template-columns:repeat(6,1fr)}}
        .card{border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.1);display:block;text-decoration:none;transition:transform .15s}
        .card:hover{transform:translateY(-2px)}
        .svip-card{border-radius:8px;overflow:hidden;display:block;text-decoration:none;transition:transform .15s}
        .svip-card:hover{transform:translateY(-2px)}
        .fbtn{border:none;padding:6px 14px;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .disponivel{animation:pulse 2s infinite}
        .badge-svip{background:linear-gradient(135deg,#d4af37,#f5d070);color:#000;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px}
        .badge-vip{background:#666;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px}
        .badge-dist{background:rgba(0,0,0,.7);color:#fff;font-size:9px;font-weight:600;padding:2px 6px;border-radius:3px}
        .luna-banner{background:linear-gradient(135deg,#1a1a1a 0%,#2d1f3d 50%,#1a1a1a 100%);border-radius:10px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;border:1px solid #3d2d4d}
        .load-more{width:100%;background:${COR};color:#fff;border:none;padding:12px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;margin-top:12px}
        .load-more:disabled{opacity:.6}
        
        .filtros-container{background:#fff;border-bottom:1px solid #e0e0e0;padding:12px 0}
        .cidade-container{position:relative;flex:1;min-width:200px}
        .cidade-input{width:100%;padding:10px 36px 10px 12px;border:1px solid #ddd;border-radius:6px;font-size:16px;outline:none;background:#fff;color:#333;-webkit-appearance:none}
        .cidade-input:focus{border-color:${COR}}
        .cidade-input::placeholder{color:#888}
        .cidade-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;color:#666;background:none;border:none;padding:8px}
        .km-select{padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;background:#fff;color:#333;cursor:pointer;min-width:100px}
        .search-input{flex:1;min-width:150px;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:16px;outline:none;background:#fff;color:#333;-webkit-appearance:none}
        .search-input::placeholder{color:#888}
        .search-input:focus{border-color:${COR}}
        .btn-procurar{background:${COR};color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
        .btn-procurar:hover{background:#6b0000}
        
        /* CORRIGIDO: Dropdown com z-index alto e position fixed no mobile */
        .sugestoes-dropdown{position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:9999;max-height:350px;overflow-y:auto;margin-top:4px;-webkit-overflow-scrolling:touch}
        @media(max-width:768px){
          .sugestoes-dropdown{position:fixed;top:140px;left:12px;right:12px;max-height:50vh;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.3)}
        }
        .sugestao-item{padding:14px 16px;cursor:pointer;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px;-webkit-tap-highlight-color:transparent}
        .sugestao-item:hover,.sugestao-item:active{background:#f5f5f5}
        .sugestao-item:last-child{border-bottom:none}
        .sugestao-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px}
        .sugestao-icon.cidade{background:#e3f2fd;color:#1976d2}
        .sugestao-icon.bairro{background:#fff3e0;color:#f57c00}
        .sugestao-texto{flex:1;font-size:15px;color:#333}
        .sugestao-texto strong{font-weight:600}
        .sugestao-texto span{color:#888}
        .sugestao-count{color:#aaa;font-size:12px;background:#f5f5f5;padding:4px 10px;border-radius:12px}
        
        .filtros-ativos{background:#fef2f2;border:1px solid ${COR}33;border-radius:8px;padding:10px 14px;margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
        .filtro-tag{background:${COR};color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;display:flex;align-items:center;gap:6px}
        .filtro-tag button{background:none;border:none;color:#fff;cursor:pointer;padding:0;display:flex}
        
        .filtros-rodape{display:flex;gap:16px;align-items:center;margin-top:10px;flex-wrap:wrap}
        .filtros-rodape button{background:none;border:none;font-size:13px;color:#555;cursor:pointer;display:flex;align-items:center;gap:4px}
        .filtros-rodape button:hover{color:${COR}}
        
        .lista-locais{margin-top:10px;background:#f8f8f8;border-radius:8px;max-height:400px;overflow-y:auto}
        .estado-item{border-bottom:1px solid #e8e8e8}
        .estado-header{padding:10px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-weight:600;color:#333}
        .estado-header:hover{background:#f0f0f0}
        .estado-content{background:#fff;padding:8px 14px}
        .cidade-item{padding:6px 0;border-bottom:1px solid #f0f0f0}
        .cidade-header{cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-size:14px;color:#444}
        .cidade-header:hover{color:${COR}}
        .bairros-list{padding:6px 0 6px 16px;display:flex;flex-wrap:wrap;gap:6px}
        .bairro-chip{background:#f5f5f5;padding:4px 10px;border-radius:20px;font-size:12px;color:#555;cursor:pointer}
        .bairro-chip:hover{background:${COR};color:#fff}
        
        /* STORIES */
        .stories-container{padding:12px 0;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch}
        .stories-container::-webkit-scrollbar{display:none}
        .stories-list{display:flex;gap:12px;padding:0 16px}
        .story-item{flex-shrink:0;width:72px;cursor:pointer;text-align:center}
        .story-avatar{width:68px;height:68px;border-radius:50%;padding:3px;background:linear-gradient(135deg,${COR},#ff6b6b)}
        .story-avatar.visto{background:#ddd}
        .story-avatar-inner{width:100%;height:100%;border-radius:50%;border:3px solid #fff;overflow:hidden}
        .story-avatar-inner img{width:100%;height:100%;object-fit:cover}
        .story-nome{font-size:11px;color:#333;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .story-badge{position:absolute;bottom:0;right:0;width:20px;height:20px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800}
        .story-badge.super_vip{background:linear-gradient(135deg,#d4af37,#f5d070);color:#000}
        .story-badge.vip{background:#666;color:#fff}
        
        .story-modal{position:fixed;inset:0;background:#000;z-index:10000;display:flex;align-items:center;justify-content:center}
        .story-content{position:relative;width:100%;max-width:420px;height:100vh}
        .story-image{width:100%;height:100%;object-fit:contain;background:#111}
        .story-header{position:absolute;top:0;left:0;right:0;padding:12px;background:linear-gradient(to bottom,rgba(0,0,0,.6),transparent);z-index:10}
        .story-progress{display:flex;gap:4px;margin-bottom:12px}
        .story-progress-bar{flex:1;height:3px;background:rgba(255,255,255,.3);border-radius:2px;overflow:hidden}
        .story-progress-fill{height:100%;background:#fff;transition:width 100ms linear}
        .story-user{display:flex;align-items:center;gap:10px}
        .story-user-avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #fff}
        .story-user-nome{color:#fff;font-weight:600;font-size:14px}
        .story-user-tempo{color:rgba(255,255,255,.6);font-size:12px}
        .story-close{position:absolute;top:16px;right:16px;background:none;border:none;color:#fff;cursor:pointer;z-index:20;padding:8px}
        .story-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.2);border:none;width:44px;height:44px;border-radius:50%;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10}
        .story-nav.prev{left:10px}
        .story-nav.next{right:10px}
        .story-touch-left,.story-touch-right{position:absolute;top:80px;bottom:80px;width:40%;z-index:5}
        .story-touch-left{left:0}
        .story-touch-right{right:0}
        .story-link{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);background:${COR};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;z-index:10}
        
        @media(max-width:600px){
          .filtros-desktop{display:none}
          .filtros-mobile{display:block}
          .mobile-row{margin-bottom:8px}
          .mobile-row input,.mobile-row select{width:100%}
        }
        @media(min-width:601px){
          .filtros-desktop{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
          .filtros-mobile{display:none}
        }
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
            <Link href="/minha-conta" style={{color:'#fff',fontSize:'13px',textDecoration:'none'}}>
              Minha Conta
            </Link>
          </div>
        </div>
      </header>

      {/* FILTROS */}
      <div className="filtros-container">
        <div className="wrap">
          {/* Sexo */}
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
            <span style={{fontSize:'13px',fontWeight:600,color:'#555'}}>Sexo:</span>
            {[{id:'mulher',label:'Garotas'},{id:'trans',label:'Trans'},{id:'homem',label:'Homens'}].map(s => (
              <button key={s.id} className="fbtn" onClick={() => setSexo(s.id)}
                style={{background:sexo===s.id?COR:'#f0f0f0',color:sexo===s.id?'#fff':'#555'}}>
                {s.label}
              </button>
            ))}
          </div>

          {/* DESKTOP */}
          <div className="filtros-desktop">
            <div className="cidade-container" ref={cidadeRef}>
              <input
                type="text"
                className="cidade-input"
                placeholder="Digite cidade ou bairro..."
                value={cidadeBusca}
                onChange={e => {
                  setCidadeBusca(e.target.value)
                  setCidadeSelecionada(null)
                  setBairroSelecionado('')
                  setUsandoGeo(false)
                }}
                onFocus={abrirSugestoes}
                onClick={abrirSugestoes}
              />
              {cidadeBusca && (
                <button className="cidade-clear" onClick={limparCidade}><X size={16} /></button>
              )}
              
              {/* AUTOCOMPLETE */}
              {mostrarSugestoes && sugestoes.length > 0 && (
                <div className="sugestoes-dropdown">
                  {sugestoes.map((s, i) => (
                    <div key={i} className="sugestao-item" onClick={() => selecionarSugestao(s)}>
                      <div className={`sugestao-icon ${s.tipo}`}>
                        {s.tipo === 'cidade' ? '🏙️' : '📍'}
                      </div>
                      <div className="sugestao-texto">
                        {s.tipo === 'cidade' ? (
                          <><strong>{s.cidade}</strong><span>, {TODOS_ESTADOS[s.estado] || s.estado}</span></>
                        ) : (
                          <><strong>{s.bairro}</strong><span>, {s.cidade} - {s.estado}</span></>
                        )}
                      </div>
                      <span className="sugestao-count">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <select className="km-select" value={distanciaKm} onChange={e => setDistanciaKm(Number(e.target.value))}>
              <option value="5">+ 5 km</option>
              <option value="10">+ 10 km</option>
              <option value="25">+ 25 km</option>
              <option value="50">+ 50 km</option>
              <option value="100">+ 100 km</option>
            </select>

            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome, descrição, bairro..."
              value={palavraChave}
              onChange={e => setPalavraChave(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && executarBusca()}
            />

            <button className="btn-procurar" onClick={executarBusca}>
              <Search size={16} />
              Procurar
            </button>
          </div>

          {/* MOBILE - CORRIGIDO COM onClick E onFocus */}
          <div className="filtros-mobile">
            <div className="mobile-row cidade-container" ref={cidadeRef}>
              <input 
                type="text" 
                className="cidade-input" 
                placeholder="Digite cidade ou bairro..."
                value={cidadeBusca}
                onChange={e => { 
                  setCidadeBusca(e.target.value)
                  setCidadeSelecionada(null)
                  setBairroSelecionado('')
                  setUsandoGeo(false) 
                }}
                onFocus={abrirSugestoes}
                onClick={abrirSugestoes}
              />
              {cidadeBusca && <button className="cidade-clear" onClick={limparCidade}><X size={16} /></button>}
              
              {/* AUTOCOMPLETE MOBILE */}
              {mostrarSugestoes && sugestoes.length > 0 && (
                <div className="sugestoes-dropdown">
                  {sugestoes.map((s, i) => (
                    <div key={i} className="sugestao-item" onClick={() => selecionarSugestao(s)}>
                      <div className={`sugestao-icon ${s.tipo}`}>
                        {s.tipo === 'cidade' ? '🏙️' : '📍'}
                      </div>
                      <div className="sugestao-texto">
                        {s.tipo === 'cidade' ? (
                          <><strong>{s.cidade}</strong><span>, {TODOS_ESTADOS[s.estado] || s.estado}</span></>
                        ) : (
                          <><strong>{s.bairro}</strong><span>, {s.cidade} - {s.estado}</span></>
                        )}
                      </div>
                      <span className="sugestao-count">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mobile-row">
              <select className="km-select" value={distanciaKm} onChange={e => setDistanciaKm(Number(e.target.value))}>
                <option value="5">+ 5 km</option>
                <option value="10">+ 10 km</option>
                <option value="25">+ 25 km</option>
                <option value="50">+ 50 km</option>
                <option value="100">+ 100 km</option>
              </select>
            </div>
            <div className="mobile-row">
              <input type="text" className="search-input" placeholder="Buscar por nome, descrição, bairro..."
                value={palavraChave} onChange={e => setPalavraChave(e.target.value)} style={{width:'100%'}} />
            </div>
            <div className="mobile-row">
              <button className="btn-procurar" onClick={executarBusca} style={{width:'100%',justifyContent:'center'}}>
                <Search size={16} /> Procurar
              </button>
            </div>
          </div>

          {/* FILTROS ATIVOS */}
          {temFiltroAtivo && (
            <div className="filtros-ativos">
              <span style={{fontSize:'12px',color:'#666',marginRight:'4px'}}>Filtros:</span>
              {usandoGeo && (
                <span className="filtro-tag">
                  📍 Até {distanciaKm}km de você
                  <button onClick={() => setUsandoGeo(false)}><X size={12}/></button>
                </span>
              )}
              {cidadeSelecionada && (
                <span className="filtro-tag">
                  🏙️ {cidadeSelecionada.cidade}, {cidadeSelecionada.estado}
                  <button onClick={() => { setCidadeSelecionada(null); setCidadeBusca('') }}><X size={12}/></button>
                </span>
              )}
              {bairroSelecionado && (
                <span className="filtro-tag">
                  📍 {bairroSelecionado}
                  <button onClick={() => setBairroSelecionado('')}><X size={12}/></button>
                </span>
              )}
              {palavraChave && (
                <span className="filtro-tag">
                  🔍 "{palavraChave}"
                  <button onClick={() => setPalavraChave('')}><X size={12}/></button>
                </span>
              )}
              <button onClick={limparTudo} style={{marginLeft:'auto',color:COR,fontSize:'12px',fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>
                Limpar tudo
              </button>
            </div>
          )}

          {/* Rodapé */}
          <div className="filtros-rodape">
            <button onClick={() => setMostrarListaCidades(!mostrarListaCidades)}>
              <MapPin size={14} />
              Lista de cidades
              <ChevronDown size={14} />
            </button>
            <button onClick={pedirLocalizacao} style={{color: usandoGeo ? COR : '#555', fontWeight: usandoGeo ? 700 : 400}}>
              {localizando ? <Loader2 size={14} /> : <Navigation size={14} />}
              Me localize
            </button>
          </div>

          {/* LISTA DE CIDADES */}
          {mostrarListaCidades && (
            <div className="lista-locais">
              {Object.entries(TODOS_ESTADOS).sort((a,b) => a[1].localeCompare(b[1])).map(([uf, nome]) => (
                <div key={uf} className="estado-item">
                  <div className="estado-header" onClick={() => setEstadoExpandido(estadoExpandido === uf ? null : uf)}>
                    <span>{estadoExpandido === uf ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} {nome}</span>
                    <span style={{color:'#888',fontWeight:400,fontSize:'12px'}}>{dadosLocais[uf]?.count || 0}</span>
                  </div>
                  {estadoExpandido === uf && dadosLocais[uf] && (
                    <div className="estado-content">
                      {Object.entries(dadosLocais[uf].cidades).sort((a,b) => b[1].count - a[1].count).map(([cidade, info]) => (
                        <div key={cidade} className="cidade-item">
                          <div className="cidade-header">
                            <span onClick={() => selecionarCidadeLista(cidade, uf)} style={{cursor:'pointer'}}>
                              {cidade} <span style={{color:'#888',fontSize:'12px'}}>({info.count})</span>
                            </span>
                            {info.bairros.length > 0 && (
                              <span onClick={() => setCidadeExpandida(cidadeExpandida === cidade ? null : cidade)} style={{fontSize:'11px',color:'#888',cursor:'pointer'}}>
                                {info.bairros.length} bairros {cidadeExpandida === cidade ? '▼' : '▶'}
                              </span>
                            )}
                          </div>
                          {cidadeExpandida === cidade && info.bairros.length > 0 && (
                            <div className="bairros-list">
                              {info.bairros.sort().map(b => (
                                <span key={b} className="bairro-chip" onClick={() => selecionarBairroLista(b, cidade, uf)}>{b}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {Object.keys(dadosLocais[uf].cidades).length === 0 && (
                        <p style={{color:'#888',fontSize:'13px',padding:'8px 0'}}>Nenhum anúncio neste estado</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="wrap" style={{padding:'16px 16px 32px'}}>
        
        {/* STORIES */}
        {storiesAcompanhantes.length > 0 && (
          <div className="stories-container">
            <div className="stories-list">
              {storiesAcompanhantes.map(acomp => (
                <div key={acomp.id} className="story-item" onClick={() => abrirStory(acomp)}>
                  <div style={{position:'relative'}}>
                    <div className={`story-avatar ${acomp.visto ? 'visto' : ''}`}>
                      <div className="story-avatar-inner">
                        <Image src={acomp.foto_capa} alt={acomp.nome} width={62} height={62} style={{width:'100%',height:'100%',objectFit:'cover'}} />
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
        )}

        {/* LUNA */}
        <Link href="/luna" style={{textDecoration:'none',display:'block',marginBottom:'16px'}}>
          <div className="luna-banner">
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <MessageCircleHeart size={22} color="#fff" />
              </div>
              <div>
                <p style={{color:'#fff',fontSize:'15px',fontWeight:700}}>Fale com a Luna ao vivo 😈</p>
                <p style={{color:'rgba(255,255,255,.6)',fontSize:'12px'}}>Está online agora 👉</p>
              </div>
            </div>
            <div style={{background:'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',padding:'8px 14px',borderRadius:'20px',color:'#fff',fontSize:'12px',fontWeight:700}}>Conversar 💕</div>
          </div>
        </Link>

        {/* SUPER VIPs */}
        {superVips.length > 0 && (
          <div style={{marginBottom:'24px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'10px'}}>
              <span>⭐</span>
              <h2 style={{fontSize:'15px',fontWeight:800,color:'#222'}}>Disponíveis Agora</h2>
              <span className="disponivel" style={{width:'7px',height:'7px',background:'#00b450',borderRadius:'50%'}}/>
            </div>
            <div className="svip-grid">
              {superVips.map((p: any) => (
                <Link key={p.id} href={`/acompanhante/${p.slug}/`} className="svip-card">
                  <div style={{position:'relative',aspectRatio:'3/4',background:'#111',borderRadius:'8px',overflow:'hidden',border:'2px solid #d4af37'}}>
                    {p.foto_capa && <Image src={p.foto_capa} alt={p.nome} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{objectFit:'cover'}}/>}
                    <div style={{position:'absolute',top:'6px',left:'6px'}}><span className="badge-svip">★ SUPER VIP</span></div>
                    {p.distancia && <div style={{position:'absolute',top:'26px',left:'6px'}}><span className="badge-dist">📍 {p.distancia.toFixed(0)}km</span></div>}
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,.85))',padding:'20px 8px 8px'}}>
                      <p style={{color:'#fff',fontSize:'13px',fontWeight:700}}>{p.nome}</p>
                      <p style={{color:'rgba(255,255,255,.7)',fontSize:'10px'}}>{p.cidade}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{height:'1px',background:'#e0e0e0',margin:'20px 0'}}/>
          </div>
        )}

        {/* TÍTULO */}
        <h1 style={{fontSize:'18px',fontWeight:800,color:'#222',marginBottom:'14px'}}>
          {usandoGeo ? '📍 Perto de você'
            : bairroSelecionado ? `${bairroSelecionado}, ${cidadeSelecionada?.cidade}`
            : cidadeSelecionada ? `Acompanhantes em ${cidadeSelecionada.cidade}`
            : 'Acompanhantes no Brasil'
          }
          {perfis.length > 0 && <span style={{fontWeight:400,color:'#888',marginLeft:'8px'}}>({perfis.length}+)</span>}
        </h1>

        {carregando ? (
          <div style={{textAlign:'center',padding:'50px',color:'#999'}}>Carregando...</div>
        ) : perfis.length === 0 ? (
          <div style={{textAlign:'center',padding:'50px'}}>
            <p style={{color:'#666',marginBottom:'12px'}}>Nenhuma acompanhante encontrada.</p>
            <button onClick={limparTudo} style={{color:COR,background:'none',border:`1px solid ${COR}`,padding:'8px 20px',borderRadius:'6px',cursor:'pointer',fontWeight:700}}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid">
              {perfis.map((p: any) => (
                <Link key={p.id} href={`/acompanhante/${p.slug}/`} className="card">
                  <div style={{position:'relative',aspectRatio:'3/4',background:'#1a1a1a',overflow:'hidden'}}>
                    {p.foto_capa && <Image src={p.foto_capa} alt={p.nome} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{objectFit:'cover'}}/>}
                    <div style={{position:'absolute',top:'6px',left:'6px',display:'flex',flexDirection:'column',gap:'3px'}}>
                      {p.plano==='super_vip' && <span className="badge-svip">★ SUPER VIP</span>}
                      {p.plano==='vip' && <span className="badge-vip">◆ VIP</span>}
                      {p.distancia && <span className="badge-dist">📍 {p.distancia.toFixed(0)}km</span>}
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
              <button className="load-more" disabled={carregandoMais} onClick={() => { const np = pagina+1; setPagina(np); buscarPerfis(np) }}>
                {carregandoMais ? 'Carregando...' : 'Ver mais'}
              </button>
            )}
          </>
        )}
      </div>

      {/* MODAL STORY */}
      {storyAberto && (
        <div className="story-modal">
          <div className="story-content">
            <img src={storyAberto.acompanhante.stories[storyAberto.index].url} className="story-image" alt="" />
            
            <div className="story-header">
              <div className="story-progress">
                {storyAberto.acompanhante.stories.map((_, i) => (
                  <div key={i} className="story-progress-bar">
                    <div className="story-progress-fill" style={{
                      width: i < storyAberto.index ? '100%' : i === storyAberto.index ? `${progresso}%` : '0%'
                    }} />
                  </div>
                ))}
              </div>
              <div className="story-user">
                <img src={storyAberto.acompanhante.foto_capa} className="story-user-avatar" alt="" />
                <div>
                  <p className="story-user-nome">{storyAberto.acompanhante.nome}</p>
                  <p className="story-user-tempo">
                    {(() => {
                      const mins = Math.floor((Date.now() - new Date(storyAberto.acompanhante.stories[storyAberto.index].criado_em).getTime()) / 60000)
                      return mins < 60 ? `${mins}min` : `${Math.floor(mins / 60)}h`
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            <button className="story-close" onClick={fecharStory}><X size={28} /></button>
            
            <div className="story-touch-left" onClick={anteriorStory} />
            <div className="story-touch-right" onClick={proximoStory} />
            
            <button className="story-nav prev" onClick={anteriorStory}><ChevronLeft size={24} /></button>
            <button className="story-nav next" onClick={proximoStory}><ChevronRight size={24} /></button>
            
            <Link href={`/acompanhante/${storyAberto.acompanhante.slug}/`} className="story-link" onClick={fecharStory}>
              Ver perfil
            </Link>
          </div>
        </div>
      )}

      {/* FOOTER SEO */}
      <div style={{ 
        background: '#1a1a1a', 
        padding: '40px 16px',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            color: '#fff', 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Encontre Acompanhantes por Característica
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '24px'
          }}>
            <div>
              <h3 style={{ color: COR, fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Por Cabelo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/c/loiras-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Loiras SP</Link>
                <Link href="/c/loiras-rj" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Loiras RJ</Link>
                <Link href="/c/morenas-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Morenas SP</Link>
                <Link href="/c/morenas-rj" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Morenas RJ</Link>
                <Link href="/c/ruivas-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Ruivas SP</Link>
                <Link href="/c/negras-rj" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Negras RJ</Link>
              </div>
            </div>
            
            <div>
              <h3 style={{ color: COR, fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Por Etnia</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/c/brancas-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Brancas SP</Link>
                <Link href="/c/mulatas-rj" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Mulatas RJ</Link>
                <Link href="/c/asiaticas-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Asiáticas SP</Link>
                <Link href="/c/latinas-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Latinas SP</Link>
              </div>
            </div>
            
            <div>
              <h3 style={{ color: COR, fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Especial</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/c/com-local-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Com Local SP</Link>
                <Link href="/c/com-local-rj" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Com Local RJ</Link>
                <Link href="/c/verificadas-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Verificadas SP</Link>
                <Link href="/c/super-vip-sp" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Super VIP SP</Link>
                <Link href="/c/super-vip-rj" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Super VIP RJ</Link>
              </div>
            </div>
            
            <div>
              <h3 style={{ color: COR, fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>Outros Estados</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/c/loiras-mg" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Loiras MG</Link>
                <Link href="/c/morenas-ba" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Morenas BA</Link>
                <Link href="/c/loiras-pr" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Loiras PR</Link>
                <Link href="/c/morenas-rs" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Morenas RS</Link>
                <Link href="/c/loiras-df" style={{ color: '#aaa', textDecoration: 'none', fontSize: '13px' }}>Loiras DF</Link>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #333', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '12px' }}>
              © {new Date().getFullYear()} VipAcompanhante - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
