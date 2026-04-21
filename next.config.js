/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  
  // IMPORTANTE: Trailing slash para compatibilidade com WordPress
  trailingSlash: true,
  
  async redirects() {
    return [
      // ============================================
      // PAGINAÇÃO WORDPRESS → QUERY STRING
      // /mulheres/rj/page/2/ → /mulheres/rj/?pagina=2
      // ============================================
      
      // Estado + paginação
      {
        source: '/mulheres/:estado/page/:num/',
        destination: '/mulheres/:estado/?pagina=:num',
        permanent: true,
      },
      {
        source: '/mulheres/:estado/page/:num',
        destination: '/mulheres/:estado/?pagina=:num',
        permanent: true,
      },
      {
        source: '/homens/:estado/page/:num/',
        destination: '/homens/:estado/?pagina=:num',
        permanent: true,
      },
      {
        source: '/homens/:estado/page/:num',
        destination: '/homens/:estado/?pagina=:num',
        permanent: true,
      },
      {
        source: '/trans/:estado/page/:num/',
        destination: '/trans/:estado/?pagina=:num',
        permanent: true,
      },
      
      // Cidade + paginação
      {
        source: '/mulheres/:estado/:cidade/page/:num/',
        destination: '/mulheres/:estado/:cidade/?pagina=:num',
        permanent: true,
      },
      {
        source: '/mulheres/:estado/:cidade/page/:num',
        destination: '/mulheres/:estado/:cidade/?pagina=:num',
        permanent: true,
      },
      {
        source: '/homens/:estado/:cidade/page/:num/',
        destination: '/homens/:estado/:cidade/?pagina=:num',
        permanent: true,
      },
      {
        source: '/homens/:estado/:cidade/page/:num',
        destination: '/homens/:estado/:cidade/?pagina=:num',
        permanent: true,
      },
      
      // Bairro + paginação
      {
        source: '/mulheres/:estado/:cidade/:bairro/page/:num/',
        destination: '/mulheres/:estado/:cidade/:bairro/?pagina=:num',
        permanent: true,
      },
      {
        source: '/mulheres/:estado/:cidade/:bairro/page/:num',
        destination: '/mulheres/:estado/:cidade/:bairro/?pagina=:num',
        permanent: true,
      },
      {
        source: '/homens/:estado/:cidade/:bairro/page/:num/',
        destination: '/homens/:estado/:cidade/:bairro/?pagina=:num',
        permanent: true,
      },
      {
        source: '/homens/:estado/:cidade/:bairro/page/:num',
        destination: '/homens/:estado/:cidade/:bairro/?pagina=:num',
        permanent: true,
      },
      
      // ============================================
      // REMOVIDOS OS REDIRECTS QUE MATAVAM O SEO!
      // ============================================
      // 
      // ❌ NÃO USAR MAIS:
      // {
      //   source: '/mulheres/:estado/:cidade/:bairro/',
      //   destination: '/mulheres/:estado/:cidade/',
      //   permanent: true,
      // },
      //
      // ❌ NÃO USAR MAIS:
      // {
      //   source: '/mulheres/:estado/:cidade/:bairro/:slug/',
      //   destination: '/acompanhante/:slug',
      //   permanent: true,
      // },
      //
      // Agora essas URLs são PÁGINAS REAIS!
      // ============================================
    ]
  },
}

module.exports = nextConfig
