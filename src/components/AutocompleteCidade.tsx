'use client'

import { useState, useEffect, useRef } from 'react'

interface Cidade {
  cidade: string
  estado: string
  total: number
}

interface AutocompleteCidadeProps {
  value: string
  estado: string
  onChange: (cidade: string, estado: string) => void
  placeholder?: string
  className?: string
}

export default function AutocompleteCidade({
  value,
  estado,
  onChange,
  placeholder = 'Digite sua cidade...',
  className = ''
}: AutocompleteCidadeProps) {
  const [inputValue, setInputValue] = useState(value)
  const [sugestoes, setSugestoes] = useState<Cidade[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrar, setMostrar] = useState(false)
  const [selecionado, setSelecionado] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)
  
  // Buscar cidades quando o usuário digita
  useEffect(() => {
    const buscar = async () => {
      if (inputValue.length < 2) {
        setSugestoes([])
        return
      }
      
      setLoading(true)
      
      try {
        // Buscar no banco via API
        const params = new URLSearchParams({ q: inputValue })
        if (estado) params.append('estado', estado)
        
        const response = await fetch(`/api/cidades?${params}`)
        const data = await response.json()
        
        setSugestoes(data.cidades || [])
        setMostrar(true)
      } catch (error) {
        console.error('Erro ao buscar cidades:', error)
        setSugestoes([])
      } finally {
        setLoading(false)
      }
    }
    
    const timeout = setTimeout(buscar, 300)
    return () => clearTimeout(timeout)
  }, [inputValue, estado])
  
  // Sincronizar valor externo
  useEffect(() => {
    setInputValue(value)
  }, [value])
  
  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!mostrar || sugestoes.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelecionado(prev => 
          prev < sugestoes.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelecionado(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (selecionado >= 0 && sugestoes[selecionado]) {
          selecionarCidade(sugestoes[selecionado])
        }
        break
      case 'Escape':
        setMostrar(false)
        setSelecionado(-1)
        break
    }
  }
  
  // Selecionar cidade
  const selecionarCidade = (cidade: Cidade) => {
    setInputValue(cidade.cidade)
    onChange(cidade.cidade, cidade.estado)
    setMostrar(false)
    setSelecionado(-1)
    inputRef.current?.blur()
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => inputValue.length >= 2 && setMostrar(true)}
          onBlur={() => setTimeout(() => setMostrar(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none pr-10"
        />
        
        {/* Ícone de loading ou busca */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <svg className="w-5 h-5 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </div>
      
      {/* Lista de sugestões */}
      {mostrar && sugestoes.length > 0 && (
        <ul
          ref={listaRef}
          className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
        >
          {sugestoes.map((cidade, index) => (
            <li
              key={`${cidade.cidade}-${cidade.estado}`}
              onClick={() => selecionarCidade(cidade)}
              className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                index === selecionado 
                  ? 'bg-rose-500/20 text-rose-400' 
                  : 'hover:bg-zinc-700 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                <span>{cidade.cidade}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-400">{cidade.estado}</span>
                <span className="text-zinc-500 text-xs">
                  {cidade.total} {cidade.total === 1 ? 'perfil' : 'perfis'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Mensagem quando não encontra */}
      {mostrar && inputValue.length >= 2 && sugestoes.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4 text-center">
          <p className="text-zinc-400 text-sm">
            Nenhuma cidade encontrada com "{inputValue}"
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            Verifique a ortografia ou seja a primeira desta cidade!
          </p>
        </div>
      )}
    </div>
  )
}
