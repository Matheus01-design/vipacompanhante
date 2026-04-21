import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const estado = searchParams.get('estado')
    
    if (q.length < 2) {
      return NextResponse.json({ cidades: [] })
    }
    
    // Buscar cidades únicas com contagem
    let query = supabase
      .from('acompanhantes')
      .select('cidade, estado')
      .eq('status', 'ativo')
      .ilike('cidade', `%${q}%`)
      .not('cidade', 'is', null)
    
    if (estado) {
      query = query.eq('estado', estado)
    }
    
    const { data, error } = await query.limit(500)
    
    if (error) {
      console.error('Erro ao buscar cidades:', error)
      return NextResponse.json({ cidades: [] })
    }
    
    // Agrupar e contar
    const cidadesMap = new Map<string, { cidade: string; estado: string; total: number }>()
    
    for (const row of data || []) {
      if (row.cidade && row.estado) {
        const key = `${row.cidade}-${row.estado}`
        const existing = cidadesMap.get(key)
        if (existing) {
          existing.total++
        } else {
          cidadesMap.set(key, { cidade: row.cidade, estado: row.estado, total: 1 })
        }
      }
    }
    
    // Ordenar por total (mais populares primeiro)
    const cidades = Array.from(cidadesMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
    
    return NextResponse.json({ cidades })
    
  } catch (error) {
    console.error('Erro na API cidades:', error)
    return NextResponse.json({ cidades: [] })
  }
}
