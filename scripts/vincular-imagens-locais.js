// Script para vincular imagens do WordPress aos perfis no Supabase
// Rode com: node scripts/vincular-imagens-locais.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// CONFIGURAÇÃO - AJUSTE O CAMINHO SE NECESSÁRIO
const PASTA_UPLOADS = 'C:\\Users\\Matheus\\Downloads\\uploads'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Extensões válidas de imagem
const EXTENSOES_VALIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

// Extrair slug do nome do arquivo
function extrairSlug(nomeArquivo) {
  // Remove extensão
  let slug = nomeArquivo.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
  
  // Remove dimensões no final (-150x150, -768x432, etc)
  slug = slug.replace(/-\d+x\d+$/, '')
  
  return slug.toLowerCase()
}

// Buscar todas as imagens recursivamente
function buscarImagens(pasta, imagens = []) {
  if (!fs.existsSync(pasta)) {
    console.error(`❌ Pasta não encontrada: ${pasta}`)
    return imagens
  }

  const itens = fs.readdirSync(pasta)
  
  for (const item of itens) {
    const caminhoCompleto = path.join(pasta, item)
    const stat = fs.statSync(caminhoCompleto)
    
    if (stat.isDirectory()) {
      // Ignorar pastas de cache e plugins
      if (!['cache', 'elementor', 'fonts', 'wc-logs', 'complianz', 'pix-por-piggly', 'woocommerce_uploads', 'wp-file-manager-pro', 'pmpro-5046d58b26'].includes(item)) {
        buscarImagens(caminhoCompleto, imagens)
      }
    } else {
      const ext = path.extname(item).toLowerCase()
      if (EXTENSOES_VALIDAS.includes(ext)) {
        imagens.push({
          caminho: caminhoCompleto,
          nome: item,
          slug: extrairSlug(item),
          tamanho: stat.size,
          ehOriginal: !/-\d+x\d+\.(jpg|jpeg|png|webp|gif)$/i.test(item)
        })
      }
    }
  }
  
  return imagens
}

// Agrupar imagens por slug e pegar a melhor versão
function agruparPorSlug(imagens) {
  const grupos = {}
  
  for (const img of imagens) {
    if (!grupos[img.slug]) {
      grupos[img.slug] = []
    }
    grupos[img.slug].push(img)
  }
  
  // Para cada grupo, pegar a melhor imagem (original ou maior)
  const melhores = {}
  
  for (const [slug, lista] of Object.entries(grupos)) {
    // Prioridade: original > maior tamanho
    const original = lista.find(i => i.ehOriginal)
    if (original) {
      melhores[slug] = original
    } else {
      // Pega a maior
      lista.sort((a, b) => b.tamanho - a.tamanho)
      melhores[slug] = lista[0]
    }
  }
  
  return melhores
}

async function vincularImagens() {
  console.log('🔍 Buscando imagens na pasta...\n')
  
  const todasImagens = buscarImagens(PASTA_UPLOADS)
  console.log(`📁 Encontradas ${todasImagens.length} imagens\n`)
  
  if (todasImagens.length === 0) {
    console.log('❌ Nenhuma imagem encontrada. Verifique o caminho da pasta.')
    return
  }
  
  const imagensPorSlug = agruparPorSlug(todasImagens)
  const slugsUnicos = Object.keys(imagensPorSlug)
  console.log(`🏷️  ${slugsUnicos.length} slugs únicos\n`)
  
  // Buscar perfis que precisam de foto
  console.log('📊 Buscando perfis no banco...\n')
  
  const { data: perfis, error } = await supabase
    .from('acompanhantes')
    .select('id, slug, nome, foto_capa')
    .eq('status', 'ativo')
  
  if (error) {
    console.error('❌ Erro ao buscar perfis:', error)
    return
  }
  
  console.log(`👤 ${perfis.length} perfis ativos no banco\n`)
  
  // Criar mapa de perfis por slug
  const perfisPorSlug = {}
  for (const p of perfis) {
    if (p.slug) {
      perfisPorSlug[p.slug.toLowerCase()] = p
    }
  }
  
  let sucesso = 0
  let semMatch = 0
  let jaTemFoto = 0
  let erros = 0
  
  console.log('🚀 Iniciando vinculação...\n')
  
  for (const [slug, imagem] of Object.entries(imagensPorSlug)) {
    const perfil = perfisPorSlug[slug]
    
    if (!perfil) {
      semMatch++
      continue
    }
    
    // Verificar se já tem foto do Supabase
    if (perfil.foto_capa && perfil.foto_capa.includes('supabase')) {
      jaTemFoto++
      continue
    }
    
    process.stdout.write(`${perfil.nome}... `)
    
    try {
      // Ler arquivo
      const buffer = fs.readFileSync(imagem.caminho)
      const ext = path.extname(imagem.nome).toLowerCase().replace('.', '')
      const fileName = `perfis/${perfil.id}/foto_capa.${ext}`
      
      // Upload
      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, buffer, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true
        })
      
      if (uploadError) {
        console.log('❌ Upload falhou:', uploadError.message)
        erros++
        continue
      }
      
      // Pegar URL pública
      const { data: urlData } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName)
      
      // Atualizar banco
      const { error: updateError } = await supabase
        .from('acompanhantes')
        .update({ foto_capa: urlData.publicUrl })
        .eq('id', perfil.id)
      
      if (updateError) {
        console.log('❌ Atualização falhou:', updateError.message)
        erros++
        continue
      }
      
      console.log('✅')
      sucesso++
      
    } catch (err) {
      console.log('❌ Erro:', err.message)
      erros++
    }
  }
  
  console.log(`\n========================================`)
  console.log(`🎉 VINCULAÇÃO COMPLETA!`)
  console.log(`========================================`)
  console.log(`✅ Sucesso: ${sucesso}`)
  console.log(`⏭️  Já tinham foto: ${jaTemFoto}`)
  console.log(`🔍 Sem match no banco: ${semMatch}`)
  console.log(`❌ Erros: ${erros}`)
  console.log(`========================================`)
}

vincularImagens()
