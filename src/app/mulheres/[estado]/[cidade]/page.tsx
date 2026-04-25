import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, Camera, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ESTADOS_BR } from '@/types'

const COR = '#8B0000'
const SEXO = 'mulher'
const TIPO = 'Mulheres Acompanhantes'
const ROTA = 'mulheres'

// Informações turísticas por estado
const TURISMO_ESTADO: Record<string, { atracoes: string; gastronomia: string; cultura: string }> = {
  'AC': {
    atracoes: 'Rio Branco oferece o Palácio Rio Branco, Parque da Maternidade e a Gameleira. O Acre é porta de entrada para a Floresta Amazônica, com trilhas ecológicas e turismo de aventura.',
    gastronomia: 'Experimente o tacacá, pato no tucupi e a tradicional castanha-do-pará. A culinária acreana mistura influências indígenas e nordestinas.',
    cultura: 'Conheça a história de Chico Mendes e o movimento seringueiro. O Festival Amazônico de Dança acontece anualmente em Rio Branco.'
  },
  'AL': {
    atracoes: 'Maceió encanta com praias de águas cristalinas como Pajuçara, Ponta Verde e as piscinas naturais de Maragogi. Visite também o centro histórico de Penedo e a Foz do Rio São Francisco.',
    gastronomia: 'Prove o sururu, marisco típico das lagoas alagoanas, a tapioca recheada e os frutos do mar frescos nos restaurantes à beira-mar.',
    cultura: 'O folclore alagoano é rico em tradições como o Guerreiro, Reisado e Coco de Roda. Maceió possui museus e o Teatro Deodoro como pontos culturais.'
  },
  'AP': {
    atracoes: 'Macapá é a única capital cortada pela Linha do Equador. Visite a Fortaleza de São José, o Marco Zero e as praias fluviais do Rio Amazonas.',
    gastronomia: 'A culinária amapaense destaca o camarão regional, açaí com peixe frito e o tucunaré preparado de diversas formas.',
    cultura: 'O Marabaixo é a manifestação cultural mais tradicional, com danças e músicas que celebram a herança africana do estado.'
  },
  'AM': {
    atracoes: 'Manaus é a porta da Amazônia. Visite o Teatro Amazonas, o Encontro das Águas, e faça passeios de barco pelos igarapés. O Arquipélago de Anavilhanas é imperdível.',
    gastronomia: 'Experimente o pirarucu de casaca, tambaqui assado, tacacá e o x-caboquinho. Os peixes amazônicos são frescos e saborosos.',
    cultura: 'O Festival de Parintins é uma das maiores festas populares do Brasil. O Boi Garantido e Caprichoso atraem turistas do mundo todo em junho.'
  },
  'BA': {
    atracoes: 'Salvador tem o Pelourinho, Farol da Barra e praias urbanas. Explore a Chapada Diamantina, Morro de São Paulo, Praia do Forte e o sul da Bahia com Porto Seguro e Trancoso.',
    gastronomia: 'A Bahia é berço do acarajé, vatapá, moqueca baiana e caruru. Não deixe de provar a cocada e o abará no Mercado Modelo.',
    cultura: 'O Carnaval de Salvador é o maior do mundo. A capoeira, candomblé e o axé music fazem parte da identidade cultural baiana.'
  },
  'CE': {
    atracoes: 'Fortaleza oferece a Praia do Futuro, Beira Mar e o Centro Dragão do Mar. Jericoacoara é um paraíso com dunas e lagoas. Canoa Quebrada e a Serra de Guaramiranga completam o roteiro.',
    gastronomia: 'Caranguejo na praia é tradição em Fortaleza. Prove também a carne de sol, baião de dois e a tapioca com manteiga de garrafa.',
    cultura: 'O humor cearense é famoso no Brasil. Fortaleza tem uma cena cultural vibrante com teatro, forró e artesanato em rendas e bordados.'
  },
  'DF': {
    atracoes: 'Brasília é Patrimônio da Humanidade com arquitetura de Niemeyer. Visite a Catedral, Congresso Nacional, Ponte JK e o Lago Paranoá. A Chapada dos Veadeiros fica a 230km.',
    gastronomia: 'Por ser cosmopolita, Brasília oferece culinária de todo o Brasil. Restaurantes de alta gastronomia e feiras como a da Torre de TV são destaques.',
    cultura: 'A capital tem intensa vida cultural com museus, teatros e eventos. O CCBB Brasília é um dos centros culturais mais visitados do país.'
  },
  'ES': {
    atracoes: 'Vitória tem praias urbanas, a Pedra da Cebola e Convento da Penha. Guarapari é famosa pelas areias monazíticas. Domingos Martins oferece clima serrano e colonização italiana.',
    gastronomia: 'A moqueca capixaba é diferente da baiana - feita sem dendê e com urucum. A torta capixaba é tradicional na Semana Santa.',
    cultura: 'O Congo é ritmo tradicional do Espírito Santo. Festas de São Benedito e fincada do mastro preservam tradições centenárias.'
  },
  'GO': {
    atracoes: 'Goiânia tem parques e vida noturna agitada. A Chapada dos Veadeiros oferece cachoeiras e trilhas. Caldas Novas e Rio Quente têm as maiores fontes termais do mundo.',
    gastronomia: 'O pequi é rei na culinária goiana. Prove o arroz com pequi, empadão goiano, pamonha e a galinhada com guariroba.',
    cultura: 'A Procissão do Fogaréu em Goiás Velho é Patrimônio Imaterial. Pirenópolis preserva arquitetura colonial e realiza as Cavalhadas.'
  },
  'MA': {
    atracoes: 'São Luís tem o maior conjunto de azulejos portugueses das Américas. Os Lençóis Maranhenses são únicos no mundo. Visite também Alcântara, cidade histórica acessível por barco.',
    gastronomia: 'O arroz de cuxá é prato típico feito com vinagreira. Prove também o camarão, caranguejo e a juçara, açaí maranhense.',
    cultura: 'O Bumba meu Boi do Maranhão é Patrimônio da Humanidade. O reggae tomou conta de São Luís, a Jamaica brasileira.'
  },
  'MT': {
    atracoes: 'Cuiabá é quente e acolhedora. O Pantanal mato-grossense oferece safáris para ver onças, jacarés e aves. A Chapada dos Guimarães tem cachoeiras e o mirante mais famoso do Centro-Oeste.',
    gastronomia: 'O pacu assado, mojica de pintado e a farofa de banana são típicos. A culinária pantaneira valoriza peixes de água doce.',
    cultura: 'O Siriri e Cururu são danças tradicionais. O Festival de Pesca e as cavalgadas celebram a cultura do homem pantaneiro.'
  },
  'MS': {
    atracoes: 'Campo Grande é a capital morena. Bonito é referência mundial em ecoturismo com rios cristalinos e flutuação. O Pantanal sul oferece fazendas com observação de fauna.',
    gastronomia: 'O sobá de Campo Grande é herança dos imigrantes japoneses. Prove também a carne de jacaré, pintado e a farofa de couve.',
    cultura: 'A cultura sul-mato-grossense mistura influências gaúchas, paraguaias e indígenas. O Festival América do Sul acontece em Corumbá.'
  },
  'MG': {
    atracoes: 'Belo Horizonte tem a Lagoa da Pampulha e vida noturna famosa. Ouro Preto e cidades históricas guardam o barroco mineiro. A Serra do Cipó e Capitólio oferecem ecoturismo.',
    gastronomia: 'O pão de queijo, tutu de feijão, frango com quiabo e a cachaça artesanal são patrimônios mineiros. A comida de fogão a lenha é tradição.',
    cultura: 'Minas é berço de Aleijadinho e do barroco brasileiro. Os mineiros são conhecidos pela hospitalidade e o hábito de prosear.'
  },
  'PA': {
    atracoes: 'Belém é a porta da Amazônia com o Mercado Ver-o-Peso e mangueiras centenárias. A Ilha de Marajó tem praias e búfalos. Alter do Chão é o Caribe amazônico.',
    gastronomia: 'O tacacá, maniçoba e pato no tucupi são obrigatórios. O açaí paraense é puro, tomado com peixe frito ou farinha.',
    cultura: 'O Círio de Nazaré é a maior procissão católica do Brasil, reunindo milhões de devotos em outubro. O carimbó é ritmo tradicional.'
  },
  'PB': {
    atracoes: 'João Pessoa é a cidade onde o sol nasce primeiro. A Praia de Tambaba tem área naturista. O Cabo Branco marca o ponto mais oriental das Américas.',
    gastronomia: 'A carne de sol com macaxeira é tradição. Prove também a panelada, rubacão e os frutos do mar frescos na orla.',
    cultura: 'O São João de Campina Grande é um dos maiores do Brasil. A cidade é conhecida como Capital do Forró.'
  },
  'PR': {
    atracoes: 'Curitiba é modelo de urbanismo com parques como Tanguá e Jardim Botânico. Foz do Iguaçu tem as Cataratas. A Ilha do Mel e Morretes completam roteiros inesquecíveis.',
    gastronomia: 'O barreado é prato tradicional do litoral. Curitiba tem cena gastronômica diversa com influência italiana, polonesa e ucraniana.',
    cultura: 'A colonização europeia deixou marcas na arquitetura e tradições. O Festival de Teatro de Curitiba é referência nacional.'
  },
  'PE': {
    atracoes: 'Recife e Olinda formam polo histórico e cultural. Porto de Galinhas tem piscinas naturais. Fernando de Noronha é paraíso ecológico com praias preservadas.',
    gastronomia: 'A tapioca, bolo de rolo e cartola são doces famosos. O sarapatel, chambaril e galinha de cabidela são pratos típicos.',
    cultura: 'O frevo e maracatu são Patrimônio Imaterial. O Carnaval de Olinda com bonecos gigantes é único no mundo.'
  },
  'PI': {
    atracoes: 'Teresina às margens do Parnaíba oferece encontro dos rios. A Serra da Capivara tem pinturas rupestres mais antigas das Américas. Delta do Parnaíba é o único delta em mar aberto.',
    gastronomia: 'A cajuína é refrigerante artesanal de caju. Prove a paçoca de carne seca, capote com arroz e maria-isabel.',
    cultura: 'O bumba meu boi piauiense tem características próprias. O artesanato em cerâmica e couro é reconhecido nacionalmente.'
  },
  'RJ': {
    atracoes: 'O Rio de Janeiro tem praias icônicas como Copacabana e Ipanema, Cristo Redentor, Pão de Açúcar e vida noturna agitada. Búzios, Paraty e Ilha Grande completam roteiros inesquecíveis.',
    gastronomia: 'O chope gelado, feijoada e biscoito Globo na praia são tradições cariocas. A cidade tem restaurantes para todos os gostos e bolsos.',
    cultura: 'O Carnaval carioca é o mais famoso do mundo. O samba nasceu nos morros e a Lapa é reduto da boemia e música ao vivo.'
  },
  'RN': {
    atracoes: 'Natal é a cidade do sol com praias como Ponta Negra e o Morro do Careca. Pipa oferece falésias e golfinhos. O maior cajueiro do mundo fica em Pirangi.',
    gastronomia: 'A ginga com tapioca é lanche típico da praia. Camarão, lagosta e caranguejo são fartos e acessíveis no litoral.',
    cultura: 'O Carnatal é o carnaval fora de época mais famoso. As festas juninas e o forró são tradições do interior potiguar.'
  },
  'RS': {
    atracoes: 'Porto Alegre tem o pôr do sol no Guaíba e vida cultural intensa. A Serra Gaúcha oferece Gramado e Bento Gonçalves com vinícolas. O litoral tem praias como Torres.',
    gastronomia: 'O churrasco gaúcho é referência nacional. Prove também o chimarrão, vinho colonial, galeto e a polenta frita.',
    cultura: 'A tradição gaúcha é preservada nos CTGs. A Oktoberfest de Santa Cruz do Sul e a Festa da Uva celebram a colonização.'
  },
  'RO': {
    atracoes: 'Porto Velho foi cenário da construção da Estrada de Ferro Madeira-Mamoré. O Rio Madeira oferece passeios de barco. A Estância Ecológica do Guaporé tem natureza preservada.',
    gastronomia: 'O peixe assado na folha de bananeira é tradição. O tucunaré, tambaqui e caldeirada são destaques da culinária rondoniense.',
    cultura: 'A influência nordestina é forte pela migração dos seringueiros. O Festival Folclórico de Guajará-Mirim é atração regional.'
  },
  'RR': {
    atracoes: 'Boa Vista é a capital mais setentrional do Brasil. O Monte Roraima é um dos tepuis mais famosos do mundo. A Ilha de Maracá e praias do Rio Branco são opções de lazer.',
    gastronomia: 'A damorida é prato indígena com pimentas e peixe. O churrasco e a galinhada são populares na capital.',
    cultura: 'A cultura indígena é presente com diversas etnias. O Festival Folclórico celebra a diversidade cultural do estado.'
  },
  'SC': {
    atracoes: 'Florianópolis tem mais de 40 praias para todos os gostos. Balneário Camboriú é a Dubai brasileira. Blumenau preserva arquitetura alemã e Urubici oferece frio e montanhas.',
    gastronomia: 'As ostras de Florianópolis são as melhores do Brasil. A tainha, sequência de camarão e o café colonial são tradições.',
    cultura: 'A Oktoberfest de Blumenau é a maior fora da Alemanha. A colonização alemã, italiana e açoriana moldou a cultura catarinense.'
  },
  'SP': {
    atracoes: 'São Paulo é a maior metrópole da América Latina com museus, Avenida Paulista e gastronomia mundial. O litoral tem Ubatuba e Ilhabela. Campos do Jordão oferece clima europeu.',
    gastronomia: 'São Paulo é capital gastronômica com cozinhas do mundo todo. O virado à paulista, sanduíche de mortadela e pizza são tradições.',
    cultura: 'Museus como MASP e Pinacoteca são referências. A vida noturna é intensa com shows, bares e casas de espetáculo para todos os gostos.'
  },
  'SE': {
    atracoes: 'Aracaju tem a Orla de Atalaia mais bonita do Nordeste e praias tranquilas. São Cristóvão é Patrimônio da Humanidade. O Cânion do Xingó oferece passeios de catamarã.',
    gastronomia: 'O caranguejo toc-toc é tradição na Passarela do Caranguejo. Prove também a moqueca sergipana e o doce de caju.',
    cultura: 'O Forró Caju anima São João de Aracaju. O artesanato em renda irlandesa de Divina Pastora é reconhecido mundialmente.'
  },
  'TO': {
    atracoes: 'Palmas é a capital mais jovem do Brasil com praias de água doce. O Jalapão tem dunas, fervedouros e cachoeiras. A Ilha do Bananal é a maior ilha fluvial do mundo.',
    gastronomia: 'O peixe na telha e a carne de sol são populares. A culinária tocantinense mistura tradições do Norte e Centro-Oeste.',
    cultura: 'As comunidades quilombolas preservam tradições centenárias. O artesanato em capim dourado é exclusivo do Jalapão.'
  }
}

