import { createClient } from '@/lib/supabase/server'

// CORRIGIDO: URL com www
const BASE_URL = 'https://www.vipacompanhante.com'

// Todas as combinações de páginas SEO
const ESTADOS = ['sp', 'rj', 'mg', 'ba', 'rs', 'pr', 'sc', 'pe', 'ce', 'go', 'df', 'pa', 'ma', 'es', 'pb', 'rn', 'al', 'se', 'pi', 'mt', 'ms', 'am', 'ro', 'ac', 'ap', 'rr', 'to']
const CABELOS = ['loiras', 'morenas', 'ruivas', 'negras', 'castanhas', 'coloridas']
const ETNIAS = ['brancas', 'mulatas', 'asiaticas', 'latinas']
const CORPOS = ['magras', 'slim', 'atleticas', 'curvilineas', 'gordinhas']
const ESPECIAIS = ['com-local', 'verificadas', 'super-vip', 'vip', 'novas']
const SEIOS = ['seios-pequenos', 'seios-medios', 'seios-grandes', 'seios-silicone']
const SEXOS = ['mulheres', 'trans', 'homens']

export async function GET() {
  const supabase = await createClient()
  
  // CORRIGIDO: Buscar TODOS os perfis ativos (sem filtro de foto_capa)
  const { data: perfis } = await supabase
    .from('acompanhantes')
    .select('slug, atualizado_em, estado')
    .eq('status', 'ativo')
    .order('id', { ascending: false })
    .limit(50000)
  
  // Buscar posts do blog
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, atualizado_em')
    .eq('publicado', true)
    .order('criado_em', { ascending: false })
  
  // Gerar URLs das páginas SEO de características
  const urlsSEO: string[] = []
  
  // Cabelos + Estados
  CABELOS.forEach(cabelo => {
    ESTADOS.forEach(estado => {
      urlsSEO.push(`${cabelo}-${estado}`)
    })
  })
  
  // Etnias + Estados (principais)
  ETNIAS.forEach(etnia => {
    ['sp', 'rj', 'mg', 'ba', 'rs', 'pr'].forEach(estado => {
      urlsSEO.push(`${etnia}-${estado}`)
    })
  })
  
  // Corpos + Estados (principais)
  CORPOS.forEach(corpo => {
    ['sp', 'rj', 'mg'].forEach(estado => {
      urlsSEO.push(`${corpo}-${estado}`)
    })
  })
  
  // Especiais + Estados
  ESPECIAIS.forEach(especial => {
    ESTADOS.forEach(estado => {
      urlsSEO.push(`${especial}-${estado}`)
    })
  })
  
  // Seios + Estados (principais)
  SEIOS.forEach(seio => {
    ['sp', 'rj'].forEach(estado => {
      urlsSEO.push(`${seio}-${estado}`)
    })
  })
  
  // URLs de categoria por sexo e estado
  const urlsCategorias: string[] = []
  SEXOS.forEach(sexo => {
    ESTADOS.forEach(estado => {
      urlsCategorias.push(`${sexo}/${estado}`)
    })
  })
  
  const hoje = new Date().toISOString().split('T')[0]
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/cadastro</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/luna</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/blog</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`

  // Páginas de categoria (mulheres/sp, trans/rj, etc)
  urlsCategorias.forEach(url => {
    xml += `
  <url>
    <loc>${BASE_URL}/${url}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
  })

  // Páginas SEO de características (/c/loiras-sp, etc)
  urlsSEO.forEach(slug => {
    xml += `
  <url>
    <loc>${BASE_URL}/c/${slug}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  })

  // Perfis individuais
  perfis?.forEach(p => {
    if (!p.slug) return // Pula se não tiver slug
    const lastmod = p.atualizado_em ? new Date(p.atualizado_em).toISOString().split('T')[0] : hoje
    xml += `
  <url>
    <loc>${BASE_URL}/acompanhante/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  })

  // Posts do blog
  posts?.forEach(p => {
    if (!p.slug) return
    const lastmod = p.atualizado_em ? new Date(p.atualizado_em).toISOString().split('T')[0] : hoje
    xml += `
  <url>
    <loc>${BASE_URL}/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
  })

  xml += '\n</urlset>'

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}