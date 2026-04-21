import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('foto') as File
    if (!file) return NextResponse.json({ error: 'Nenhuma foto enviada' }, { status: 400 })

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Arquivo deve ser uma imagem' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Imagem deve ter no máximo 5MB' }, { status: 400 })

    // Verificar limite de fotos por plano
    const { data: acomp } = await supabase.from('acompanhantes').select('plano,fotos').eq('user_id', user.id).single()
    if (!acomp) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const limites = { gratis: 1, vip: 10, super_vip: 999 }
    const limite = limites[acomp.plano as keyof typeof limites] || 1
    const fotosAtuais = (acomp.fotos || []).length

    if (fotosAtuais >= limite) {
      return NextResponse.json({ error: `Seu plano permite no máximo ${limite} foto${limite > 1 ? 's' : ''}. Faça upgrade para adicionar mais.` }, { status: 400 })
    }

    // Gerar nome único para o arquivo
    const ext = file.name.split('.').pop()
    const nomeArquivo = `${user.id}/${Date.now()}.${ext}`

    // Upload para Supabase Storage
    const bytes = await file.arrayBuffer()
    const { data: upload, error: uploadError } = await supabase.storage
      .from('fotos-acompanhantes')
      .upload(nomeArquivo, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Erro ao enviar foto' }, { status: 500 })
    }

    // Pegar URL pública
    const { data: { publicUrl } } = supabase.storage.from('fotos-acompanhantes').getPublicUrl(nomeArquivo)

    // Atualizar perfil com a nova foto
    const fotasAtualizadas = [...(acomp.fotos || []), publicUrl]
    const fotoCapa = fotasAtualizadas[0]

    await supabase.from('acompanhantes').update({ fotos: fotasAtualizadas, foto_capa: fotoCapa }).eq('user_id', user.id)

    return NextResponse.json({ url: publicUrl, fotos: fotasAtualizadas })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { url } = await request.json()
    const { data: acomp } = await supabase.from('acompanhantes').select('fotos').eq('user_id', user.id).single()
    if (!acomp) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const fotasAtualizadas = (acomp.fotos || []).filter((f: string) => f !== url)
    const fotoCapa = fotasAtualizadas[0] || null
    await supabase.from('acompanhantes').update({ fotos: fotasAtualizadas, foto_capa: fotoCapa }).eq('user_id', user.id)

    // Tentar remover do storage (se for do nosso storage)
    if (url.includes('supabase')) {
      const path = url.split('fotos-acompanhantes/')[1]
      if (path) await supabase.storage.from('fotos-acompanhantes').remove([path])
    }

    return NextResponse.json({ fotos: fotasAtualizadas })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
