import Link from 'next/link'

interface Props {
  tipo: string
  local: string
  descricaoLocal: string
  cor: string
  voltarHref: string
  voltarLabel: string
}

export default function ListagemVazia({ tipo, local, descricaoLocal, cor, voltarHref, voltarLabel }: Props) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#222', marginBottom: '12px', textAlign: 'center' }}>
        Sem {tipo.toLowerCase()} ativas em {local} no momento
      </h2>
      <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.7, marginBottom: '16px', maxWidth: '640px', margin: '0 auto 16px' }}>
        Esta página é dedicada a {tipo.toLowerCase()} em {descricaoLocal}. No momento não há perfis ativos com fotos verificadas, mas a região permanece coberta — assim que novos anúncios forem aprovados, eles aparecem aqui automaticamente.
      </p>
      <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, marginBottom: '24px', maxWidth: '640px', margin: '0 auto 24px' }}>
        Quem busca {tipo.toLowerCase()} em {local} pode explorar perfis em cidades próximas no mesmo estado, voltar para a listagem completa do estado, ou aguardar novos cadastros — o site é atualizado diariamente com perfis verificados, fotos reais e contato direto via WhatsApp.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        <Link href={voltarHref} style={{ background: cor, color: '#fff', padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
          ← Ver {voltarLabel}
        </Link>
        <Link href="/cadastro" style={{ background: '#fff', border: `2px solid ${cor}`, color: cor, padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
          Cadastrar perfil nesta região
        </Link>
      </div>
    </div>
  )
}
