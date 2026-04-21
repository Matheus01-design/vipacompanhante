import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { plano } = await request.json()

    const planos: Record<string, { titulo: string; preco: number; periodo: string }> = {
      vip: { titulo: 'Plano VIP - VipAcompanhante', preco: 19.90, periodo: 'mensal' },
      super_vip: { titulo: 'Plano Super VIP - VipAcompanhante', preco: 29.90, periodo: 'semanal' },
    }

    const planoInfo = planos[plano]
    if (!planoInfo) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vipacompanhante.com'

    // Criar preferência no MercadoPago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title: planoInfo.titulo,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: planoInfo.preco,
        }],
        payer: { email: user.email },
        back_urls: {
          success: `${siteUrl}/minha-conta?pagamento=sucesso&plano=${plano}`,
          failure: `${siteUrl}/planos?pagamento=falha`,
          pending: `${siteUrl}/minha-conta?pagamento=pendente`,
        },
        auto_return: 'approved',
        external_reference: `${user.id}|${plano}`,
        notification_url: `${siteUrl}/api/pagamento/webhook`,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('MercadoPago error:', err)
      return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ url: data.init_point, id: data.id })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
