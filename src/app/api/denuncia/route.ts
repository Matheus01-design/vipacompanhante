import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { acompanhante_id, motivo, descricao, email } = body
    
    if (!acompanhante_id || !motivo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Pegar IP do denunciante
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'desconhecido'
    
    const { data, error } = await supabase
      .from('denuncias')
      .insert({
        acompanhante_id,
        motivo,
        descricao: descricao || '',
        email_denunciante: email || '',
        ip_denunciante: ip,
        status: 'pendente'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar denúncia:', error)
      return NextResponse.json({ error: 'Erro ao enviar denúncia' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Erro na API de denúncias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== '0ff107ff-8e52-4781-aaeb-90d88edfeef9') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pendente'
    
    const { data, error } = await supabase
      .from('denuncias')
      .select(`
        *,
        acompanhante:acompanhantes(id, nome, slug, foto_capa)
      `)
      .eq('status', status)
      .order('criado_em', { ascending: false })
      .limit(50)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== '0ff107ff-8e52-4781-aaeb-90d88edfeef9') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, status, resposta_admin } = body
    
    const { error } = await supabase
      .from('denuncias')
      .update({ 
        status, 
        resposta_admin,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
