import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HomeCliente from './HomeCliente'

const BASE_URL = 'https://www.vipacompanhante.com'

export const metadata: Metadata = {
  title: 'Acompanhantes no Brasil — Perfis Verificados em Todos os Estados',
  description: 'A maior plataforma de acompanhantes do Brasil. Encontre perfis verificados com fotos reais em São Paulo, Rio de Janeiro, Minas Gerais e em todos os estados do país.',
  alternates: { canonical: `${BASE_URL}/` },
  openGraph: {
    title: 'Acompanhantes no Brasil — VipAcompanhante',
    description: 'A maior plataforma de acompanhantes do Brasil. Perfis verificados em todos os estados.',
    url: `${BASE_URL}/`,
    type: 'website',
    siteName: 'VipAcompanhante',
    locale: 'pt_BR',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default async function HomePage() {
  const supabase = await createClient()

  const [perfisRes, superVipsRes] = await Promise.all([
    supabase
      .from('acompanhantes')
      .select('id,slug,nome,descricao,cidade,estado,bairro,foto_capa,fotos,plano,latitude,longitude')
      .eq('status', 'ativo')
      .eq('sexo', 'mulher')
      .not('foto_capa', 'is', null)
      .order('plano', { ascending: false })
      .order('id', { ascending: false })
      .range(0, 23),
    supabase
      .from('acompanhantes')
      .select('id,slug,nome,cidade,estado,foto_capa,plano,latitude,longitude')
      .eq('status', 'ativo')
      .eq('sexo', 'mulher')
      .eq('plano', 'super_vip')
      .not('foto_capa', 'is', null)
      .limit(6),
  ])

  return <HomeCliente perfisIniciais={perfisRes.data || []} superVipsIniciais={superVipsRes.data || []} />
}
