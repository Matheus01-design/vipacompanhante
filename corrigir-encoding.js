/**
 * SCRIPT DE CORREÇÃO DE ENCODING - VIP ACOMPANHANTE
 * 
 * Este script conecta no Supabase, identifica cidades/estados com
 * acentos corrompidos e gera um SQL de correção.
 * 
 * COMO USAR:
 * 1. Salve este arquivo na pasta do projeto
 * 2. Rode: node corrigir-encoding.js
 * 3. Copie o SQL gerado e rode no Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração - ajuste se necessário
const SUPABASE_URL = 'https://vwmnqoszfwhzpqmjrhcl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bW5xb3N6ZndoenBxbWpyaGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODE0NjEsImV4cCI6MjA2MDE1NzQ2MX0.qlXuTssCHRy1BqfrjNOHv2ngpPmFIwXlg_58H1p_gUU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// DICIONÁRIO DE CORREÇÕES
// Mapeia strings corrompidas -> strings corretas
// ============================================

const CORRECOES_CIDADES = {
  // Alagoas
  'Macei': 'Maceió',
  'Barra de So Miguel': 'Barra de São Miguel',
  'Olho d\'gua das Flores': 'Olho d\'Água das Flores',
  'Palmeira dos ndios': 'Palmeira dos Índios',
  
  // Amazonas
  'Amatur': 'Amaturá',
  'Eirunep': 'Eirunepé',
  'Humait': 'Humaitá',
  'Lbrea': 'Lábrea',
  'Manicor': 'Manicoré',
  'Maus': 'Maués',
  'Novo Aripuan': 'Novo Aripuanã',
  'Santo Antnio do I': 'Santo Antônio do Içá',
  'So Paulo de Olivena': 'São Paulo de Olivença',
  
  // Amapá
  'Macap': 'Macapá',
  
  // Bahia
  'Vitria da Conquista': 'Vitória da Conquista',
  'Feira de Santana': 'Feira de Santana', // já correto
  
  // Ceará
  'Alcntaras': 'Alcântaras',
  'Ararend': 'Ararendá',
  
  // Maranhão
  'So Lus': 'São Luís',
  'So Luis': 'São Luís',
  'Caxias': 'Caxias',
  'Imperatriz': 'Imperatriz',
  
  // Mato Grosso
  'Cuiab': 'Cuiabá',
  'Vrzea Grande': 'Várzea Grande',
  'Trs Lagoas': 'Três Lagoas',
  'Vrzea': 'Várzea',
  
  // Mato Grosso do Sul
  'Corumb': 'Corumbá',
  'Ponta Por': 'Ponta Porã',
  'Ladrio': 'Ladário',
  'Anglica': 'Angélica',
  
  // Minas Gerais
  'Belo Horizonte': 'Belo Horizonte',
  'Uberlndia': 'Uberlândia',
  'Juiz de Fora': 'Juiz de Fora',
  'Governador Valadares': 'Governador Valadares',
  'Ipatinga': 'Ipatinga',
  
  // Pará
  'Belm': 'Belém',
  'Santarm': 'Santarém',
  'Marab': 'Marabá',
  
  // Paraíba
  'Joo Pessoa': 'João Pessoa',
  'Campina Grande': 'Campina Grande',
  
  // Paraná
  'Curitiba': 'Curitiba',
  'Londrina': 'Londrina',
  'Maring': 'Maringá',
  'Foz do Igua': 'Foz do Iguaçu',
  'Foz do Iguau': 'Foz do Iguaçu',
  'So Jos dos Pinhais': 'São José dos Pinhais',
  
  // Pernambuco
  'Recife': 'Recife',
  'Olinda': 'Olinda',
  'Jaboato dos Guararapes': 'Jaboatão dos Guararapes',
  'Caruaru': 'Caruaru',
  'Petrolina': 'Petrolina',
  
  // Piauí
  'Teresina': 'Teresina',
  'Parnaba': 'Parnaíba',
  
  // Rio de Janeiro
  'Rio de Janeiro': 'Rio de Janeiro',
  'Niteri': 'Niterói',
  'So Gonalo': 'São Gonçalo',
  'So Goncalo': 'São Gonçalo',
  'Duque de Caxias': 'Duque de Caxias',
  'Nova Igua': 'Nova Iguaçu',
  'Nova Iguau': 'Nova Iguaçu',
  'So Joo de Meriti': 'São João de Meriti',
  'Campos dos Goytacazes': 'Campos dos Goytacazes',
  'Petrpolis': 'Petrópolis',
  'Volta Redonda': 'Volta Redonda',
  'Mag': 'Magé',
  'Itabora': 'Itaboraí',
  'Maca': 'Macaé',
  'Cabo Frio': 'Cabo Frio',
  'Angra dos Reis': 'Angra dos Reis',
  'Barra Mansa': 'Barra Mansa',
  'Barra do Pira': 'Barra do Pirai',
  'Belford Roxo': 'Belford Roxo',
  'Mesquita': 'Mesquita',
  'Nilpolis': 'Nilópolis',
  'Queimados': 'Queimados',
  'Itagua': 'Itaguaí',
  'Seropdica': 'Seropédica',
  'Paracambi': 'Paracambi',
  'Japeri': 'Japeri',
  'Guapimirim': 'Guapimirim',
  'Tangu': 'Tanguá',
  'Rio Bonito': 'Rio Bonito',
  'Silva Jardim': 'Silva Jardim',
  'Cachoeiras de Macacu': 'Cachoeiras de Macacu',
  'Casimiro de Abreu': 'Casimiro de Abreu',
  'Araruama': 'Araruama',
  'Saquarema': 'Saquarema',
  'Maric': 'Maricá',
  'Itaipava': 'Itaipava',
  
  // Rio Grande do Norte
  'Natal': 'Natal',
  'Mossor': 'Mossoró',
  'Parnamirim': 'Parnamirim',
  
  // Rio Grande do Sul
  'Porto Alegre': 'Porto Alegre',
  'Caxias do Sul': 'Caxias do Sul',
  'Pelotas': 'Pelotas',
  'Canoas': 'Canoas',
  'Santa Maria': 'Santa Maria',
  'Gravata': 'Gravataí',
  'Viamo': 'Viamão',
  'Novo Hamburgo': 'Novo Hamburgo',
  'So Leopoldo': 'São Leopoldo',
  'Bento Gonalves': 'Bento Gonçalves',
  'Araric': 'Araricá',
  'Arambar': 'Arambaré',
  
  // Rondônia
  'Porto Velho': 'Porto Velho',
  'Ji-Paran': 'Ji-Paraná',
  
  // Roraima
  'Boa Vista': 'Boa Vista',
  
  // Santa Catarina
  'Florianpolis': 'Florianópolis',
  'Joinville': 'Joinville',
  'Blumenau': 'Blumenau',
  'So Jos': 'São José',
  'Chapec': 'Chapecó',
  'Itaja': 'Itajaí',
  'Lages': 'Lages',
  'Jaragu do Sul': 'Jaraguá do Sul',
  'Palhoa': 'Palhoça',
  'Balnerio Cambori': 'Balneário Camboriú',
  
  // São Paulo
  'So Paulo': 'São Paulo',
  'Guarulhos': 'Guarulhos',
  'Campinas': 'Campinas',
  'So Bernardo do Campo': 'São Bernardo do Campo',
  'So Jos dos Campos': 'São José dos Campos',
  'Santo Andr': 'Santo André',
  'Osasco': 'Osasco',
  'Ribeiro Preto': 'Ribeirão Preto',
  'Sorocaba': 'Sorocaba',
  'Mau': 'Mauá',
  'So Jos do Rio Preto': 'São José do Rio Preto',
  'Santos': 'Santos',
  'Mogi das Cruzes': 'Mogi das Cruzes',
  'Diadema': 'Diadema',
  'Jundia': 'Jundiaí',
  'Piracicaba': 'Piracicaba',
  'Carapicuba': 'Carapicuíba',
  'Bauru': 'Bauru',
  'Itaquaquecetuba': 'Itaquaquecetuba',
  'So Vicente': 'São Vicente',
  'Franca': 'Franca',
  'Praia Grande': 'Praia Grande',
  'Guaruj': 'Guarujá',
  'Taubat': 'Taubaté',
  'Limeira': 'Limeira',
  'Suzano': 'Suzano',
  'Taboo da Serra': 'Taboão da Serra',
  'Sumar': 'Sumaré',
  'Embu das Artes': 'Embu das Artes',
  'Barueri': 'Barueri',
  'Cotia': 'Cotia',
  'Indaiatuba': 'Indaiatuba',
  'Po': 'Poá',
  'Americana': 'Americana',
  'Marlia': 'Marília',
  'Presidente Prudente': 'Presidente Prudente',
  'Itapetininga': 'Itapetininga',
  'Araraquara': 'Araraquara',
  'Jacare': 'Jacareí',
  'Hortolndia': 'Hortolândia',
  'Rio Claro': 'Rio Claro',
  'Araatuba': 'Araçatuba',
  'Ferraz de Vasconcelos': 'Ferraz de Vasconcelos',
  'Santa Brbara d\'Oeste': 'Santa Bárbara d\'Oeste',
  'Francisco Morato': 'Francisco Morato',
  'Itapecerica da Serra': 'Itapecerica da Serra',
  'Pindamonhangaba': 'Pindamonhangaba',
  'Itu': 'Itu',
  'Bragana Paulista': 'Bragança Paulista',
  'Mogi Gua': 'Mogi Guaçu',
  'Atibaia': 'Atibaia',
  'Cubato': 'Cubatão',
  'Vrzea Paulista': 'Várzea Paulista',
  'Jandira': 'Jandira',
  'Cajamar': 'Cajamar',
  'Franco da Rocha': 'Franco da Rocha',
  'Santana de Parnaba': 'Santana de Parnaíba',
  'Mogi Mirim': 'Mogi Mirim',
  'Ja': 'Jaú',
  'Boituva': 'Boituva',
  'Votorantim': 'Votorantim',
  'Salto': 'Salto',
  'So Caetano do Sul': 'São Caetano do Sul',
  'Itatiba': 'Itatiba',
  'Assis': 'Assis',
  
  // Sergipe  
  'Aracaju': 'Aracaju',
  'Nossa Senhora do Socorro': 'Nossa Senhora do Socorro',
  
  // Tocantins
  'Palmas': 'Palmas',
  'Araguana': 'Araguaína',
  'Gurupi': 'Gurupi',

  // Distrito Federal
  'Braslia': 'Brasília',
  'Brasilia': 'Brasília',
  
  // Goiás
  'Goinia': 'Goiânia',
  'Goiania': 'Goiânia',
  'Aparecida de Goinia': 'Aparecida de Goiânia',
  'Anpolis': 'Anápolis',
};

// Correções de bairros comuns
const CORRECOES_BAIRROS = {
  'Centro': 'Centro',
  'Boa Viagem': 'Boa Viagem',
  'Copacabana': 'Copacabana',
  'Ipanema': 'Ipanema',
  'Leblon': 'Leblon',
  'Botafogo': 'Botafogo',
  'Tijuca': 'Tijuca',
  'Barra da Tijuca': 'Barra da Tijuca',
  'Recreio dos Bandeirantes': 'Recreio dos Bandeirantes',
  'Jacarepagu': 'Jacarepaguá',
  'Mier': 'Méier',
  'Madureira': 'Madureira',
  'Bangu': 'Bangu',
  'Campo Grande': 'Campo Grande',
  'Santa Cruz': 'Santa Cruz',
  'Realengo': 'Realengo',
  'Iraj': 'Irajá',
  'Penha': 'Penha',
  'Olaria': 'Olaria',
  'Ramos': 'Ramos',
  'Bonsucesso': 'Bonsucesso',
  'Ilha do Governador': 'Ilha do Governador',
  'So Cristvo': 'São Cristóvão',
  'Estcio': 'Estácio',
  'Lapa': 'Lapa',
  'Glria': 'Glória',
  'Catete': 'Catete',
  'Flamengo': 'Flamengo',
  'Laranjeiras': 'Laranjeiras',
  'Cosme Velho': 'Cosme Velho',
  'Santa Teresa': 'Santa Teresa',
  'Graja': 'Grajaú',
  'Vila Isabel': 'Vila Isabel',
  'Andara': 'Andaraí',
  'Maracan': 'Maracanã',
  'So Francisco Xavier': 'São Francisco Xavier',
  'Rocha': 'Rocha',
  'Riachuelo': 'Riachuelo',
  'Sampaio': 'Sampaio',
  'Engenho Novo': 'Engenho Novo',
  'Lins de Vasconcelos': 'Lins de Vasconcelos',
  'Engenho de Dentro': 'Engenho de Dentro',
  'Piedade': 'Piedade',
  'Encantado': 'Encantado',
  'gua Santa': 'Água Santa',
  'Abolio': 'Abolição',
  'Praa Seca': 'Praça Seca',
  'Tanque': 'Tanque',
  'Taquara': 'Taquara',
  'Curicica': 'Curicica',
  'Freguesia': 'Freguesia',
  'Pechincha': 'Pechincha',
  'Anil': 'Anil',
  'Gardnia Azul': 'Gardênia Azul',
  'Cidade de Deus': 'Cidade de Deus',
  'Vargem Pequena': 'Vargem Pequena',
  'Vargem Grande': 'Vargem Grande',
  'Camorim': 'Camorim',
  'Grumari': 'Grumari',
  'Itanhang': 'Itanhangá',
  'So Conrado': 'São Conrado',
  'Vidigal': 'Vidigal',
  'Rocinha': 'Rocinha',
  'Gvea': 'Gávea',
  'Jardim Botnico': 'Jardim Botânico',
  'Lagoa': 'Lagoa',
  'Humait': 'Humaitá',
  'Urca': 'Urca',
  'Leme': 'Leme',
};

// Correções de estados (siglas com bairro)
const ESTADOS_VALIDOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🔍 Conectando ao Supabase...\n');

  // Buscar registros únicos
  const { data: registros, error } = await supabase
    .from('acompanhantes')
    .select('id, estado, cidade, bairro')
    .eq('status', 'ativo');

  if (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    return;
  }

  console.log(`📊 Total de registros ativos: ${registros.length}\n`);

  const sqlStatements = [];
  const errosEncontrados = {
    estados: new Map(),
    cidades: new Map(),
    bairros: new Map()
  };

  // Analisar registros
  for (const reg of registros) {
    // Verificar estado
    if (reg.estado && reg.estado.length > 2) {
      errosEncontrados.estados.set(reg.estado, (errosEncontrados.estados.get(reg.estado) || 0) + 1);
    }

    // Verificar cidade
    if (reg.cidade && CORRECOES_CIDADES[reg.cidade]) {
      const corrigido = CORRECOES_CIDADES[reg.cidade];
      if (corrigido !== reg.cidade) {
        errosEncontrados.cidades.set(reg.cidade, { corrigido, count: (errosEncontrados.cidades.get(reg.cidade)?.count || 0) + 1 });
      }
    }

    // Verificar bairro
    if (reg.bairro && CORRECOES_BAIRROS[reg.bairro]) {
      const corrigido = CORRECOES_BAIRROS[reg.bairro];
      if (corrigido !== reg.bairro) {
        errosEncontrados.bairros.set(reg.bairro, { corrigido, count: (errosEncontrados.bairros.get(reg.bairro)?.count || 0) + 1 });
      }
    }
  }

  // Gerar SQL de correção para cidades
  console.log('📝 CIDADES COM PROBLEMAS DE ENCODING:\n');
  console.log('-- ============================================');
  console.log('-- SQL DE CORREÇÃO DE CIDADES');
  console.log('-- ============================================\n');

  for (const [errado, { corrigido, count }] of errosEncontrados.cidades) {
    const sql = `UPDATE acompanhantes SET cidade = '${corrigido.replace(/'/g, "''")}' WHERE cidade = '${errado.replace(/'/g, "''")}';`;
    console.log(`-- ${errado} → ${corrigido} (${count} registros)`);
    console.log(sql);
    console.log('');
  }

  // Gerar SQL para bairros
  console.log('\n-- ============================================');
  console.log('-- SQL DE CORREÇÃO DE BAIRROS');
  console.log('-- ============================================\n');

  for (const [errado, { corrigido, count }] of errosEncontrados.bairros) {
    const sql = `UPDATE acompanhantes SET bairro = '${corrigido.replace(/'/g, "''")}' WHERE bairro = '${errado.replace(/'/g, "''")}';`;
    console.log(`-- ${errado} → ${corrigido} (${count} registros)`);
    console.log(sql);
    console.log('');
  }

  // Mostrar estados problemáticos
  if (errosEncontrados.estados.size > 0) {
    console.log('\n-- ============================================');
    console.log('-- ⚠️  ESTADOS COM BAIRRO NO LUGAR (precisa correção manual)');
    console.log('-- ============================================\n');
    
    for (const [estado, count] of errosEncontrados.estados) {
      console.log(`-- "${estado}" aparece ${count} vezes no campo estado`);
    }
    
    console.log('\n-- Para corrigir, você precisa identificar qual é o estado correto.');
    console.log('-- Rode esta query para ver os detalhes:');
    console.log('-- SELECT id, estado, cidade, bairro FROM acompanhantes WHERE LENGTH(estado) > 2 LIMIT 100;');
  }

  // Buscar cidades que não estão no dicionário mas parecem ter encoding errado
  console.log('\n\n-- ============================================');
  console.log('-- CIDADES NÃO RECONHECIDAS (verificar manualmente)');
  console.log('-- ============================================\n');

  const cidadesUnicas = new Set();
  for (const reg of registros) {
    if (reg.cidade) cidadesUnicas.add(reg.cidade);
  }

  const cidadesNaoReconhecidas = [];
  for (const cidade of cidadesUnicas) {
    // Detectar se tem caractere faltando (padrão de encoding quebrado)
    if (!CORRECOES_CIDADES[cidade]) {
      // Padrões comuns de encoding quebrado
      const patterns = [
        /[A-Z][a-z]*[A-Z]/, // Letra maiúscula no meio (SoGonalo)
        /^[A-Z][a-z]+$/, // Muito curto pode indicar acento faltando
        /[bcdfghjklmnpqrstvwxz]{3,}/i, // 3+ consoantes seguidas (Trs)
      ];
      
      const pareceQuebrado = cidade.length < 4 || 
        cidade.includes('  ') || 
        /[A-Z]{2,}/.test(cidade.slice(1)) ||
        cidade.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) === null && cidade.includes(' ');
      
      if (cidade.length <= 5 || cidade.match(/[bcdfghjklmnpqrstvwxyz]{3}/i)) {
        cidadesNaoReconhecidas.push(cidade);
      }
    }
  }

  if (cidadesNaoReconhecidas.length > 0) {
    console.log('-- Essas cidades podem ter problemas de encoding:');
    cidadesNaoReconhecidas.slice(0, 50).forEach(c => {
      console.log(`-- "${c}"`);
    });
  }

  console.log('\n\n✅ Script finalizado!');
  console.log('📋 Copie os comandos UPDATE acima e rode no Supabase SQL Editor.');
}

main().catch(console.error);
