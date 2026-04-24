import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAcompanhantePorSlug } from '@/lib/queries'
import { ESTADOS_BR } from '@/types'
import PerfilCliente from './PerfilCliente'

const BASE_URL = 'https://www.vipacompanhante.com'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const perfil = await getAcompanhantePorSlug(params.slug)
  if (!perfil) return { title: 'Perfil não encontrado' }

  const estadoNome = ESTADOS_BR[perfil.estado] || perfil.estado
  const localTexto = perfil.bairro
    ? `${perfil.bairro}, ${perfil.cidade} - ${perfil.estado}`
    : `${perfil.cidade} - ${perfil.estado}`

  const title = perfil.meta_title
    || `${perfil.nome}${perfil.idade ? `, ${perfil.idade} anos` : ''} - Acompanhante em ${perfil.cidade} ${perfil.estado}`

  const description = perfil.meta_description
    || (perfil.descricao
        ? perfil.descricao.slice(0, 155).replace(/\s+\S*$/, '') + '...'
        : `Conheça ${perfil.nome}, acompanhante em ${localTexto}. Fotos reais, contato direto via WhatsApp e total discrição. Anúncio verificado em ${estadoNome}.`)

  const url = `${BASE_URL}/acompanhante/${perfil.slug}/`
  const imagem = perfil.foto_capa || `${BASE_URL}/og-image.jpg`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'profile',
      siteName: 'VipAcompanhante',
      locale: 'pt_BR',
      images: [{ url: imagem, width: 1200, height: 630, alt: perfil.nome }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imagem],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  }
}

export default async function PerfilPage({ params }: Props) {
  const perfil = await getAcompanhantePorSlug(params.slug)
  if (!perfil) notFound()

  const estadoNome = ESTADOS_BR[perfil.estado] || perfil.estado
  const url = `${BASE_URL}/acompanhante/${perfil.slug}/`

  // Schema Person + LocalBusiness para SEO
  const schemaPerson = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: perfil.nome,
    url,
    image: perfil.foto_capa,
    description: perfil.descricao,
    address: {
      '@type': 'PostalAddress',
      addressLocality: perfil.cidade,
      addressRegion: estadoNome,
      addressCountry: 'BR',
      ...(perfil.bairro && { streetAddress: perfil.bairro }),
    },
  }

  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: estadoNome,
        item: `${BASE_URL}/mulheres/${perfil.estado.toLowerCase()}/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: perfil.cidade,
        item: `${BASE_URL}/mulheres/${perfil.estado.toLowerCase()}/${perfil.cidade.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}/`,
      },
      { '@type': 'ListItem', position: 4, name: perfil.nome, item: url },
    ],
  }

  const schemaService: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Acompanhante ${perfil.nome}`,
    description: perfil.descricao || `Acompanhante ${perfil.nome} em ${perfil.cidade} - ${estadoNome}`,
    serviceType: 'Acompanhante',
    image: perfil.foto_capa,
    url,
    provider: {
      '@type': 'Person',
      name: perfil.nome,
      ...(perfil.foto_capa && { image: perfil.foto_capa }),
    },
    areaServed: {
      '@type': 'City',
      name: perfil.cidade,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: estadoNome,
        containedInPlace: { '@type': 'Country', name: 'Brasil' },
      },
    },
  }

  if (perfil.preco_numero && perfil.preco_numero > 0) {
    schemaService.offers = {
      '@type': 'Offer',
      price: perfil.preco_numero.toString(),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url,
      ...(perfil.preco && { description: perfil.preco }),
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaPerson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaService) }}
      />
      <PerfilCliente perfilInicial={perfil} />
    </>
  )
}
