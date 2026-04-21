import { createClient } from '@/lib/supabase/server'
import type { AcompanhantePublico, FiltrosListagem } from '@/types'

// Buscar acompanhantes com filtros
export async function getAcompanhantes(filtros: FiltrosListagem = {}, pagina = 1, porPagina = 24) {
  const supabase = await createClient()
  const offset = (pagina - 1) * porPagina

  let query = supabase
    .from('acompanhantes')
    .select('id,slug,nome,idade,sexo,estado,cidade,bairro,atendimento,preco,foto_capa,plano,verificado,criado_em', { count: 'exact' })
    .eq('status', 'ativo')
    .range(offset, offset + porPagina - 1)

  // Ordenação: super_vip primeiro, depois vip, depois grátis
  query = query.order('plano', { ascending: false }).order('criado_em', { ascending: false })

  if (filtros.sexo) query = query.eq('sexo', filtros.sexo)
  if (filtros.estado) query = query.eq('estado', filtros.estado)
  if (filtros.cidade) query = query.ilike('cidade', filtros.cidade)
  if (filtros.atendimento) query = query.contains('atendimento', [filtros.atendimento])
  if (filtros.precoMin) query = query.gte('preco_numero', filtros.precoMin)
  if (filtros.precoMax) query = query.lte('preco_numero', filtros.precoMax)

  const { data, error, count } = await query

  if (error) throw error
  return { acompanhantes: (data || []) as AcompanhantePublico[], total: count || 0 }
}

// Buscar perfil individual por slug
export async function getAcompanhantePorSlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('acompanhantes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'ativo')
    .single()

  if (error) return null
  return data
}

// Buscar destaques para a home (super_vip e vip)
export async function getDestaques(limite = 8) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('acompanhantes')
    .select('id,slug,nome,idade,sexo,estado,cidade,foto_capa,plano,verificado')
    .eq('status', 'ativo')
    .not('foto_capa', 'is', null)
    .order('criado_em', { ascending: false })
    .limit(limite)

  return (data || []) as AcompanhantePublico[]
}

// Buscar cidades disponíveis por estado
export async function getCidadesPorEstado(estado: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('acompanhantes')
    .select('cidade')
    .eq('estado', estado)
    .eq('status', 'ativo')

  const cidades = Array.from(new Set((data || []).map(d => d.cidade))).sort()
  return cidades
}

// Contar acompanhantes por estado (para o mapa/menu)
export async function getContagemPorEstado() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('acompanhantes')
    .select('estado')
    .eq('status', 'ativo')

  const contagem: Record<string, number> = {}
  ;(data || []).forEach(d => {
    contagem[d.estado] = (contagem[d.estado] || 0) + 1
  })
  return contagem
}
