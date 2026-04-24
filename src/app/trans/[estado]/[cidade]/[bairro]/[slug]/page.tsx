import { permanentRedirect } from 'next/navigation'

interface Props {
  params: { estado: string; cidade: string; bairro: string; slug: string }
}

export default function PerfilLegadoTrans({ params }: Props) {
  permanentRedirect(`/acompanhante/${params.slug}/`)
}
