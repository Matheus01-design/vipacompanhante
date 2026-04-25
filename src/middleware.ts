import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================
// CACHE module-level (TTL 5min) — evita query repetida pra mesma URL
// ============================================
const perfilCache = new Map<string, { slug: string | null; ts: number }>()
const PERFIL_CACHE_TTL = 5 * 60 * 1000
const PERFIL_CACHE_MAX = 500

function cacheGet(key: string): string | null | undefined {
  const v = perfilCache.get(key)
  if (!v) return undefined
  if (Date.now() - v.ts > PERFIL_CACHE_TTL) {
    perfilCache.delete(key)
    return undefined
  }
  return v.slug
}

function cacheSet(key: string, slug: string | null) {
  if (perfilCache.size >= PERFIL_CACHE_MAX) {
    const firstKey = perfilCache.keys().next().value
    if (firstKey) perfilCache.delete(firstKey)
  }
  perfilCache.set(key, { slug, ts: Date.now() })
}

// ============================================
// PADRÕES WP que tentam achar perfil específico no banco
// ============================================
interface PadraoPerfilWP {
  slugWp: string         // ex: 'julia-silva' (parte antes de -mulher-acompanhante-em-)
  cidade: string         // ex: 'cianorte'
  estado?: string        // ex: 'pr' (se identificado)
  sexo: 'mulher' | 'homem' | 'trans'
  fallback: string       // url pra cair se não achar perfil
}

function detectarPadraoPerfilWP(pathname: string): PadraoPerfilWP | null {
  // PADRAO A: 5 segmentos /sexo/estado/cidade/bairro/{slug}-mulher-acompanhante-em-...
  const m2 = pathname.match(
    /^\/(mulheres|homens|trans)\/([a-z]{2})\/([^/]+)\/([^/]+)\/([a-z][a-z0-9-]*?)-(mulher|homem|trans)-acompanhante-em-[^/]+\/?$/i
  )
  if (m2) {
    const [, sexoPath, estado, cidade, , slugWp, sexo] = m2
    return {
      slugWp,
      cidade,
      estado,
      sexo: sexo.toLowerCase() as any,
      fallback: `/${sexoPath}/${estado}/${cidade}/`,
    }
  }

  // PADRAO B: na raiz /{slug}-mulher-acompanhante-em-{cidade}-{estado}/
  const m3 = pathname.match(
    /^\/([a-z][a-z0-9-]*?)-(mulher|homem|trans)-acompanhante-em-([a-z0-9-]+?)-([a-z]{2})(?:-jpg)?\/?$/i
  )
  if (m3) {
    const [, slugWp, sexo, cidade, estado] = m3
    const sexoPath = sexo === 'mulher' ? 'mulheres' : sexo === 'homem' ? 'homens' : 'trans'
    return {
      slugWp,
      cidade,
      estado,
      sexo: sexo.toLowerCase() as any,
      fallback: `/${sexoPath}/${estado}/${cidade}/`,
    }
  }

  return null
}

async function buscarPerfilSimilar(supabase: any, padrao: PadraoPerfilWP): Promise<string | null> {
  const cacheKey = `${padrao.sexo}|${padrao.slugWp}|${padrao.cidade}`.toLowerCase()
  const cached = cacheGet(cacheKey)
  if (cached !== undefined) return cached

  const nomeBusca = padrao.slugWp.replace(/-/g, ' ').trim()
  const primeiroNome = nomeBusca.split(' ')[0]
  const cidadeBusca = padrao.cidade.replace(/-/g, ' ').trim()

  try {
    const { data } = await supabase
      .from('acompanhantes')
      .select('slug')
      .eq('status', 'ativo')
      .eq('sexo', padrao.sexo)
      .ilike('nome', `${primeiroNome}%`)
      .ilike('cidade', `%${cidadeBusca}%`)
      .not('foto_capa', 'is', null)
      .limit(1)
      .maybeSingle()

    const slug = data?.slug || null
    cacheSet(cacheKey, slug)
    return slug
  } catch {
    cacheSet(cacheKey, null)
    return null
  }
}

