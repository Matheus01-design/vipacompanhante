import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PROMPTS_PADRAO: Record<string, string> = {
  fofa: `Você é a Luna, uma assistente virtual fofa, meiga e carinhosa. 
- Use emojis fofos: 💕 🥰 😊 ✨ 🌸
- Seja doce e acolhedora como uma amiga próxima
- Demonstre interesse genuíno pela pessoa
- Responda em português brasileiro com frases curtas (1-3 frases)
- Exemplo: "Oi amor! Que bom te ver por aqui 🥰"`,

  sensual: `Você é a Luna, uma mulher virtual sedutora, sensual e envolvente.
- Use emojis sensuais: 😈 💋 🔥 😏 💕
- Seja provocante mas elegante, nunca vulgar
- Flerte com naturalidade, faça elogios ousados
- Responda em português brasileiro com frases curtas (1-3 frases)
- Exemplo: "Oi gato... tava pensando em você 😈"`,

  picante: `Você é a Luna, uma mulher virtual ousada, direta e muito provocante.
- Use emojis quentes: 🔥 😈 💋 🍑 💦
- Seja bem direta e ousada nas provocações
- Faça perguntas picantes para manter o clima quente
- Responda em português brasileiro com frases curtas (1-3 frases)
- Exemplo: "Hmm gostoso... o que você tá afim de fazer? 🔥"`
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Buscar configuração do banco
    const { data: config } = await supabase
      .from('luna_config')
      .select('*')
      .limit(1)
      .single()

    // Usar prompt personalizado ou padrão baseado no temperamento
    let systemPrompt = ''
    if (config?.prompt_personalizado && config.prompt_personalizado.trim()) {
      systemPrompt = config.prompt_personalizado
    } else {
      const temperamento = config?.temperamento || 'sensual'
      systemPrompt = PROMPTS_PADRAO[temperamento] || PROMPTS_PADRAO.sensual
    }

    const temperatura = config?.temperatura || 0.95

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: Number(temperatura),
        max_tokens: 200
      })
    })

    const data = await response.json()

    if (data.error) {
      console.error('Groq error:', data.error)
      return NextResponse.json({
        text: 'Ops, tive um probleminha aqui... Tenta de novo? 😈'
      })
    }

    const text = data.choices?.[0]?.message?.content ||
      'Oi! Desculpa, não entendi... repete? 💋'

    return NextResponse.json({ text })

  } catch (error) {
    console.error('Luna API error:', error)
    return NextResponse.json({
      text: 'Ops, tive um probleminha aqui... Tenta de novo? 😈'
    })
  }
}

// Endpoint para buscar configuração (usado pela página)
export async function GET() {
  try {
    const { data: config } = await supabase
      .from('luna_config')
      .select('*')
      .limit(1)
      .single()

    return NextResponse.json(config || {})
  } catch (error) {
    return NextResponse.json({})
  }
}
