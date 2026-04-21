// preencher-dados.js
// Roda com: node preencher-dados.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Credenciais não encontradas no .env.local')
  console.log('Verifique se existe NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const BATCH_SIZE = 100
const DELAY_MS = 500

// Arrays de valores aleatórios
const ETNIAS = ['Branca', 'Morena', 'Negra', 'Mulata', 'Asiática', 'Latina']
const CABELOS = ['Loira', 'Morena', 'Ruiva', 'Castanho', 'Preto', 'Colorido']
const OLHOS = ['Castanhos', 'Pretos', 'Verdes', 'Azuis', 'Mel']
const CORPOS = ['Magra', 'Slim', 'Atlética', 'Curvilínea', 'Normal']
const SEIOS = ['Pequenos', 'Médios', 'Grandes', 'Silicone']
const PUBIS = ['Depilada', 'Aparada', 'Natural']
const HORARIOS_FIM = ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00']
const SOBRE_MIM = [
  ['Carinhosa', 'Companhia perfeita', 'Local próprio'],
  ['Atenciosa', 'Sem frescura', 'Sigilo total'],
  ['Simpática', 'Alto padrão', 'Aceito casados'],
  ['Discreta', 'Boa conversa', 'Ambiente climatizado'],
  ['Educada', 'Viajo a convite', 'Local próprio'],
  ['Sensual', 'Companhia perfeita', 'Sigilo total'],
  ['Elegante', 'Alto padrão', 'Aceito casados']
]
const SERVICOS = [
  ['Oral', 'Beijo na boca', 'Massagem'],
  ['Oral', 'Fantasias', 'Striptease'],
  ['Beijo na boca', 'Massagem', 'Dupla'],
  ['Oral', 'Dominação', 'Fetiche'],
  ['Massagem', 'Fantasias', 'Acessórios']
]
const LOCAIS = [
  ['Com local', 'Motéis'],
  ['Hotéis', 'Residências'],
  ['Com local', 'Viagens'],
  ['Motéis', 'A combinar'],
  ['Com local', 'Hotéis', 'Eventos']
]

const DDDS = {
  'SP': ['11', '12', '13', '14', '15', '16', '17', '18', '19'],
  'RJ': ['21', '22', '24'],
  'MG': ['31', '32', '33', '34', '35', '37', '38'],
  'BA': ['71', '73', '74', '75', '77'],
  'RS': ['51', '53', '54', '55'],
  'PR': ['41', '42', '43', '44', '45', '46'],
  'SC': ['47', '48', '49'],
  'PE': ['81', '87'],
  'CE': ['85', '88'],
  'GO': ['62', '64'],
  'DF': ['61'],
  'PA': ['91', '93', '94'],
  'MA': ['98', '99'],
  'ES': ['27', '28'],
  'PB': ['83'],
  'RN': ['84'],
  'AL': ['82'],
  'SE': ['79'],
  'PI': ['86', '89'],
  'MT': ['65', '66'],
  'MS': ['67'],
  'AM': ['92', '97'],
  'RO': ['69'],
  'AC': ['68'],
  'AP': ['96'],
  'RR': ['95'],
  'TO': ['63']
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function roundTo(num, step) {
  return Math.round(num / step) * step
}

function gerarWhatsApp(estado) {
  const ddds = DDDS[estado] || ['11']
  const ddd = random(ddds)
  const numero = '9' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
  return ddd + numero
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function preencherDados() {
  console.log('🚀 Iniciando preenchimento de dados...\n')
  console.log('📡 Conectando ao Supabase...')
  
  // Buscar todos os IDs e estados
  const { data: perfis, error } = await supabase
    .from('acompanhantes')
    .select('id, estado, altura, peso, etnia, cabelo, olhos, corpo, seios, pubis, valor_hora, valor_meia_hora, valor_pernoite, valor_viagem, horario_inicio, horario_fim, whatsapp, telefone, sobre_mim, servicos, locais, pagamentos, idiomas')
    .eq('status', 'ativo')
  
  if (error) {
    console.error('❌ Erro ao buscar perfis:', error.message)
    return
  }
  
  console.log(`✅ Conectado!`)
  console.log(`📊 Total de perfis ativos: ${perfis.length}\n`)
  
  let atualizados = 0
  let erros = 0
  
  for (let i = 0; i < perfis.length; i += BATCH_SIZE) {
    const batch = perfis.slice(i, i + BATCH_SIZE)
    
    for (const perfil of batch) {
      const updates = {}
      
      // Aparência
      if (!perfil.altura) updates.altura = (1.55 + Math.random() * 0.25).toFixed(2)
      if (!perfil.peso) updates.peso = String(randomBetween(50, 75))
      if (!perfil.etnia) updates.etnia = random(ETNIAS)
      if (!perfil.cabelo) updates.cabelo = random(CABELOS)
      if (!perfil.olhos) updates.olhos = random(OLHOS)
      if (!perfil.corpo) updates.corpo = random(CORPOS)
      if (!perfil.seios) updates.seios = random(SEIOS)
      if (!perfil.pubis) updates.pubis = random(PUBIS)
      
      // Preços
      if (!perfil.valor_hora) updates.valor_hora = String(roundTo(randomBetween(150, 500), 50))
      if (!perfil.valor_meia_hora) updates.valor_meia_hora = String(roundTo(randomBetween(80, 300), 50))
      if (!perfil.valor_pernoite) updates.valor_pernoite = String(roundTo(randomBetween(800, 2000), 100))
      if (!perfil.valor_viagem) updates.valor_viagem = String(roundTo(randomBetween(1500, 4000), 500))
      
      // Horários
      if (!perfil.horario_inicio) updates.horario_inicio = String(randomBetween(8, 14)).padStart(2, '0') + ':00'
      if (!perfil.horario_fim) updates.horario_fim = random(HORARIOS_FIM)
      
      // WhatsApp
      if (!perfil.whatsapp || perfil.whatsapp.length < 10) {
        updates.whatsapp = gerarWhatsApp(perfil.estado)
      }
      if (!perfil.telefone && (updates.whatsapp || perfil.whatsapp)) {
        updates.telefone = updates.whatsapp || perfil.whatsapp
      }
      
      // Arrays
      if (!perfil.sobre_mim || perfil.sobre_mim.length === 0) updates.sobre_mim = random(SOBRE_MIM)
      if (!perfil.servicos || perfil.servicos.length === 0) updates.servicos = random(SERVICOS)
      if (!perfil.locais || perfil.locais.length === 0) updates.locais = random(LOCAIS)
      if (!perfil.pagamentos || perfil.pagamentos.length === 0) updates.pagamentos = ['Dinheiro', 'PIX']
      if (!perfil.idiomas || perfil.idiomas.length === 0) updates.idiomas = ['Português']
      
      // Se tem algo pra atualizar
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('acompanhantes')
          .update(updates)
          .eq('id', perfil.id)
        
        if (updateError) {
          erros++
        } else {
          atualizados++
        }
      }
    }
    
    const progresso = Math.min(100, Math.round(((i + batch.length) / perfis.length) * 100))
    process.stdout.write(`\r⏳ Progresso: ${progresso}% | Atualizados: ${atualizados} | Erros: ${erros}`)
    
    await sleep(DELAY_MS)
  }
  
  console.log('\n\n✅ Concluído!')
  console.log(`📈 Total atualizado: ${atualizados}`)
  console.log(`❌ Erros: ${erros}`)
}

preencherDados()
