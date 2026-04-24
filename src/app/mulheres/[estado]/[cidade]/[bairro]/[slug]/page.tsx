import { permanentRedirect } from 'next/navigation'

interface Props {
  params: { estado: string; cidade: string; bairro: string; slug: string }
}

// Rota legada que duplicava conteúdo de /acompanhante/[slug].
// Faz 301 para a URL canônica para concentrar sinal SEO num único endereço.
export default function PerfilLegadoMulheres({ params }: Props) {
  permanentRedirect(`/acompanhante/${params.slug}/`)
}
