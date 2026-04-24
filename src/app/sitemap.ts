import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.vipacompanhante.com'

const ESTADOS = ['sp', 'rj', 'mg', 'ba', 'rs', 'pr', 'sc', 'pe', 'ce', 'go', 'df', 'pa', 'ma', 'es', 'pb', 'rn', 'al', 'se', 'pi', 'mt', 'ms', 'am', 'ro', 'ac', 'ap', 'rr', 'to']
const SEXOS = ['mulheres', 'trans', 'homens']
const CABELOS = ['loiras', 'morenas', 'ruivas', 'negras', 'castanhas', 'coloridas']
const ETNIAS = ['brancas', 'mulatas', 'asiaticas', 'latinas']
const CORPOS = ['magras', 'slim', 'atleticas', 'curvilineas', 'gordinhas']
const ESPECIAIS = ['com-local', 'verificadas', 'super-vip', 'vip', 'novas']
const SEIOS = ['seios-pequenos', 'seios-medios', 'seios-grandes', 'seios-silicone']

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const hoje = new Date()

  const [perfisRes, postsRes, locaisRes] = await Promise.all([
    supabase
      .from('acompanhantes')
      .select('slug, atualizado_em')
      .eq('status', 'ativo')
      .order('id', { ascending: false })
      .limit(50000),
    supabase
      .from('blog_posts')
      .select('slug, atualizado_em')
      .eq('publicado', true)
      .order('criado_em', { ascending: false }),
    supabase
      .from('acompanhantes')
      .select('estado, cidade, bairro, sexo')
      .eq('status', 'ativo')
      .limit(50000),
  ])

  const urls: MetadataRoute.Sitemap = []

  // Páginas estáticas
  urls.push({ url: `${BASE_URL}/`, lastModified: hoje, changeFrequency: 'daily', priority: 1.0 })
  urls.push({ url: `${BASE_URL}/cadastro/`, lastModified: hoje, changeFrequency: 'monthly', priority: 0.8 })
  urls.push({ url: `${BASE_URL}/luna/`, lastModified: hoje, changeFrequency: 'monthly', priority: 0.7 })
  urls.push({ url: `${BASE_URL}/blog/`, lastModified: hoje, changeFrequency: 'daily', priority: 0.8 })
  urls.push({ url: `${BASE_URL}/planos/`, lastModified: hoje, changeFrequency: 'monthly', priority: 0.6 })

  // Categorias por sexo+estado: /mulheres/sp/, /trans/rj/, etc.
  for (const sexo of SEXOS) {
    for (const estado of ESTADOS) {
      urls.push({
        url: `${BASE_URL}/${sexo}/${estado}/`,
        lastModified: hoje,
        changeFrequency: 'daily',
        priority: 0.9,
      })
    }
  }

  // Cidades e bairros reais (a partir do banco) por sexo
  const combinacoesCidade = new Set<string>()
  const combinacoesBairro = new Set<string>()
  const sexoMap: Record<string, string> = { mulher: 'mulheres', trans: 'trans', homem: 'homens' }

  ;(locaisRes.data || []).forEach(p => {
    if (!p.estado || !p.cidade || !p.sexo) return
    const sexoSlug = sexoMap[p.sexo]
    if (!sexoSlug) return
    const estadoSlug = p.estado.toLowerCase()
    const cidadeSlug = slugify(p.cidade)
    if (!cidadeSlug) return
    combinacoesCidade.add(`${sexoSlug}|${estadoSlug}|${cidadeSlug}`)
    if (p.bairro) {
      const bairroSlug = slugify(p.bairro)
      if (bairroSlug) combinacoesBairro.add(`${sexoSlug}|${estadoSlug}|${cidadeSlug}|${bairroSlug}`)
    }
  })

  combinacoesCidade.forEach(c => {
    const [sexo, estado, cidade] = c.split('|')
    urls.push({
      url: `${BASE_URL}/${sexo}/${estado}/${cidade}/`,
      lastModified: hoje,
      changeFrequency: 'daily',
      priority: 0.85,
    })
  })

  combinacoesBairro.forEach(c => {
    const [sexo, estado, cidade, bairro] = c.split('|')
    urls.push({
      url: `${BASE_URL}/${sexo}/${estado}/${cidade}/${bairro}/`,
      lastModified: hoje,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  })

  // Páginas SEO de característica /c/[slug]
  const adicionarSEO = (slug: string, prioridade: number) => {
    urls.push({
      url: `${BASE_URL}/c/${slug}/`,
      lastModified: hoje,
      changeFrequency: 'daily',
      priority: prioridade,
    })
  }

  CABELOS.forEach(cabelo => ESTADOS.forEach(e => adicionarSEO(`${cabelo}-${e}`, 0.8)))
  ETNIAS.forEach(etnia => ['sp', 'rj', 'mg', 'ba', 'rs', 'pr'].forEach(e => adicionarSEO(`${etnia}-${e}`, 0.75)))
  CORPOS.forEach(corpo => ['sp', 'rj', 'mg'].forEach(e => adicionarSEO(`${corpo}-${e}`, 0.7)))
  ESPECIAIS.forEach(esp => ESTADOS.forEach(e => adicionarSEO(`${esp}-${e}`, 0.8)))
  SEIOS.forEach(seio => ['sp', 'rj'].forEach(e => adicionarSEO(`${seio}-${e}`, 0.65)))

  // Perfis individuais
  ;(perfisRes.data || []).forEach(p => {
    if (!p.slug) return
    urls.push({
      url: `${BASE_URL}/acompanhante/${p.slug}/`,
      lastModified: p.atualizado_em ? new Date(p.atualizado_em) : hoje,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  })

  // Posts do blog
  ;(postsRes.data || []).forEach(p => {
    if (!p.slug) return
    urls.push({
      url: `${BASE_URL}/blog/${p.slug}/`,
      lastModified: p.atualizado_em ? new Date(p.atualizado_em) : hoje,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  })

  return urls
}
