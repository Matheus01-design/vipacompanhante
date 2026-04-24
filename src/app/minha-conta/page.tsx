'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Save, LogOut, Camera, X, Plus, Check, Loader2, Trash2, Upload,
  User, MapPin, DollarSign, Clock, Heart, Sparkles, Eye, Phone, 
  CreditCard, Globe, Image, Film, Crown, TrendingUp, MessageCircle
} from 'lucide-react'

const COR = '#8B0000'

// ========== OPÇÕES ==========
const OPCOES_SOBRE_MIM = [
  'Maduras', 'Ninfetas', 'Iniciantes', 'Experientes', 'Universitárias',
  'Executivas', 'Modelos', 'Tatuadas', 'Sem tatuagem', 'Fumante', 'Não fumante'
]

const OPCOES_SERVICOS_GERAIS = [
  'Beijos na boca', 'Namoradinha', 'Massagem erótica', 'Massagem tântrica',
  'Oral com camisinha', 'Oral sem camisinha', 'Oral até o final',
  'Ejaculação corpo', 'Facial', 'PSE', 'Sexo anal', 
  'Fantasias e disfarces', 'Striptease', 'Dança sensual',
  'Acompanhante eventos', 'Jantar romântico', 'Pernoite', 'Viagens'
]

const OPCOES_SERVICOS_ESPECIAIS = [
  'Beijo negro', 'Chuva dourada', 'Dominação', 'Fetichismo', 
  'Sado suave', 'Sado duro', 'Inversão', 'Strap on', 
  'Garganta profunda', 'Squirting', 'Duplas', 'Swing'
]

const OPCOES_ATENDIMENTO = ['Homens', 'Mulheres', 'Casais', 'Deficientes físicos']

const OPCOES_LOCAIS = [
  'Com local', 'A domicílio', 'Hotel', 'Motel',
  'Clube de Swing', 'Festas e eventos', 'Despedidas solteiro',
  'Viagens nacionais', 'Viagens internacionais'
]

const OPCOES_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartão crédito', 'Cartão débito', 'Transferência']
const OPCOES_IDIOMAS = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano']

const OPCOES_ETNIA = ['Branca', 'Latina', 'Mulata', 'Negra', 'Oriental']
const OPCOES_CABELO = ['Morena', 'Loira', 'Ruiva', 'Castanha', 'Preta', 'Colorido']
const OPCOES_OLHOS = ['Castanhos', 'Pretos', 'Azuis', 'Verdes', 'Mel']
const OPCOES_CORPO = ['Magra', 'Mediana', 'Gordinha', 'Fitness', 'Curvilínea']
const OPCOES_SEIOS = ['Pequenos', 'Médios', 'Grandes', 'Naturais', 'Silicone']
const OPCOES_PUBIS = ['Depilada', 'Aparada', 'Natural']

const ESTADOS_BR: {[key: string]: string} = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
}

// Calcular estatísticas baseado nos dias de cadastro
function calcularEstatisticas(criadoEm: string, visualizacoesBase: number) {
  const diasCadastro = Math.floor((Date.now() - new Date(criadoEm).getTime()) / (1000 * 60 * 60 * 24))
  const fator = 1 + (diasCadastro * 0.05) // 5% a mais por dia
  
  return {
    visualizacoes: Math.floor((visualizacoesBase || 5000) * fator),
    contatos: Math.floor(((visualizacoesBase || 5000) * 0.03) * fator), // 3% viram contato
    favoritos: Math.floor(((visualizacoesBase || 5000) * 0.01) * fator), // 1% favoritam
    diasCadastro
  }
}