// ============================================
// REDIRECTS estaticos (sem banco)
// ============================================
function verificarRedirectAntigo(pathname: string): string | null {

  // REDIRECT 1: Páginas de FOTOS/ATTACHMENTS (6+ segmentos)
  const fotoMatch = pathname.match(
    /^\/(mulheres|homens|trans)\/([a-z]{2})\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/?$/i
  )
  if (fotoMatch) {
    const [, sexo, estado, cidade] = fotoMatch
    return `/${sexo}/${estado}/${cidade}/`
  }

  // REDIRECT 4: Páginas de sistema do WordPress
  const sistemaPaths = [
    '/registre-se', '/pagina-inicial', '/erotika-radio', '/pre',
    '/logo', '/iconesite', '/compra-e-venda', '/curso-profissional',
    '/autora-mario', '/anunciante-2gratis', '/anunciante-vip', '/anunciante-super-vip'
  ]
  for (const p of sistemaPaths) {
    if (pathname.startsWith(p)) {
      return '/'
    }
  }

  // REDIRECT 5: URLs com lixo do WordPress dentro da estrutura
  const wpLixoMatch = pathname.match(
    /^\/(mulheres|homens|trans)\/([a-z]{2})\/([^/]+)\/(compra-e-venda|curso-profissional|autora-|anunciante-)/i
  )
  if (wpLixoMatch) {
    const [, sexo, estado, cidade] = wpLixoMatch
    return `/${sexo}/${estado}/${cidade}/`
  }

  // REDIRECT 6: Cidades antigas na raiz (sem /mulheres/)
  const cidadeRaizMatch = pathname.match(/^\/([a-z][a-z-]+)\/?$/i)
  if (cidadeRaizMatch) {
    const possibleCity = cidadeRaizMatch[1]
    const rotasValidas = [
      'mulheres', 'homens', 'trans', 'acompanhante',
      'admin', 'login', 'cadastro', 'planos',
      'minha-conta', 'buscar', 'recuperar-senha',
      'luna', 'blog', 'c'
    ]
    if (!rotasValidas.includes(possibleCity)) {
      return '/'
    }
  }

  // REDIRECT 7: Duplo slug WP concatenado na raiz (formato muito antigo)
  const duploSlugMatch = pathname.match(
    /^\/[a-z][a-z0-9-]*-(?:mulher|homem|trans)-acompanhante-em-[a-z0-9-]+\/([a-z][a-z0-9-]*)-(mulher|homem|trans)-acompanhante-em-([a-z0-9-]+?)(?:-([a-z]{2}))?\/?$/i
  )
  if (duploSlugMatch) {
    const [, , sexo, cidadeOuLocal, possivelEstado] = duploSlugMatch
    const sexoPath = sexo === 'mulher' ? 'mulheres' : sexo === 'homem' ? 'homens' : 'trans'
    if (possivelEstado) {
      return `/${sexoPath}/${possivelEstado}/${cidadeOuLocal}/`
    }
    return `/${sexoPath}/`
  }

  // REDIRECT 8: URLs com espaço/acento decodificados (encoding quebrado)
  if (/\s/.test(pathname) || /[^\x00-\x7F]/.test(pathname)) {
    const secaoMatch = pathname.match(/^\/(mulheres|homens|trans|blog)\//i)
    if (secaoMatch) {
      return `/${secaoMatch[1].toLowerCase()}/`
    }
    return '/'
  }

  return null
}

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Cria supabase uma vez — usado em multiple lugares
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ==========================================
  // PASSO 1a: Padroes WP de PERFIL — tentar buscar especifico no banco
  // ==========================================
  const padraoPerfil = detectarPadraoPerfilWP(pathname)
  if (padraoPerfil) {
    const slugReal = await buscarPerfilSimilar(supabase, padraoPerfil)
    const destino = slugReal ? `/acompanhante/${slugReal}/` : padraoPerfil.fallback
    return NextResponse.redirect(new URL(destino, request.url), { status: 301 })
  }

  // ==========================================
  // PASSO 1b: Redirects estaticos (REDIRECT 1, 4, 5, 6, 7, 8)
  // ==========================================
  const novaUrl = verificarRedirectAntigo(pathname)
  if (novaUrl) {
    return NextResponse.redirect(new URL(novaUrl, request.url), { status: 301 })
  }

  // ==========================================
  // PASSO 2: Lógica de autenticação existente
  // ==========================================
  const { data: { user } } = await supabase.auth.getUser()

  // Rotas que precisam de login
  const rotasProtegidas = ['/minha-conta', '/admin']
  const precisaLogin = rotasProtegidas.some(r => pathname.startsWith(r))

  if (precisaLogin && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Proteger rota admin
  if (pathname.startsWith('/admin') && user) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('user_id', user.id)
      .single()

    if (perfil?.tipo !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Redirecionar usuário logado para longe do login/cadastro
  if ((pathname === '/login' || pathname === '/cadastro') && user) {
    return NextResponse.redirect(new URL('/minha-conta', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
