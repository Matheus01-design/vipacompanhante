// =============================================
// TIPOS GLOBAIS - VIP ACOMPANHANTE
// =============================================

export type Sexo = 'mulher' | 'homem' | 'trans'
export type Plano = 'gratis' | 'vip' | 'super_vip'
export type StatusAcompanhante = 'pendente' | 'ativo' | 'inativo' | 'suspenso'
export type TipoPerfil = 'acompanhante' | 'cliente' | 'admin'

export interface Acompanhante {
  id: string
  user_id: string
  nome: string
  slug: string
  idade: number
  sexo: Sexo
  descricao?: string
  estado: string
  cidade: string
  bairro?: string
  latitude?: number
  longitude?: number
  atendimento: string[]
  preco?: string
  preco_numero?: number
  telefone?: string
  whatsapp?: string
  foto_capa?: string
  fotos: string[]
  plano: Plano
  plano_expira_em?: string
  status: StatusAcompanhante
  verificado: boolean
  meta_title?: string
  meta_description?: string
  criado_em: string
  atualizado_em: string
}

export interface AcompanhantePublico {
  id: string
  slug: string
  nome: string
  idade: number
  sexo: Sexo
  estado: string
  cidade: string
  bairro?: string
  atendimento: string[]
  preco?: string
  foto_capa?: string
  fotos: string[]
  plano: Plano
  verificado: boolean
  criado_em: string
}

export interface Perfil {
  id: string
  user_id: string
  tipo: TipoPerfil
  nome?: string
  email?: string
  telefone?: string
  criado_em: string
}

export interface Assinatura {
  id: string
  acompanhante_id: string
  plano: 'vip' | 'super_vip'
  valor: number
  status: 'pendente' | 'ativo' | 'cancelado' | 'expirado'
  periodo: 'mensal' | 'trimestral' | 'semanal'
  inicia_em: string
  expira_em?: string
  criado_em: string
}

export interface FiltrosListagem {
  sexo?: Sexo
  estado?: string
  cidade?: string
  plano?: Plano
  atendimento?: string
  precoMin?: number
  precoMax?: number
  ordem?: 'recentes' | 'preco_asc' | 'preco_desc'
}

export interface PlanoPagamento {
  id: Plano
  nome: string
  preco: number
  periodo: string
  beneficios: string[]
  destaque?: boolean
}

export const PLANOS: PlanoPagamento[] = [
  {
    id: 'gratis',
    nome: 'Grátis',
    preco: 0,
    periodo: 'sem custo',
    beneficios: [
      'Perfil básico',
      '1 foto',
      'Aparece na listagem',
    ]
  },
  {
    id: 'vip',
    nome: 'VIP',
    preco: 19.90,
    periodo: 'por mês',
    beneficios: [
      'Perfil em destaque',
      'Até 10 fotos',
      'Badge VIP no perfil',
      'Aparece primeiro nas buscas',
      'Estatísticas de visualizações',
    ]
  },
  {
    id: 'super_vip',
    nome: 'Super VIP',
    preco: 29.90,
    periodo: 'por semana',
    destaque: true,
    beneficios: [
      'Topo absoluto da listagem',
      'Fotos ilimitadas',
      'Badge Super VIP exclusivo',
      'Destaque na home',
      'Estatísticas completas',
      'Suporte prioritário',
    ]
  }
]

export const ESTADOS_BR: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
}
