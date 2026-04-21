// Script para migrar TODAS as imagens externas para Supabase Storage
// Rode com: node scripts/migrar-imagens.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function downloadImage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    return null
  }
}

function getExtension(url) {
  const match = url.match(/\.(jpg|jpeg|png|webp|gif)/i)
  return match ? match[1].toLowerCase() : 'jpg'
}

async function migrarTodas() {
  console.log('🚀 Iniciando migração de TODAS as imagens...\n')

  let totalSucesso = 0
  let totalFalha = 0
  let rodada = 1

  while (true) {
    console.log(`\n📦 Rodada ${rodada}...`)
    
    const { data: perfis, error } = await supabase
      .from('acompanhantes')
      .select('id, nome, foto_capa')
      .not('foto_capa', 'is', null)
      .not('foto_capa', 'ilike', '%supabase%')
      .limit(50)

    if (error) {
      console.error('Erro ao buscar perfis:', error)
      break
    }

    if (!perfis || perfis.length === 0) {
      console.log('\n✅ Não há mais perfis para migrar!')
      break
    }

    console.log(`Encontrados ${perfis.length} perfis\n`)

    for (const perfil of perfis) {
      process.stdout.write(`${perfil.nome}... `)

      const imageBuffer = await downloadImage(perfil.foto_capa)
      
      if (!imageBuffer) {
        await supabase
          .from('acompanhantes')
          .update({ foto_capa: null })
          .eq('id', perfil.id)
        console.log('❌')
        totalFalha++
        continue
      }

      const ext = getExtension(perfil.foto_capa)
      const fileName = `perfis/${perfil.id}/foto_capa.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, imageBuffer, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true
        })

      if (uploadError) {
        console.log('❌ Upload falhou')
        totalFalha++
        continue
      }

      const { data: urlData } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName)

      await supabase
        .from('acompanhantes')
        .update({ foto_capa: urlData.publicUrl })
        .eq('id', perfil.id)

      console.log('✅')
      totalSucesso++
    }

    rodada++
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n========================================`)
  console.log(`🎉 MIGRAÇÃO COMPLETA!`)
  console.log(`✅ Sucesso: ${totalSucesso}`)
  console.log(`❌ Falha: ${totalFalha}`)
  console.log(`========================================`)
}

migrarTodas()
