// Script para verificar URLs antigas e encontrar 404s
// Rode com: node scripts/verificar-404.js

const fs = require('fs')
const path = require('path')

// Configuração
const ARQUIVO_URLS = 'C:\\Users\\Matheus\\Downloads\\urls-wordpress.txt'
const ARQUIVO_404 = 'C:\\Users\\Matheus\\Downloads\\urls-404.txt'
const ARQUIVO_OK = 'C:\\Users\\Matheus\\Downloads\\urls-ok.txt'
const CONCORRENCIA = 20 // Requisições simultâneas
const TIMEOUT = 10000 // 10 segundos

async function verificarUrl(url) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    })
    
    clearTimeout(timeoutId)
    return { url, status: response.status }
  } catch (error) {
    return { url, status: 'ERRO', error: error.message }
  }
}

async function processarLote(urls) {
  return Promise.all(urls.map(verificarUrl))
}

async function main() {
  console.log('📂 Lendo arquivo de URLs...\n')
  
  if (!fs.existsSync(ARQUIVO_URLS)) {
    console.error(`❌ Arquivo não encontrado: ${ARQUIVO_URLS}`)
    console.log('\nBaixe o arquivo urls-wordpress.txt e coloque em Downloads')
    process.exit(1)
  }
  
  const conteudo = fs.readFileSync(ARQUIVO_URLS, 'utf-8')
  const urls = conteudo.split('\n').filter(u => u.trim())
  
  console.log(`📊 Total de URLs: ${urls.length}\n`)
  console.log(`⚡ Concorrência: ${CONCORRENCIA} requisições simultâneas\n`)
  console.log('🚀 Iniciando verificação...\n')
  
  const urls404 = []
  const urlsOk = []
  const urlsRedirect = []
  const urlsErro = []
  
  let processadas = 0
  const inicio = Date.now()
  
  // Processar em lotes
  for (let i = 0; i < urls.length; i += CONCORRENCIA) {
    const lote = urls.slice(i, i + CONCORRENCIA)
    const resultados = await processarLote(lote)
    
    for (const r of resultados) {
      processadas++
      
      if (r.status === 404) {
        urls404.push(r.url)
        process.stdout.write('❌')
      } else if (r.status === 200) {
        urlsOk.push(r.url)
        process.stdout.write('✅')
      } else if (r.status >= 300 && r.status < 400) {
        urlsRedirect.push(r.url)
        process.stdout.write('➡️')
      } else {
        urlsErro.push(`${r.url} (${r.status})`)
        process.stdout.write('⚠️')
      }
    }
    
    // Progresso a cada 100
    if (processadas % 100 === 0) {
      const tempo = ((Date.now() - inicio) / 1000).toFixed(1)
      const porSegundo = (processadas / parseFloat(tempo)).toFixed(1)
      const restante = ((urls.length - processadas) / parseFloat(porSegundo) / 60).toFixed(1)
      console.log(`\n📈 ${processadas}/${urls.length} (${porSegundo}/s) - Restam ~${restante} min`)
    }
    
    // Salvar parcial a cada 500
    if (processadas % 500 === 0) {
      fs.writeFileSync(ARQUIVO_404, urls404.join('\n'))
      fs.writeFileSync(ARQUIVO_OK, urlsOk.join('\n'))
    }
  }
  
  // Salvar resultados finais
  fs.writeFileSync(ARQUIVO_404, urls404.join('\n'))
  fs.writeFileSync(ARQUIVO_OK, urlsOk.join('\n'))
  
  const tempoTotal = ((Date.now() - inicio) / 1000 / 60).toFixed(1)
  
  console.log(`\n\n========================================`)
  console.log(`🎉 VERIFICAÇÃO COMPLETA!`)
  console.log(`========================================`)
  console.log(`⏱️  Tempo total: ${tempoTotal} minutos`)
  console.log(`✅ URLs OK (200): ${urlsOk.length}`)
  console.log(`❌ URLs 404: ${urls404.length}`)
  console.log(`➡️  Redirects: ${urlsRedirect.length}`)
  console.log(`⚠️  Erros: ${urlsErro.length}`)
  console.log(`========================================`)
  console.log(`\n📁 Arquivos salvos:`)
  console.log(`   ${ARQUIVO_404}`)
  console.log(`   ${ARQUIVO_OK}`)
}

main().catch(console.error)
