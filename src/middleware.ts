import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================
// FUNÇÃO: Verificar se é URL antiga que precisa redirect
// ============================================
function verificarRedirectAntigo(pathname: string): string | null {

  // REDIRECT 1: Páginas de FOTOS/ATTACHMENTS (6+ segmentos)
  // Formato: /mulheres/estado/cidade/bairro/nome/FOTO/
  const fotoMatch = pathname.match(
    /^\/(mulheres|homens|trans)\/([a-z]{2})\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/?$/i
  )
  if (fotoMatch) {
    const [, sexo, estado, cidade] = fotoMatch
    return `/${sexo}/${estado}/${cidade}/`
  }

  // REDIRECT 2: Perfis antigos com slug WordPress (5 segmentos)
  // Padrão: contém "-mulher-acompanhante-em-" ou "-homem-" ou "-trans-"
  // VERIFICADO: 0 perfis ativos usam esse padrão de slug
  // Exemplo: /mulheres/rj/saquarema/rio-da-areia/fernanda-santos-mulher-acompanhante-em-saquarema-rj/
  const perfilAntigoMatch = pathname.match(
    /^\/(mulheres|homens|trans)\/([a-z]{2})\/([^/]+)\/([^/]+)\/([^/]+-(?:mulher|homem|trans)-acompanhante-em-[^/]+)\/?$/i
  )
  if (perfilAntigoMatch) {
    const [, sexo, estado, cidade] = perfilAntigoMatch
    return `/${sexo}/${estado}/${cidade}/`
  }

  // REDIRECT 3: Perfis antigos na RAIZ do site (formato WordPress)
  // Formato: /nome-mulher-acompanhante-em-cidade-estado/
  const perfilRaizMatch = pathname.match(
    /^\/([a-z-]+)-(mulher|homem|trans)-acompanhante-em-([a-z-]+)-([a-z]{2})(?:-jpg)?\/?$/i
  )
  if (perfilRaizMatch) {
    const [, , sexo, cidade, estado] = perfilRaizMatch
    const sexoPath = sexo === 'mulher' ? 'mulheres' : sexo === 'homem' ? 'homens' : 'trans'
    return `/${sexoPath}/${estado}/${cidade}/`
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
    // Rotas válidas que NÃO devem ser redirecionadas
    const rotasValidas = [
      'mulheres', 'homens', 'trans', 'acompanhante',
      'admin', 'login', 'cadastro', 'planos',
      'minha-conta', 'buscar', 'recuperar-senha',
      'luna', 'blog' // ← ADICIONADO: Luna e Blog
    ]
    if (!rotasValidas.includes(possibleCity)) {
      return '/'
    }
  }

  return null
}

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ==========================================
  // PASSO 1: Verificar redirects de URLs antigas
  // ==========================================
  const novaUrl = verificarRedirectAntigo(pathname)
  if (novaUrl) {
    return NextResponse.redirect(new URL(novaUrl, request.url), { status: 301 })
  }

  // ==========================================
  // PASSO 2: Lógica de autenticação existente
  // ==========================================
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
