import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type !== 'payment') return NextResponse.json({ ok: true })

    // Buscar detalhes do pagamento no MercadoPago
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${body.data.id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    })

    if (!paymentRes.ok) return NextResponse.json({ ok: false }, { status: 400 })

    const payment = await paymentRes.json()

    if (payment.status !== 'approved') return NextResponse.json({ ok: true })

    // external_reference = "userId|plano"
    const [userId, plano] = (payment.external_reference || '').split('|')
    if (!userId || !plano) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = createAdminClient()

    // Calcular validade do plano
    const agora = new Date()
    const expira = new Date(agora)
    if (plano === 'super_vip') expira.setDate(expira.getDate() + 7)  // 7 dias
    else expira.setMonth(expira.getMonth() + 1)  // 1 mês

    // Atualizar plano da acompanhante
    await supabase
      .from('acompanhantes')
      .update({ plano, plano_expira_em: expira.toISOString() })
      .eq('user_id', userId)

    // Registrar assinatura
    const { data: acomp } = await supabase
      .from('acompanhantes')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (acomp) {
      await supabase.from('assinaturas').insert({
        user_id: userId,
        acompanhante_id: acomp.id,
        plano,
        valor: payment.transaction_amount,
        status: 'ativo',
        mp_payment_id: String(payment.id),
        periodo: plano === 'super_vip' ? 'semanal' : 'mensal',
        inicia_em: agora.toISOString(),
        expira_em: expira.toISOString(),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
