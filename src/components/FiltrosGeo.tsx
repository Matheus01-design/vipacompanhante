'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface FiltrosGeoProps {
  estados: string[]
  cidades: { cidade: string; estado: string }[]
}

export default function FiltrosGeo({ estados, cidades }: FiltrosGeoProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Estados do filtro
  const [estadoSelecionado, setEstadoSelecionado] = useState(searchParams.get('estado') || '')
  const [cidadeSelecionada, setCidadeSelecionada] = useState(searchParams.get('cidade') || '')
  const [palavraChave, setPalavraChave] = useState(searchParams.get('q') || '')
  const [pertoMim, setPertoMim] = useState(false)
  const [localizando, setLocalizando] = useState(false)
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<{lat: number, lng: number} | null>(null)
  const [distanciaMax, setDistanciaMax] = useState(searchParams.get('km') || '25')
  
  // Autocomplete
  const [sugestoesCidades, setSugestoesCidades] = useState<typeof cidades>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const inputCidadeRef = useRef<HTMLInputElement>(null)
  
  // Filtrar cidades pelo estado selecionado
  const cidadesFiltradas = estadoSelecionado 
    ? cidades.filter(c => c.estado === estadoSelecionado)
    : cidades
  
  // Autocomplete de cidades
  useEffect(() => {
    if (cidadeSelecionada.length >= 2) {
      const filtradas = cidadesFiltradas
        .filter(c => c.cidade.toLowerCase().includes(cidadeSelecionada.toLowerCase()))
        .slice(0, 8)
      setSugestoesCidades(filtradas)
      setMostrarSugestoes(true)
    } else {
      setSugestoesCidades([])
      setMostrarSugestoes(false)
    }
  }, [cidadeSelecionada, estadoSelecionado])
  
  // Função para pedir localização
  const pedirLocalizacao = () => {
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização')
      return
    }
    
    setLocalizando(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMinhaLocalizacao({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setPertoMim(true)
        setLocalizando(false)
        
        // Salvar no localStorage para próximas visitas
        localStorage.setItem('userLocation', JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }))
      },
      (error) => {
        setLocalizando(false)
        if (error.code === error.PERMISSION_DENIED) {
          alert('Você precisa permitir o acesso à localização')
        } else {
          alert('Não foi possível obter sua localização')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    )
  }
  
  // Carregar localização salva
  useEffect(() => {
    const saved = localStorage.getItem('userLocation')
    if (saved) {
      try {
        const loc = JSON.parse(saved)
        setMinhaLocalizacao(loc)
      } catch {}
    }
  }, [])
  
  // Aplicar filtros
  const aplicarFiltros = () => {
    const params = new URLSearchParams()
    
    if (estadoSelecionado) params.set('estado', estadoSelecionado)
    if (cidadeSelecionada) params.set('cidade', cidadeSelecionada)
    if (palavraChave) params.set('q', palavraChave)
    
    if (pertoMim && minhaLocalizacao) {
      params.set('lat', minhaLocalizacao.lat.toString())
      params.set('lng', minhaLocalizacao.lng.toString())
      params.set('km', distanciaMax)
    }
    
    router.push(`/busca?${params.toString()}`)
  }
  
  // Limpar filtros
  const limparFiltros = () => {
    setEstadoSelecionado('')
    setCidadeSelecionada('')
    setPalavraChave('')
    setPertoMim(false)
    router.push('/busca')
  }
  
  return (
    <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-700/50">
      {/* Título */}
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Encontre Acompanhantes
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Perto de Mim */}
        <div className="lg:col-span-1">
          <label className="block text-sm text-zinc-400 mb-2">📍 Localização</label>
          <button
            onClick={pertoMim ? () => setPertoMim(false) : pedirLocalizacao}
            disabled={localizando}
            className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              pertoMim 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {localizando ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Localizando...
              </>
            ) : pertoMim ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                Perto de mim ✓
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Perto de mim
              </>
            )}
          </button>
          
          {/* Slider de distância */}
          {pertoMim && (
            <div className="mt-2">
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={distanciaMax}
                onChange={(e) => setDistanciaMax(e.target.value)}
                className="w-full accent-rose-500"
              />
              <span className="text-xs text-zinc-400">Até {distanciaMax}km</span>
            </div>
          )}
        </div>
        
        {/* Estado */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Estado</label>
          <select
            value={estadoSelecionado}
            onChange={(e) => {
              setEstadoSelecionado(e.target.value)
              setCidadeSelecionada('')
            }}
            className="w-full px-4 py-3 rounded-xl bg-zinc-700 text-white border border-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
          >
            <option value="">Todos os estados</option>
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
        
        {/* Cidade (com autocomplete) */}
        <div className="relative">
          <label className="block text-sm text-zinc-400 mb-2">Cidade</label>
          <input
            ref={inputCidadeRef}
            type="text"
            value={cidadeSelecionada}
            onChange={(e) => setCidadeSelecionada(e.target.value)}
            onFocus={() => cidadeSelecionada.length >= 2 && setMostrarSugestoes(true)}
            onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
            placeholder="Digite a cidade..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-700 text-white border border-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
          />
          
          {/* Sugestões de autocomplete */}
          {mostrarSugestoes && sugestoesCidades.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {sugestoesCidades.map((c, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setCidadeSelecionada(c.cidade)
                    setEstadoSelecionado(c.estado)
                    setMostrarSugestoes(false)
                  }}
                  className="px-4 py-2 hover:bg-zinc-700 cursor-pointer text-white flex justify-between"
                >
                  <span>{c.cidade}</span>
                  <span className="text-zinc-400 text-sm">{c.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Palavra-chave */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Buscar por</label>
          <input
            type="text"
            value={palavraChave}
            onChange={(e) => setPalavraChave(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
            placeholder="Nome, característica..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-700 text-white border border-zinc-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
          />
        </div>
      </div>
      
      {/* Botões */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={aplicarFiltros}
          className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:from-rose-500 hover:to-pink-500 transition-all shadow-lg shadow-rose-500/30"
        >
          🔍 Buscar
        </button>
        <button
          onClick={limparFiltros}
          className="px-6 py-3 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 transition-all"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}
