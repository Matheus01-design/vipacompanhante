'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const COR = '#8B0000'

interface Filtros {
  cabelo?: string
  etnia?: string
  corpo?: string
  seios?: string
  tem_local?: boolean
  verificado?: boolean
  plano?: string
  novas?: boolean
}

interface Props {
  perfisIniciais: any[]
  filtros: Filtros
  estado?: string
}

export default function CategoriaCliente({ perfisIniciais, filtros, estado }: Props) {
  const [perfis, setPerfis] = useState<any[]>(perfisIniciais)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [temMais, setTemMais] = useState(perfisIniciais.length === 24)

  const supabase = createClient()

  async function carregarMais() {
    const proximaPagina = pagina + 1
    setCarregando(true)

    let query = supabase
      .from('acompanhantes')
      .select('id, slug, nome, cidade, estado, bairro, foto_capa, fotos, plano, verificado')
      .eq('status', 'ativo')
      .eq('sexo', 'mulher')
      .not('foto_capa', 'is', null)

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
      .range((proximaPagina - 1) * 24, proximaPagina * 24 - 1)

    const { data } = await query
    setPerfis(prev => [...prev, ...(data || [])])
    setPagina(proximaPagina)
    setTemMais((data || []).length === 24)
    setCarregando(false)
  }

  return (
    <>
      <div className="grid">
        {perfis.map((p: any) => (
          <Link key={p.id} href={`/acompanhante/${p.slug}/`} className="card">
            <div style={{ position: 'relative', aspectRatio: '3/4', background: '#1a1a1a', overflow: 'hidden' }}>
              {p.foto_capa && <Image src={p.foto_capa} alt={p.nome} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{ objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {p.plano === 'super_vip' && <span className="badge-svip">★ SUPER VIP</span>}
                {p.plano === 'vip' && <span className="badge-vip">◆ VIP</span>}
                {p.verificado && <span className="badge-verificado">✓ Verificada</span>}
              </div>
              <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Camera size={10} /> {Math.max((p.fotos || []).length, 1)}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `linear-gradient(transparent,${COR}ee)`, padding: '24px 8px 8px' }}>
                <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{p.nome}</h3>
                <div style={{ color: 'rgba(255,255,255,.9)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={10} /> {p.bairro ? `${p.bairro}, ` : ''}{p.cidade}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {temMais && (
        <button className="load-more" onClick={carregarMais} disabled={carregando}>
          {carregando ? 'Carregando...' : 'Ver mais'}
        </button>
      )}
    </>
  )
}