interface Props {
  params: { estado: string; cidade: string }
  searchParams: { pagina?: string }
}

function formatarCidade(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Schema FAQ para SEO
function gerarSchemaFAQ(perguntas: { pergunta: string; resposta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': perguntas.map(p => ({
      '@type': 'Question',
      'name': p.pergunta,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': p.resposta
      }
    }))
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sigla = params.estado.toUpperCase()
  const estadoNome = ESTADOS_BR[sigla] || sigla
  const cidadeNome = formatarCidade(params.cidade)
  return {
    title: `${TIPO} em ${cidadeNome} - ${sigla}`,
    description: `Encontre ${TIPO.toLowerCase()} em ${cidadeNome} - ${estadoNome}. Perfis verificados com fotos reais e contato direto via WhatsApp.`,
    alternates: { canonical: `https://www.vipacompanhante.com/${ROTA}/${params.estado.toLowerCase()}/${params.cidade}/` },
  }
}

export default async function CidadePage({ params, searchParams }: Props) {
  const sigla = params.estado.toUpperCase()
  const estadoNome = ESTADOS_BR[sigla]
  if (!estadoNome) notFound()

  const pagina = parseInt(searchParams.pagina || '1')
  const porPagina = 24
  const supabase = await createClient()

  const cidadeSlug = params.cidade
  const { data: cidadeData } = await supabase
    .from('acompanhantes')
    .select('cidade')
    .eq('estado', sigla)
    .eq('status', 'ativo')
    .limit(500)

  const cidades = Array.from(new Set((cidadeData || []).map(d => d.cidade)))
  function toSlug(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  const cidadeReal = cidades.find(c => toSlug(c) === cidadeSlug) || ''
  const cidadeNome = cidadeReal || formatarCidade(params.cidade)

  const { data: perfis, count } = await supabase
    .from('acompanhantes')
    .select('id,slug,nome,descricao,cidade,estado,foto_capa,fotos,plano', { count: 'exact' })
    .eq('status', 'ativo').eq('sexo', SEXO).eq('estado', sigla)
    .eq('cidade', cidadeReal || cidadeNome)
    .not('foto_capa', 'is', null)
    .order('plano', { ascending: false }).order('id', { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1)

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  // Informações turísticas do estado
  const turismo = TURISMO_ESTADO[sigla] || {
    atracoes: `${cidadeNome} e região oferecem diversas opções de lazer, cultura e entretenimento para visitantes.`,
    gastronomia: `A culinária local valoriza ingredientes regionais e sabores tradicionais brasileiros.`,
    cultura: `A cidade preserva tradições culturais e oferece eventos ao longo do ano.`
  }

  // Perguntas do FAQ
  const faqPerguntas = [
    {
      pergunta: `Como encontrar acompanhantes em ${cidadeNome}?`,
      resposta: `A VipAcompanhante lista ${count || 0} perfis verificados em ${cidadeNome}. Navegue pelos perfis, veja fotos reais e entre em contato diretamente via WhatsApp ou telefone. Todos os perfis são de pessoas maiores de 18 anos.`
    },
    {
      pergunta: `Os perfis de acompanhantes são verificados?`,
      resposta: `Sim, todos os perfis passam por verificação. Exigimos fotos reais e dados de contato válidos. Perfis VIP e Super VIP possuem verificação adicional com selfie e documento.`
    },
    {
      pergunta: `É seguro contratar acompanhantes pela internet?`,
      resposta: `Recomendamos sempre verificar o perfil completo, ler a descrição e, se possível, fazer videochamada antes do encontro. Nunca faça pagamentos antecipados e combine tudo claramente. O serviço de acompanhamento é legal no Brasil quando exercido por maiores de idade.`
    },
    {
      pergunta: `Quais as formas de contato com as acompanhantes?`,
      resposta: `Cada perfil exibe telefone e/ou WhatsApp para contato direto. Não intermediamos encontros - a negociação é feita diretamente entre as partes interessadas.`
    },
    {
      pergunta: `O que fazer em ${cidadeNome} e ${estadoNome}?`,
      resposta: turismo.atracoes
    },
    {
      pergunta: `Qual a gastronomia típica de ${estadoNome}?`,
      resposta: turismo.gastronomia
    },
    {
      pergunta: `Quais as tradições culturais de ${estadoNome}?`,
      resposta: turismo.cultura
    }
  ]

  const schemaFAQ = gerarSchemaFAQ(faqPerguntas)

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0f0f0;font-family:system-ui,sans-serif}
        .wrap{max-width:1200px;margin:0 auto;padding:0 16px}
        .grid{display:grid;gap:12px}
        @media(max-width:599px){.grid{grid-template-columns:1fr}}
        @media(min-width:600px) and (max-width:899px){.grid{grid-template-columns:1fr 1fr}}
        @media(min-width:900px){.grid{grid-template-columns:1fr 1fr 1fr}}
        @media(min-width:1200px){.grid{grid-template-columns:1fr 1fr 1fr 1fr}}
        .card{border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12);display:block;text-decoration:none;transition:transform .2s,box-shadow .2s}
        .card:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,.18)}
        .faq-item{background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
        .faq-pergunta{font-weight:700;color:#222;font-size:15px;margin-bottom:8px;display:flex;align-items:flex-start;gap:8px}
        .faq-resposta{color:#555;font-size:14px;line-height:1.7;padding-left:24px}
      `}</style>

      {/* Schema FAQ para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
      />

      <header style={{background:'#fff',borderBottom:`3px solid ${COR}`,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <div className="wrap" style={{padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{background:COR,borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontSize:'15px',fontWeight:900}}>V</span>
            </div>
            <span style={{fontWeight:800,fontSize:'17px',color:'#222'}}>VipAcompanhante</span>
          </Link>
          <Link href={`/${ROTA}/${params.estado}/`} style={{color:'#555',textDecoration:'none',fontSize:'14px',display:'flex',alignItems:'center',gap:'4px'}}>
            <ChevronLeft size={16}/> {estadoNome}
          </Link>
        </div>
      </header>

      <div className="wrap" style={{padding:'16px 16px 32px'}}>
        <p style={{fontSize:'13px',color:'#888',marginBottom:'12px'}}>
          <Link href="/" style={{color:'#888',textDecoration:'none'}}>Início</Link>
          {' / '}
          <Link href={`/${ROTA}/${params.estado}/`} style={{color:'#888',textDecoration:'none'}}>{estadoNome}</Link>
          {' / '}
          <span style={{color:COR,fontWeight:600}}>{cidadeNome}</span>
        </p>

        <h1 style={{fontSize:'22px',fontWeight:800,color:'#222',marginBottom:'8px'}}>
          {TIPO} em {cidadeNome} - {sigla}
        </h1>
        <p style={{fontSize:'14px',color:'#666',marginBottom:'20px'}}>{count || 0} perfis encontrados</p>

        {(perfis || []).length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:'12px'}}>
            <p style={{fontSize:'16px',color:'#666',marginBottom:'16px'}}>Nenhuma acompanhante encontrada em {cidadeNome}.</p>
            <Link href={`/${ROTA}/${params.estado}/`} style={{color:COR,fontWeight:700,textDecoration:'none',border:`1px solid ${COR}`,padding:'10px 24px',borderRadius:'8px',display:'inline-block'}}>
              Ver todas do {estadoNome}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid" style={{marginBottom:'20px'}}>
              {(perfis || []).map(p => (
                <Link key={p.id} href={`/acompanhante/${p.slug}/`} className="card">
                  <div style={{position:'relative',width:'100%',aspectRatio:'3/4',background:'#1a1a1a',overflow:'hidden'}}>
                    {p.foto_capa
                      ? <Image src={p.foto_capa} alt={p.nome} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{objectFit:'cover'}}/>
                      : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#444',fontSize:'36px'}}>📷</div>
                    }
                    <div style={{position:'absolute',top:'10px',right:'10px',background:COR,color:'#fff',borderRadius:'20px',padding:'4px 10px',display:'flex',alignItems:'center',gap:'4px',fontSize:'13px',fontWeight:700}}>
                      <Camera size={12}/> {Math.max((p.fotos||[]).length,1)}
                    </div>
                    {p.plano !== 'gratis' && (
                      <div style={{position:'absolute',top:'10px',left:'10px',background:p.plano==='super_vip'?'#d4af37':'#444',color:'#fff',borderRadius:'20px',padding:'3px 10px',fontSize:'11px',fontWeight:700}}>
                        {p.plano==='super_vip'?'★ SUPER VIP':'◆ VIP'}
                      </div>
                    )}
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:`linear-gradient(transparent,${COR}dd)`,padding:'32px 12px 12px'}}>
                      <h3 style={{color:'#fff',fontSize:'17px',fontWeight:700,marginBottom:'3px'}}>{p.nome}</h3>
                      {p.descricao && <p style={{color:'rgba(255,255,255,.85)',fontSize:'12px',marginBottom:'6px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden',lineHeight:1.4}}>{p.descricao}</p>}
                      <div style={{display:'flex',alignItems:'center',gap:'4px',color:'rgba(255,255,255,.9)',fontSize:'12px'}}>
                        <MapPin size={11}/> {p.cidade} - {p.estado}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginBottom:'24px'}}>
                {Array.from({length:Math.min(totalPaginas,10)},(_,i)=>i+1).map(p=>(
                  <Link key={p} href={`?pagina=${p}`} style={{padding:'8px 14px',border:`1px solid ${p===pagina?COR:'#ddd'}`,borderRadius:'6px',textDecoration:'none',fontSize:'14px',fontWeight:p===pagina?700:400,color:p===pagina?COR:'#555',background:p===pagina?'#fef2f2':'#fff'}}>
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Descrição SEO */}
        <div style={{background:'#fff',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',marginTop:'8px',marginBottom:'24px'}}>
          <h2 style={{fontSize:'17px',fontWeight:700,color:'#222',marginBottom:'10px'}}>{TIPO} em {cidadeNome}</h2>
          <p style={{fontSize:'14px',color:'#555',lineHeight:1.8}}>
            Encontre as melhores {TIPO.toLowerCase()} em {cidadeNome} - {estadoNome} na VipAcompanhante.
            São {count || 0} perfis verificados com fotos reais e contato direto via WhatsApp ou telefone.
            Todos os anunciantes são maiores de 18 anos e responsáveis por suas publicações.
          </p>
        </div>

        {/* FAQ */}
        <div style={{marginBottom:'24px'}}>
          <h2 style={{fontSize:'18px',fontWeight:700,color:'#222',marginBottom:'16px'}}>
            Perguntas Frequentes sobre {cidadeNome}
          </h2>
          
          {faqPerguntas.map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-pergunta">
                <span style={{color:COR}}>❓</span>
                {faq.pergunta}
              </div>
              <div className="faq-resposta">{faq.resposta}</div>
            </div>
          ))}
        </div>

        {/* Dica de turismo */}
        <div style={{background:'linear-gradient(135deg, #fff9e6 0%, #fff 100%)',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f0e6c8'}}>
          <h2 style={{fontSize:'17px',fontWeight:700,color:'#222',marginBottom:'10px'}}>
            🗺️ Turismo em {estadoNome}
          </h2>
          <p style={{fontSize:'14px',color:'#555',lineHeight:1.8,marginBottom:'12px'}}>
            {turismo.atracoes}
          </p>
          <p style={{fontSize:'14px',color:'#555',lineHeight:1.8}}>
            <strong>Gastronomia:</strong> {turismo.gastronomia}
          </p>
        </div>
      </div>
    </>
  )
}
