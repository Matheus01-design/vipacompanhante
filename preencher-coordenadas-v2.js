/**
 * SCRIPT DE GEOLOCALIZAÇÃO - VIP ACOMPANHANTE
 * 
 * Preenche latitude/longitude das cidades usando API gratuita do OpenStreetMap
 * 
 * COMO USAR:
 * 1. Salve este arquivo na pasta do projeto: site/preencher-coordenadas.js
 * 2. Instale dotenv: npm install dotenv
 * 3. Rode: node preencher-coordenadas.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase (lê do .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas no .env.local');
  process.exit(1);
}

console.log('🔑 Supabase URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cache de coordenadas para evitar requests duplicados
const cacheCoords = new Map();

// Função para buscar coordenadas via Nominatim (OpenStreetMap)
async function buscarCoordenadas(cidade, estado) {
  const cacheKey = `${cidade}-${estado}`;
  
  // Verificar cache
  if (cacheCoords.has(cacheKey)) {
    return cacheCoords.get(cacheKey);
  }
  
  try {
    // Montar query de busca
    const query = `${cidade}, ${estado}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VipAcompanhante/1.0 (contato@vipacompanhante.com)'
      }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
      cacheCoords.set(cacheKey, coords);
      return coords;
    }
    
    // Se não encontrou com estado, tentar só cidade
    const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cidade + ', Brasil')}&limit=1&countrycodes=br`;
    
    const response2 = await fetch(url2, {
      headers: {
        'User-Agent': 'VipAcompanhante/1.0 (contato@vipacompanhante.com)'
      }
    });
    
    const data2 = await response2.json();
    
    if (data2 && data2.length > 0) {
      const coords = {
        latitude: parseFloat(data2[0].lat),
        longitude: parseFloat(data2[0].lon)
      };
      cacheCoords.set(cacheKey, coords);
      return coords;
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao buscar ${cidade}: ${error.message}`);
    return null;
  }
}

// Função para aguardar (respeitar limite da API)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal
async function main() {
  console.log('🌍 Iniciando preenchimento de coordenadas...\n');
  
  // Testar conexão
  const { data: teste, error: testeError } = await supabase
    .from('acompanhantes')
    .select('id')
    .limit(1);
  
  if (testeError) {
    console.error('❌ Erro ao conectar no Supabase:', testeError.message);
    return;
  }
  
  console.log('✅ Conexão com Supabase OK!\n');
  
  // Buscar cidades únicas que precisam de coordenadas
  const { data: cidades, error } = await supabase
    .from('acompanhantes')
    .select('cidade, estado')
    .eq('status', 'ativo')
    .is('latitude', null)
    .limit(1000);
  
  if (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    return;
  }
  
  // Criar lista de cidades únicas
  const cidadesUnicas = new Map();
  for (const row of cidades) {
    if (row.cidade && row.estado && row.estado.length === 2) {
      const key = `${row.cidade}-${row.estado}`;
      if (!cidadesUnicas.has(key)) {
        cidadesUnicas.set(key, { cidade: row.cidade, estado: row.estado });
      }
    }
  }
  
  console.log(`📊 ${cidadesUnicas.size} cidades únicas para processar\n`);
  
  if (cidadesUnicas.size === 0) {
    console.log('✅ Todas as cidades já têm coordenadas!');
    return;
  }
  
  let processadas = 0;
  let sucesso = 0;
  let falha = 0;
  
  for (const [key, { cidade, estado }] of cidadesUnicas) {
    processadas++;
    
    // Buscar coordenadas
    const coords = await buscarCoordenadas(cidade, estado);
    
    if (coords) {
      // Atualizar todos os registros dessa cidade
      const { error: updateError } = await supabase
        .from('acompanhantes')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude
        })
        .eq('cidade', cidade)
        .eq('estado', estado)
        .is('latitude', null);
      
      if (updateError) {
        console.log(`❌ [${processadas}/${cidadesUnicas.size}] ${cidade}/${estado} - Erro ao atualizar`);
        falha++;
      } else {
        console.log(`✅ [${processadas}/${cidadesUnicas.size}] ${cidade}/${estado} → ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        sucesso++;
      }
    } else {
      console.log(`⚠️ [${processadas}/${cidadesUnicas.size}] ${cidade}/${estado} - Não encontrado`);
      falha++;
    }
    
    // Aguardar 1.1 segundos entre requests (limite da API)
    await sleep(1100);
  }
  
  console.log('\n========================================');
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Falha: ${falha}`);
  console.log(`📊 Total: ${processadas}`);
  console.log('========================================');
  
  // Verificar quantos ainda faltam
  const { count } = await supabase
    .from('acompanhantes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo')
    .is('latitude', null);
  
  if (count > 0) {
    console.log(`\n⚠️ Ainda faltam ${count} registros. Rode o script novamente.`);
  } else {
    console.log('\n🎉 Todos os registros foram preenchidos!');
  }
}

main().catch(console.error);