export default function MinhaContaPage() {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [perfil, setPerfil] = useState<any>(null)
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })
  const [stories, setStories] = useState<any[]>([])
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [uploadingStory, setUploadingStory] = useState(false)
  
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const storyInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('acompanhantes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setPerfil({
        ...data,
        sobre_mim: data.sobre_mim || [],
        servicos: data.servicos || [],
        locais: data.locais || [],
        atendimento: data.atendimento || [],
        pagamentos: data.pagamentos || [],
        idiomas: data.idiomas || [],
        fotos: data.fotos || [],
      })

      // Carregar stories
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .eq('acompanhante_id', data.id)
        .eq('ativo', true)
        .order('criado_em', { ascending: false })

      if (storiesData) setStories(storiesData)
    } else {
      router.push('/cadastro')
    }
    setCarregando(false)
  }

  const set = (campo: string, valor: any) => {
    setPerfil((p: any) => ({ ...p, [campo]: valor }))
  }

  const toggleArray = (campo: string, valor: string) => {
    const atual = perfil[campo] || []
    if (atual.includes(valor)) {
      set(campo, atual.filter((v: string) => v !== valor))
    } else {
      set(campo, [...atual, valor])
    }
  }

  async function salvar() {
    setSalvando(true)
    setMensagem({ texto: '', tipo: '' })

    const { error } = await supabase
      .from('acompanhantes')
      .update({
        nome: perfil.nome,
        idade: parseInt(perfil.idade) || null,
        estado: perfil.estado,
        cidade: perfil.cidade,
        bairro: perfil.bairro,
        telefone: perfil.telefone,
        whatsapp: perfil.whatsapp,
        descricao: perfil.descricao,
        altura: perfil.altura,
        peso: perfil.peso,
        etnia: perfil.etnia,
        cabelo: perfil.cabelo,
        olhos: perfil.olhos,
        corpo: perfil.corpo,
        seios: perfil.seios,
        pubis: perfil.pubis,
        sobre_mim: perfil.sobre_mim,
        servicos: perfil.servicos,
        locais: perfil.locais,
        atendimento: perfil.atendimento,
        pagamentos: perfil.pagamentos,
        idiomas: perfil.idiomas,
        valor_hora: perfil.valor_hora,
        valor_meia_hora: perfil.valor_meia_hora,
        valor_pernoite: perfil.valor_pernoite,
        valor_viagem: perfil.valor_viagem,
        horario_inicio: perfil.horario_inicio,
        horario_fim: perfil.horario_fim,
        atende_24h: perfil.atende_24h,
        tem_local: perfil.tem_local,
        endereco_local: perfil.endereco_local,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', perfil.id)

    setSalvando(false)
    
    if (error) {
      setMensagem({ texto: 'Erro ao salvar: ' + error.message, tipo: 'erro' })
    } else {
      setMensagem({ texto: '✓ Perfil salvo com sucesso!', tipo: 'sucesso' })
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000)
    }
  }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFoto(true)
    const ext = file.name.split('.').pop()
    const path = `${perfil.id}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('fotos')
      .upload(path, file)

    if (upErr) {
      setMensagem({ texto: 'Erro no upload: ' + upErr.message, tipo: 'erro' })
      setUploadingFoto(false)
      return
    }

    const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path)
    const novasFotos = [...(perfil.fotos || []), urlData.publicUrl]

    // Se não tem foto de capa, usar a primeira
    const updates: any = { fotos: novasFotos }
    if (!perfil.foto_capa) {
      updates.foto_capa = urlData.publicUrl
    }

    await supabase.from('acompanhantes').update(updates).eq('id', perfil.id)
    
    set('fotos', novasFotos)
    if (!perfil.foto_capa) set('foto_capa', urlData.publicUrl)
    
    setUploadingFoto(false)
    setMensagem({ texto: '✓ Foto adicionada!', tipo: 'sucesso' })
    setTimeout(() => setMensagem({ texto: '', tipo: '' }), 2000)
  }

  async function removerFoto(url: string) {
    if (!confirm('Remover esta foto?')) return

    const novasFotos = perfil.fotos.filter((f: string) => f !== url)
    const updates: any = { fotos: novasFotos }
    
    // Se removeu a foto de capa, usar a próxima ou null
    if (perfil.foto_capa === url) {
      updates.foto_capa = novasFotos[0] || null
      set('foto_capa', novasFotos[0] || null)
    }

    await supabase.from('acompanhantes').update(updates).eq('id', perfil.id)
    set('fotos', novasFotos)
  }

  async function definirCapa(url: string) {
    await supabase.from('acompanhantes').update({ foto_capa: url }).eq('id', perfil.id)
    set('foto_capa', url)
    setMensagem({ texto: '✓ Foto de capa atualizada!', tipo: 'sucesso' })
    setTimeout(() => setMensagem({ texto: '', tipo: '' }), 2000)
  }

  async function uploadStory(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Verificar limite de stories por plano
    const limites: {[key: string]: number} = { gratis: 1, vip: 2, super_vip: 3 }
    const limite = limites[perfil.plano] || 1
    
    if (stories.length >= limite) {
      setMensagem({ texto: `Você atingiu o limite de ${limite} story(s) do seu plano`, tipo: 'erro' })
      return
    }

    setUploadingStory(true)
    const ext = file.name.split('.').pop()
    const path = `stories/${perfil.id}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('fotos')
      .upload(path, file)

    if (upErr) {
      setMensagem({ texto: 'Erro no upload: ' + upErr.message, tipo: 'erro' })
      setUploadingStory(false)
      return
    }

    const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path)
    
    // Calcular expiração baseado no plano
    const horasExpiracao: {[key: string]: number} = { gratis: 4, vip: 24, super_vip: 168 } // 168 = 7 dias
    const horas = horasExpiracao[perfil.plano] || 4
    const expiraEm = new Date(Date.now() + horas * 60 * 60 * 1000).toISOString()

    const { data: storyData, error: storyErr } = await supabase
      .from('stories')
      .insert({
        acompanhante_id: perfil.id,
        url: urlData.publicUrl,
        tipo: file.type.startsWith('video/') ? 'video' : 'foto',
        expira_em: expiraEm,
      })
      .select()
      .single()

    setUploadingStory(false)

    if (storyErr) {
      setMensagem({ texto: 'Erro ao criar story: ' + storyErr.message, tipo: 'erro' })
    } else {
      setStories([storyData, ...stories])
      setMensagem({ texto: '✓ Story publicado!', tipo: 'sucesso' })
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 2000)
    }
  }

  async function removerStory(id: string) {
    if (!confirm('Remover este story?')) return
    await supabase.from('stories').update({ ativo: false }).eq('id', id)
    setStories(stories.filter(s => s.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (carregando) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5'}}>
        <Loader2 size={32} color={COR} style={{animation:'spin 1s linear infinite'}} />
      </div>
    )
  }

  if (!perfil) return null

  const stats = calcularEstatisticas(perfil.criado_em, perfil.visualizacoes)
  const limitesStory: {[key: string]: number} = { gratis: 1, vip: 2, super_vip: 3 }
  const limiteStory = limitesStory[perfil.plano] || 1

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: #f5f5f5; font-family: system-ui, -apple-system, sans-serif }
        @keyframes spin { to { transform: rotate(360deg) } }
        
        .header { background: ${COR}; padding: 16px; position: sticky; top: 0; z-index: 100 }
        .header-inner { max-width: 600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between }
        .header h1 { color: #fff; font-size: 18px; font-weight: 700 }
        .header-btns { display: flex; gap: 8px }
        .btn-header { background: rgba(255,255,255,.15); color: #fff; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px }
        .btn-header:hover { background: rgba(255,255,255,.25) }
        .btn-salvar { background: #fff !important; color: ${COR} !important }
        
        .container { max-width: 600px; margin: 0 auto; padding: 16px }
        
        .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px }
        .stat-card { background: #fff; border-radius: 10px; padding: 14px 10px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.06) }
        .stat-num { font-size: 20px; font-weight: 800; color: ${COR} }
        .stat-label { font-size: 10px; color: #888; text-transform: uppercase; margin-top: 2px }
        
        .section { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06) }
        .section-title { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 16px; display: flex; align-items: center; gap: 8px }
        
        .form-group { margin-bottom: 16px }
        .form-label { display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 6px }
        .form-input { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 15px; outline: none }
        .form-input:focus { border-color: ${COR} }
        .form-select { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 15px; background: #fff }
        .form-textarea { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 15px; resize: vertical; min-height: 100px }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
        
        .tags-title { font-size: 13px; font-weight: 700; color: ${COR}; margin: 16px 0 10px }
        .tags-grid { display: flex; flex-wrap: wrap; gap: 8px }
        .tag { padding: 8px 12px; border: 2px solid #e8e8e8; background: #fff; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all .15s }
        .tag:hover { border-color: ${COR}66 }
        .tag.ativo { background: ${COR}; border-color: ${COR}; color: #fff }
        
        .opcoes-row { display: flex; flex-wrap: wrap; gap: 8px }
        .opcao { padding: 10px 14px; border: 2px solid #e8e8e8; background: #fff; border-radius: 8px; font-size: 14px; cursor: pointer }
        .opcao:hover { border-color: ${COR}66 }
        .opcao.ativo { background: ${COR}; border-color: ${COR}; color: #fff }
        
        .switch-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f5f5f5 }
        .switch-label { font-size: 14px; color: #444 }
        .switch { width: 48px; height: 26px; background: #ddd; border-radius: 13px; position: relative; cursor: pointer }
        .switch.ativo { background: ${COR} }
        .switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: left .2s }
        .switch.ativo::after { left: 25px }
        
        .fotos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px }
        .foto-item { position: relative; aspect-ratio: 3/4; border-radius: 8px; overflow: hidden; background: #f0f0f0 }
        .foto-item img { width: 100%; height: 100%; object-fit: cover }
        .foto-item.capa { border: 3px solid ${COR} }
        .foto-badge { position: absolute; top: 4px; left: 4px; background: ${COR}; color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px }
        .foto-actions { position: absolute; bottom: 4px; right: 4px; display: flex; gap: 4px }
        .foto-btn { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center }
        .foto-btn.capa { background: #fff }
        .foto-btn.del { background: #c62828; color: #fff }
        .foto-add { aspect-ratio: 3/4; border: 2px dashed #ddd; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: #888; font-size: 12px }
        .foto-add:hover { border-color: ${COR}; color: ${COR} }
        
        .stories-row { display: flex; gap: 12px; overflow-x: auto; padding: 4px 0 }
        .story-item { flex-shrink: 0; width: 80px; height: 120px; border-radius: 10px; overflow: hidden; position: relative; background: #f0f0f0 }
        .story-item img { width: 100%; height: 100%; object-fit: cover }
        .story-del { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center }
        .story-exp { position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(0,0,0,.6); color: #fff; font-size: 9px; padding: 3px 6px; border-radius: 4px; text-align: center }
        .story-add { flex-shrink: 0; width: 80px; height: 120px; border: 2px dashed #ddd; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; color: #888; font-size: 11px }
        .story-add:hover { border-color: ${COR}; color: ${COR} }
        .story-limite { font-size: 11px; color: #888; margin-top: 8px }
        
        .plano-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: linear-gradient(135deg, #f8f8f8, #fff); border-radius: 12px; border: 1px solid #e8e8e8 }
        .plano-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px }
        .plano-gratis { background: #f5f5f5 }
        .plano-vip { background: linear-gradient(135deg, #666, #888) }
        .plano-super_vip { background: linear-gradient(135deg, #d4af37, #f5d070) }
        .plano-info { flex: 1 }
        .plano-nome { font-size: 16px; font-weight: 700; color: #333 }
        .plano-desc { font-size: 12px; color: #888 }
        .btn-upgrade { background: ${COR}; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer }
        
        .ver-perfil { display: block; text-align: center; background: #f0f0f0; color: #333; text-decoration: none; padding: 14px; border-radius: 10px; font-weight: 700; margin-top: 16px }
        .ver-perfil:hover { background: #e8e8e8 }
        
        .mensagem { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 1000; white-space: nowrap }
        .mensagem.erro { background: #c62828; color: #fff }
        .mensagem.sucesso { background: #2e7d32; color: #fff }
        
        .save-float { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e8e8e8; padding: 12px 16px; z-index: 99 }
        .save-float button { width: 100%; max-width: 600px; margin: 0 auto; display: flex; background: ${COR}; color: #fff; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; align-items: center; justify-content: center; gap: 8px }
        .save-float button:disabled { opacity: .6 }
      `}</style>

      <input type="file" ref={fotoInputRef} accept="image/*" style={{display:'none'}} onChange={uploadFoto} />
      <input type="file" ref={storyInputRef} accept="image/*,video/*" style={{display:'none'}} onChange={uploadStory} />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" style={{color:'#fff',textDecoration:'none',fontSize:'14px'}}>← Voltar</Link>
          <h1>Minha Conta</h1>
          <button className="btn-header" onClick={logout}><LogOut size={16} /></button>
        </div>
      </header>

      <div className="container" style={{paddingBottom:'100px'}}>
        
        {/* ESTATÍSTICAS */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-num">{stats.visualizacoes.toLocaleString()}</div>
            <div className="stat-label">Views</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.contatos.toLocaleString()}</div>
            <div className="stat-label">Contatos</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.favoritos}</div>
            <div className="stat-label">Favoritos</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.diasCadastro}</div>
            <div className="stat-label">Dias</div>
          </div>
        </div>

        {/* PLANO */}
        <div className="section">
          <div className="plano-card">
            <div className={`plano-icon plano-${perfil.plano}`}>
              {perfil.plano === 'super_vip' ? '👑' : perfil.plano === 'vip' ? '⭐' : '📋'}
            </div>
            <div className="plano-info">
              <div className="plano-nome">
                {perfil.plano === 'super_vip' ? 'Super VIP' : perfil.plano === 'vip' ? 'VIP' : 'Grátis'}
              </div>
              <div className="plano-desc">
                {perfil.plano === 'gratis' ? 'Destaque básico' : 'Destaque premium ativo'}
              </div>
            </div>
            {perfil.plano === 'gratis' && (
              <Link href="/planos" className="btn-upgrade">Upgrade</Link>
            )}
          </div>
        </div>

        {/* STORIES */}
        <div className="section">
          <h2 className="section-title"><Film size={18} /> Stories</h2>
          <div className="stories-row">
            {stories.map(s => (
              <div key={s.id} className="story-item">
                <img src={s.url} alt="" />
                <button className="story-del" onClick={() => removerStory(s.id)}><X size={12} /></button>
                <div className="story-exp">
                  {(() => {
                    const h = Math.floor((new Date(s.expira_em).getTime() - Date.now()) / 3600000)
                    return h > 24 ? `${Math.floor(h/24)}d` : `${h}h`
                  })()}
                </div>
              </div>
            ))}
            {stories.length < limiteStory && (
              <div className="story-add" onClick={() => storyInputRef.current?.click()}>
                {uploadingStory ? <Loader2 size={20} style={{animation:'spin 1s linear infinite'}} /> : <Plus size={20} />}
                <span>Adicionar</span>
              </div>
            )}
          </div>
          <p className="story-limite">
            {stories.length}/{limiteStory} stories • 
            {perfil.plano === 'gratis' ? ' Dura 4h' : perfil.plano === 'vip' ? ' Dura 24h' : ' Dura 7 dias'}
          </p>
        </div>

        {/* FOTOS */}
        <div className="section">
          <h2 className="section-title"><Camera size={18} /> Fotos</h2>
          <div className="fotos-grid">
            {perfil.fotos?.map((url: string, i: number) => (
              <div key={i} className={`foto-item ${perfil.foto_capa === url ? 'capa' : ''}`}>
                <img src={url} alt="" />
                {perfil.foto_capa === url && <span className="foto-badge">CAPA</span>}
                <div className="foto-actions">
                  {perfil.foto_capa !== url && (
                    <button className="foto-btn capa" onClick={() => definirCapa(url)} title="Definir como capa">
                      <Crown size={12} color={COR} />
                    </button>
                  )}
                  <button className="foto-btn del" onClick={() => removerFoto(url)} title="Remover">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
            <div className="foto-add" onClick={() => fotoInputRef.current?.click()}>
              {uploadingFoto ? <Loader2 size={24} style={{animation:'spin 1s linear infinite'}} /> : <Plus size={24} />}
              <span>Adicionar foto</span>
            </div>
          </div>
        </div>

        {/* DADOS BÁSICOS */}
        <div className="section">
          <h2 className="section-title"><User size={18} /> Dados Básicos</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome artístico</label>
              <input className="form-input" placeholder="Seu nome" value={perfil.nome || ''} onChange={e => set('nome', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Idade</label>
              <input className="form-input" type="number" min={18} placeholder="25" value={perfil.idade || ''} onChange={e => set('idade', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-select" value={perfil.estado || ''} onChange={e => set('estado', e.target.value)}>
                <option value="">Selecione</option>
                {Object.entries(ESTADOS_BR).sort((a,b) => a[1].localeCompare(b[1])).map(([uf, nome]) => (
                  <option key={uf} value={uf}>{nome}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input className="form-input" placeholder="Sua cidade" value={perfil.cidade || ''} onChange={e => set('cidade', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bairro</label>
            <input className="form-input" placeholder="Seu bairro" value={perfil.bairro || ''} onChange={e => set('bairro', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Sobre você</label>
            <textarea className="form-textarea" placeholder="Fale sobre você..." value={perfil.descricao || ''} onChange={e => set('descricao', e.target.value)} />
          </div>

          <h3 className="tags-title">Sobre mim</h3>
          <div className="tags-grid">
            {OPCOES_SOBRE_MIM.map(t => (
              <button key={t} className={`tag ${perfil.sobre_mim?.includes(t) ? 'ativo' : ''}`} onClick={() => toggleArray('sobre_mim', t)}>{t}</button>
            ))}
          </div>

          <h3 className="tags-title">Atendo</h3>
          <div className="tags-grid">
            {OPCOES_ATENDIMENTO.map(t => (
              <button key={t} className={`tag ${perfil.atendimento?.includes(t) ? 'ativo' : ''}`} onClick={() => toggleArray('atendimento', t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* APARÊNCIA */}
        <div className="section">
          <h2 className="section-title"><Sparkles size={18} /> Aparência</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Altura</label>
              <input className="form-input" placeholder="1,65m" value={perfil.altura || ''} onChange={e => set('altura', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Peso</label>
              <input className="form-input" placeholder="55kg" value={perfil.peso || ''} onChange={e => set('peso', e.target.value)} />
            </div>
          </div>

          <h3 className="tags-title">Etnia</h3>
          <div className="opcoes-row">
            {OPCOES_ETNIA.map(o => (
              <button key={o} className={`opcao ${perfil.etnia === o ? 'ativo' : ''}`} onClick={() => set('etnia', o)}>{o}</button>
            ))}
          </div>

          <h3 className="tags-title">Cabelo</h3>
          <div className="opcoes-row">
            {OPCOES_CABELO.map(o => (
              <button key={o} className={`opcao ${perfil.cabelo === o ? 'ativo' : ''}`} onClick={() => set('cabelo', o)}>{o}</button>
            ))}
          </div>

          <h3 className="tags-title">Olhos</h3>
          <div className="opcoes-row">
            {OPCOES_OLHOS.map(o => (
              <button key={o} className={`opcao ${perfil.olhos === o ? 'ativo' : ''}`} onClick={() => set('olhos', o)}>{o}</button>
            ))}
          </div>

          <h3 className="tags-title">Corpo</h3>
          <div className="opcoes-row">
            {OPCOES_CORPO.map(o => (
              <button key={o} className={`opcao ${perfil.corpo === o ? 'ativo' : ''}`} onClick={() => set('corpo', o)}>{o}</button>
            ))}
          </div>

          <h3 className="tags-title">Seios</h3>
          <div className="opcoes-row">
            {OPCOES_SEIOS.map(o => (
              <button key={o} className={`opcao ${perfil.seios === o ? 'ativo' : ''}`} onClick={() => set('seios', o)}>{o}</button>
            ))}
          </div>

          <h3 className="tags-title">Púbis</h3>
          <div className="opcoes-row">
            {OPCOES_PUBIS.map(o => (
              <button key={o} className={`opcao ${perfil.pubis === o ? 'ativo' : ''}`} onClick={() => set('pubis', o)}>{o}</button>
            ))}
          </div>
        </div>

        {/* SERVIÇOS */}
        <div className="section">
          <h2 className="section-title"><Heart size={18} /> Serviços</h2>
          
          <h3 className="tags-title">Serviços Gerais</h3>
          <div className="tags-grid">
            {OPCOES_SERVICOS_GERAIS.map(t => (
              <button key={t} className={`tag ${perfil.servicos?.includes(t) ? 'ativo' : ''}`} onClick={() => toggleArray('servicos', t)}>{t}</button>
            ))}
          </div>

          <h3 className="tags-title">Serviços Especiais</h3>
          <div className="tags-grid">
            {OPCOES_SERVICOS_ESPECIAIS.map(t => (
              <button key={t} className={`tag ${perfil.servicos?.includes(t) ? 'ativo' : ''}`} onClick={() => toggleArray('servicos', t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* LOCAIS */}
        <div className="section">
          <h2 className="section-title"><MapPin size={18} /> Locais de Atendimento</h2>
          
          <div className="tags-grid">
            {OPCOES_LOCAIS.map(t => (
              <button key={t} className={`tag ${perfil.locais?.includes(t) ? 'ativo' : ''}`} onClick={() => toggleArray('locais', t)}>{t}</button>
            ))}
          </div>

          <div className="switch-row" style={{marginTop:'16px'}}>
            <span className="switch-label">Tenho local próprio</span>
            <div className={`switch ${perfil.tem_local ? 'ativo' : ''}`} onClick={() => set('tem_local', !perfil.tem_local)} />
          </div>

          {perfil.tem_local && (
            <div className="form-group" style={{marginTop:'12px'}}>
              <label className="form-label">Região do local</label>
              <input className="form-input" placeholder="Ex: Copacabana" value={perfil.endereco_local || ''} onChange={e => set('endereco_local', e.target.value)} />
            </div>
          )}
        </div>

        {/* VALORES */}
        <div className="section">
          <h2 className="section-title"><DollarSign size={18} /> Valores</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">1 hora</label>
              <input className="form-input" placeholder="R$ 300" value={perfil.valor_hora || ''} onChange={e => set('valor_hora', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">30 min</label>
              <input className="form-input" placeholder="R$ 200" value={perfil.valor_meia_hora || ''} onChange={e => set('valor_meia_hora', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Pernoite</label>
              <input className="form-input" placeholder="R$ 1.500" value={perfil.valor_pernoite || ''} onChange={e => set('valor_pernoite', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Viagem</label>
              <input className="form-input" placeholder="R$ 3.000" value={perfil.valor_viagem || ''} onChange={e => set('valor_viagem', e.target.value)} />
            </div>
          </div>

          <div className="switch-row">
            <span className="switch-label">Atendo 24 horas</span>
            <div className={`switch ${perfil.atende_24h ? 'ativo' : ''}`} onClick={() => set('atende_24h', !perfil.atende_24h)} />
          </div>

          {!perfil.atende_24h && (
            <div className="form-row" style={{marginTop:'12px'}}>
              <div className="form-group">
                <label className="form-label">Das</label>
                <input className="form-input" type="time" value={perfil.horario_inicio || ''} onChange={e => set('horario_inicio', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Até</label>
                <input className="form-input" type="time" value={perfil.horario_fim || ''} onChange={e => set('horario_fim', e.target.value)} />
              </div>
            </div>
          )}

          <h3 className="tags-title">Formas de Pagamento</h3>
          <div className="tags-grid">
            {OPCOES_PAGAMENTO.map(t => (
              <button key={t} className={`tag ${perfil.pagamentos?.includes(t) ? 'ativo' : ''}`} onClick={() => toggleArray('pagamentos', t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* CONTATO */}
        <div className="section">
          <h2 className="section-title"><Phone size={18} /> Contato</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" placeholder="(11) 99999-9999" value={perfil.telefone || ''} onChange={e => set('telefone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input className="form-input" placeholder="(11) 99999-9999" value={perfil.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} />
            </div>
          </div>

          <h3 className="tags-title">Idiomas</h3>
          <div className="tags-grid">
            {OPCOES_IDIOMAS.map(t => (
              <button key={t} className={`tag ${perfil.idiomas?.includes(t) ? 'ativo' : ''}`} onClick={() => toggleArray('idiomas', t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* VER PERFIL */}
        <Link href={`/acompanhante/${perfil.slug}/`} className="ver-perfil">
          <Eye size={16} style={{verticalAlign:'middle',marginRight:'8px'}} />
          Ver meu perfil público
        </Link>

      </div>

      {/* BOTÃO SALVAR FIXO */}
      <div className="save-float">
        <button onClick={salvar} disabled={salvando}>
          {salvando ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}} /> : <Save size={18} />}
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {/* MENSAGEM */}
      {mensagem.texto && (
        <div className={`mensagem ${mensagem.tipo}`}>{mensagem.texto}</div>
      )}
    </>
  )
}
