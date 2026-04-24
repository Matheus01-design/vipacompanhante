'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin, Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight,
  Clock, DollarSign, Star, Calendar, Camera, X, Check,
  Users, Globe, CreditCard, Flag, AlertTriangle, CheckCircle
} from 'lucide-react'

const COR = '#8B0000'

const MOTIVOS_DENUNCIA = [
  'Fotos falsas ou roubadas',
  'Perfil de menor de idade',
  'Golpe ou fraude',
  'Perfil duplicado',
  'Informações falsas',
  'Spam ou propaganda',
  'Conteúdo ofensivo',
  'Outro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  perfilInicial: any
}

export default function PerfilCliente({ perfilInicial }: Props) {
  const perfil = perfilInicial

  const [fotoAtual, setFotoAtual] = useState(0)
  const [mostrarGaleria, setMostrarGaleria] = useState(false)
  const [favoritado, setFavoritado] = useState(false)
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [mediaAvaliacao, setMediaAvaliacao] = useState(0)
  const [disponibilidade, setDisponibilidade] = useState<any[]>([])

  const [modalDenuncia, setModalDenuncia] = useState(false)
  const [motivoDenuncia, setMotivoDenuncia] = useState('')
  const [descricaoDenuncia, setDescricaoDenuncia] = useState('')
  const [emailDenuncia, setEmailDenuncia] = useState('')
  const [enviandoDenuncia, setEnviandoDenuncia] = useState(false)
  const [denunciaEnviada, setDenunciaEnviada] = useState(false)
  const [erroDenuncia, setErroDenuncia] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (!perfil?.id) return

    // Incrementa visualização (não crítico)
    supabase.rpc('incrementar_visualizacao', { p_acompanhante_id: perfil.id }).then(() => {}, () => {})

    // Carrega avaliações
    supabase
      .from('avaliacoes')
      .select('*')
      .eq('acompanhante_id', perfil.id)
      .eq('status', 'aprovado')
      .order('criado_em', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAvaliacoes(data)
          const media = data.reduce((acc, a) => acc + a.nota, 0) / data.length
          setMediaAvaliacao(media)
        }
      }, () => {})

    // Carrega disponibilidade
    supabase
      .from('disponibilidade')
      .select('*')
      .eq('acompanhante_id', perfil.id)
      .eq('ativo', true)
      .then(({ data }) => { if (data) setDisponibilidade(data) }, () => {})

    // Verifica favorito
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('favoritos')
        .select('id')
        .eq('user_id', user.id)
        .eq('acompanhante_id', perfil.id)
        .single()
        .then(({ data }) => setFavoritado(!!data), () => {})
    }, () => {})
  }, [perfil?.id, supabase])

  async function toggleFavorito() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Faça login para favoritar')
        return
      }
      if (favoritado) {
        await supabase.from('favoritos').delete().eq('user_id', user.id).eq('acompanhante_id', perfil.id)
        setFavoritado(false)
      } else {
        await supabase.from('favoritos').insert({ user_id: user.id, acompanhante_id: perfil.id })
        setFavoritado(true)
      }
    } catch (e) {
      console.error('Erro ao favoritar:', e)
    }
  }

  async function registrarContato() {
    try {
      await supabase
        .from('acompanhantes')
        .update({ contatos_whatsapp: (perfil?.contatos_whatsapp || 0) + 1 })
        .eq('id', perfil?.id)
    } catch (e) {}
  }

  const compartilhar = () => {
    if (typeof window === 'undefined') return
    try {
      if (navigator.share) {
        navigator.share({
          title: perfil?.nome || 'VipAcompanhante',
          text: `Confira o perfil de ${perfil?.nome || ''}`,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copiado!')
      }
    } catch (e) {
      console.error('Erro ao compartilhar:', e)
    }
  }

  const enviarDenuncia = async () => {
    if (!motivoDenuncia) { setErroDenuncia('Selecione um motivo'); return }
    setEnviandoDenuncia(true)
    setErroDenuncia('')
    try {
      const res = await fetch('/api/denuncia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acompanhante_id: perfil?.id,
          motivo: motivoDenuncia,
          descricao: descricaoDenuncia,
          email: emailDenuncia
        })
      })
      if (res.ok) setDenunciaEnviada(true)
      else setErroDenuncia('Erro ao enviar. Tente novamente.')
    } catch (e) {
      setErroDenuncia('Erro de conexão.')
    }
    setEnviandoDenuncia(false)
  }

  const fecharModalDenuncia = () => {
    setModalDenuncia(false)
    setMotivoDenuncia('')
    setDescricaoDenuncia('')
    setEmailDenuncia('')
    setDenunciaEnviada(false)
    setErroDenuncia('')
  }

  const fotos = [perfil.foto_capa, ...(perfil.fotos || [])].filter(Boolean)
  const diasAnunciada = perfil?.criado_em
    ? Math.max(0, Math.floor((Date.now() - new Date(perfil.criado_em).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: #f5f5f5; font-family: system-ui, -apple-system, sans-serif }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 16px }
        .header { background: ${COR}; padding: 12px 0; position: sticky; top: 0; z-index: 100 }
        .header-content { display: flex; align-items: center; justify-content: space-between }
        .header a { color: #fff; text-decoration: none; font-weight: 800; font-size: 20px }
        .back-btn { color: #fff; text-decoration: none; display: flex; align-items: center; gap: 4px; font-size: 14px }
        .perfil-grid { display: grid; grid-template-columns: 1fr; gap: 20px; padding: 20px 0 }
        @media(min-width: 900px) { .perfil-grid { grid-template-columns: 2fr 1fr } }
        .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08) }
        .card-header { padding: 16px; border-bottom: 1px solid #f0f0f0; font-weight: 700; font-size: 16px; color: #333; display: flex; align-items: center; gap: 8px }
        .card-body { padding: 16px }
        .galeria { position: relative; aspect-ratio: 3/4; background: #111; cursor: pointer }
        .galeria img { width: 100%; height: 100%; object-fit: cover }
        .galeria-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.5); color: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center }
        .galeria-nav.prev { left: 10px }
        .galeria-nav.next { right: 10px }
        .galeria-dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px }
        .galeria-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.5) }
        .galeria-dot.ativo { background: #fff }
        .galeria-count { position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,.6); color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 13px; display: flex; align-items: center; gap: 6px }
        .badges { position: absolute; top: 16px; left: 16px; display: flex; flex-direction: column; gap: 6px }
        .badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700 }
        .badge-svip { background: linear-gradient(135deg, #d4af37, #f5d070); color: #000 }
        .badge-vip { background: #666; color: #fff }
        .badge-verificado { background: #4caf50; color: #fff; display: flex; align-items: center; gap: 4px }
        .info-header { padding: 20px }
        .nome { font-size: 24px; font-weight: 800; color: #222; margin-bottom: 4px }
        .local { color: #666; font-size: 14px; display: flex; align-items: center; gap: 4px; margin-bottom: 12px }
        .acoes { display: flex; gap: 10px; flex-wrap: wrap }
        .btn { padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; text-decoration: none; border: none }
        .btn-whatsapp { background: #25d366; color: #fff; flex: 1 }
        .btn-whatsapp:hover { background: #1da851 }
        .btn-telefone { background: #f5f5f5; color: #333; border: 1px solid #ddd }
        .btn-icon { background: #f5f5f5; color: #333; border: 1px solid #ddd; padding: 12px }
        .btn-icon.ativo { background: #fef2f2; color: ${COR}; border-color: ${COR} }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #f0f0f0 }
        .stat-item { background: #fff; padding: 16px; text-align: center }
        .stat-value { font-size: 24px; font-weight: 800; color: ${COR} }
        .stat-label { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 4px }
        .tags { display: flex; flex-wrap: wrap; gap: 8px }
        .tag { background: #f0f0f0; padding: 6px 12px; border-radius: 20px; font-size: 13px; color: #555 }
        .precos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px }
        .preco-item { background: #f8f8f8; padding: 14px; border-radius: 8px; text-align: center }
        .preco-valor { font-size: 18px; font-weight: 800; color: ${COR} }
        .preco-label { font-size: 12px; color: #888; margin-top: 4px }
        .caracteristicas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px }
        .caract-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0 }
        .caract-label { color: #888; font-size: 13px }
        .caract-valor { color: #333; font-size: 13px; font-weight: 600 }
        .agenda-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center }
        .agenda-dia { padding: 8px 4px; border-radius: 6px; font-size: 11px }
        .agenda-dia.ativo { background: #e8f5e9; color: #2e7d32 }
        .agenda-dia.inativo { background: #f5f5f5; color: #bbb }
        .agenda-hora { font-size: 10px; margin-top: 2px }
        .avaliacao { padding: 16px 0; border-bottom: 1px solid #f0f0f0 }
        .avaliacao:last-child { border-bottom: none }
        .avaliacao-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px }
        .avaliacao-nome { font-weight: 600; color: #333 }
        .avaliacao-estrelas { color: #f5a623; display: flex; gap: 2px }
        .avaliacao-texto { color: #666; font-size: 14px; line-height: 1.5 }
        .avaliacao-data { color: #aaa; font-size: 12px; margin-top: 8px }
        .mapa-container { height: 250px; border-radius: 8px; overflow: hidden; background: #e0e0e0 }
        .mapa-container iframe { width: 100%; height: 100%; border: none }
        .mapa-endereco { margin-top: 12px; display: flex; align-items: center; gap: 8px; color: #555; font-size: 14px }
        .galeria-modal { position: fixed; inset: 0; background: rgba(0,0,0,.95); z-index: 1000; display: flex; align-items: center; justify-content: center }
        .galeria-modal img { max-width: 90vw; max-height: 90vh; object-fit: contain }
        .galeria-modal-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; cursor: pointer }
        .descricao { color: #444; font-size: 15px; line-height: 1.7; white-space: pre-wrap }
        .sidebar { display: flex; flex-direction: column; gap: 20px }
        @media(max-width: 600px) {
          .precos-grid { grid-template-columns: 1fr }
          .caracteristicas { grid-template-columns: 1fr }
        }
      `}</style>

      <header className="header">
        <div className="container header-content">
          <Link href="/" className="back-btn">
            <ChevronLeft size={20} /> Voltar
          </Link>
          <Link href="/">VipAcompanhante</Link>
          <div style={{ width: '60px' }} />
        </div>
      </header>

      <div className="container">
        <div className="perfil-grid">
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="galeria" onClick={() => setMostrarGaleria(true)}>
                {fotos[fotoAtual] && <img src={fotos[fotoAtual]} alt={perfil.nome} />}
                <div className="badges">
                  {perfil.plano === 'super_vip' && <span className="badge badge-svip">★ SUPER VIP</span>}
                  {perfil.plano === 'vip' && <span className="badge badge-vip">◆ VIP</span>}
                  {perfil.verificado && <span className="badge badge-verificado"><Check size={12} /> Verificada</span>}
                </div>
                <div className="galeria-count">
                  <Camera size={14} /> {fotoAtual + 1}/{fotos.length}
                </div>
                {fotos.length > 1 && (
                  <>
                    <button className="galeria-nav prev" onClick={(e) => { e.stopPropagation(); setFotoAtual(f => f > 0 ? f - 1 : fotos.length - 1) }}>
                      <ChevronLeft size={20} />
                    </button>
                    <button className="galeria-nav next" onClick={(e) => { e.stopPropagation(); setFotoAtual(f => f < fotos.length - 1 ? f + 1 : 0) }}>
                      <ChevronRight size={20} />
                    </button>
                    <div className="galeria-dots">
                      {fotos.slice(0, 8).map((_, i) => (
                        <div key={i} className={`galeria-dot ${i === fotoAtual ? 'ativo' : ''}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="info-header">
                <h1 className="nome">{perfil.nome}{perfil.idade ? `, ${perfil.idade} anos` : ''}</h1>
                <p className="local">
                  <MapPin size={14} />
                  {perfil.bairro && `${perfil.bairro}, `}{perfil.cidade} - {perfil.estado}
                </p>
                <div className="acoes">
                  <a
                    href={`https://wa.me/55${perfil.whatsapp || perfil.telefone?.replace(/\D/g, '')}?text=Olá ${perfil.nome}, vi seu anúncio no VipAcompanhante!`}
                    target="_blank"
                    className="btn btn-whatsapp"
                    onClick={registrarContato}
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                  <a href={`tel:${perfil.telefone}`} className="btn btn-telefone">
                    <Phone size={18} /> Ligar
                  </a>
                  <button className={`btn btn-icon ${favoritado ? 'ativo' : ''}`} onClick={toggleFavorito}>
                    <Heart size={18} fill={favoritado ? COR : 'none'} />
                  </button>
                  <button className="btn btn-icon" onClick={compartilhar}>
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {perfil.descricao && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">📝 Sobre mim</div>
                <div className="card-body">
                  <p className="descricao">{perfil.descricao}</p>
                </div>
              </div>
            )}

            {perfil.sobre_mim?.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">✨ Características</div>
                <div className="card-body">
                  <div className="tags">
                    {perfil.sobre_mim.map((tag: string, i: number) => <span key={i} className="tag">{tag}</span>)}
                  </div>
                </div>
              </div>
            )}

            {perfil.servicos?.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">💋 Meus serviços</div>
                <div className="card-body">
                  <div className="tags">
                    {perfil.servicos.map((s: string, i: number) => <span key={i} className="tag">{s}</span>)}
                  </div>
                </div>
              </div>
            )}

            {perfil.locais?.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">📍 Lugar de encontro</div>
                <div className="card-body">
                  <div className="tags">
                    {perfil.locais.map((l: string, i: number) => <span key={i} className="tag">{l}</span>)}
                  </div>
                </div>
              </div>
            )}

            {perfil.atendimento?.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header"><Users size={18} /> Atendo</div>
                <div className="card-body">
                  <div className="tags">
                    {perfil.atendimento.map((a: string, i: number) => (
                      <span key={i} className="tag">{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {perfil.latitude && perfil.longitude && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header"><MapPin size={18} /> Localização</div>
                <div className="card-body">
                  <div className="mapa-container">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${perfil.longitude - 0.01},${perfil.latitude - 0.01},${perfil.longitude + 0.01},${perfil.latitude + 0.01}&layer=mapnik&marker=${perfil.latitude},${perfil.longitude}`}
                      loading="lazy"
                    />
                  </div>
                  <p className="mapa-endereco">
                    <MapPin size={14} />
                    {perfil.bairro && `${perfil.bairro}, `}{perfil.cidade}, {perfil.estado}
                  </p>
                </div>
              </div>
            )}

            {avaliacoes.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <Star size={18} fill="#f5a623" color="#f5a623" />
                  Avaliações ({avaliacoes.length})
                  <span style={{ marginLeft: 'auto', color: '#f5a623', fontWeight: 800 }}>{mediaAvaliacao.toFixed(1)}</span>
                </div>
                <div className="card-body">
                  {avaliacoes.map((av, i) => (
                    <div key={i} className="avaliacao">
                      <div className="avaliacao-header">
                        <span className="avaliacao-nome">{av.cliente_nome || 'Anônimo'}</span>
                        <div className="avaliacao-estrelas">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={14} fill={n <= av.nota ? '#f5a623' : 'none'} color="#f5a623" />
                          ))}
                        </div>
                      </div>
                      {av.comentario && <p className="avaliacao-texto">{av.comentario}</p>}
                      <p className="avaliacao-data">{new Date(av.criado_em).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sidebar">
            <div className="card">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{diasAnunciada}</div>
                  <div className="stat-label">Dias anunciada</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{perfil.visualizacoes || 0}</div>
                  <div className="stat-label">Visualizações</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{fotos.length}</div>
                  <div className="stat-label">Fotos</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><DollarSign size={18} /> Valores</div>
              <div className="card-body">
                <div className="precos-grid">
                  {(perfil.preco || perfil.valor_hora) && (
                    <div className="preco-item">
                      <div className="preco-valor">{perfil.valor_hora || perfil.preco}</div>
                      <div className="preco-label">1 hora</div>
                    </div>
                  )}
                  {perfil.valor_meia_hora && (
                    <div className="preco-item">
                      <div className="preco-valor">{perfil.valor_meia_hora}</div>
                      <div className="preco-label">30 min</div>
                    </div>
                  )}
                  {perfil.valor_pernoite && (
                    <div className="preco-item">
                      <div className="preco-valor">{perfil.valor_pernoite}</div>
                      <div className="preco-label">Pernoite</div>
                    </div>
                  )}
                  {perfil.valor_viagem && (
                    <div className="preco-item">
                      <div className="preco-valor">{perfil.valor_viagem}</div>
                      <div className="preco-label">Viagem</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">📋 Características</div>
              <div className="card-body">
                <div className="caracteristicas">
                  {perfil.altura && <div className="caract-item"><span className="caract-label">Altura</span><span className="caract-valor">{perfil.altura}</span></div>}
                  {perfil.peso && <div className="caract-item"><span className="caract-label">Peso</span><span className="caract-valor">{perfil.peso}</span></div>}
                  {perfil.etnia && <div className="caract-item"><span className="caract-label">Etnia</span><span className="caract-valor">{perfil.etnia}</span></div>}
                  {perfil.cabelo && <div className="caract-item"><span className="caract-label">Cabelo</span><span className="caract-valor">{perfil.cabelo}</span></div>}
                  {perfil.olhos && <div className="caract-item"><span className="caract-label">Olhos</span><span className="caract-valor">{perfil.olhos}</span></div>}
                  {perfil.corpo && <div className="caract-item"><span className="caract-label">Corpo</span><span className="caract-valor">{perfil.corpo}</span></div>}
                  {perfil.seios && <div className="caract-item"><span className="caract-label">Seios</span><span className="caract-valor">{perfil.seios}</span></div>}
                  {perfil.pubis && <div className="caract-item"><span className="caract-label">Púbis</span><span className="caract-valor">{perfil.pubis}</span></div>}
                </div>
              </div>
            </div>

            {(perfil.atende_24h || perfil.horario_inicio) && (
              <div className="card">
                <div className="card-header"><Clock size={18} /> Horário</div>
                <div className="card-body">
                  {perfil.atende_24h
                    ? <p style={{ color: '#2e7d32', fontWeight: 600 }}>✓ Atende 24 horas</p>
                    : <p style={{ color: '#555' }}>{perfil.horario_inicio} às {perfil.horario_fim}</p>
                  }
                </div>
              </div>
            )}

            {disponibilidade.length > 0 && (
              <div className="card">
                <div className="card-header"><Calendar size={18} /> Disponibilidade</div>
                <div className="card-body">
                  <div className="agenda-grid">
                    {[0, 1, 2, 3, 4, 5, 6].map(dia => {
                      const disp = disponibilidade.find(d => d.dia_semana === dia)
                      return (
                        <div key={dia} className={`agenda-dia ${disp ? 'ativo' : 'inativo'}`}>
                          <div>{DIAS_SEMANA[dia]}</div>
                          {disp && <div className="agenda-hora">{disp.hora_inicio?.slice(0, 5)}</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {perfil.pagamentos?.length > 0 && (
              <div className="card">
                <div className="card-header"><CreditCard size={18} /> Pagamento</div>
                <div className="card-body">
                  <div className="tags">{perfil.pagamentos.map((p: string, i: number) => <span key={i} className="tag">{p}</span>)}</div>
                </div>
              </div>
            )}

            {perfil.idiomas?.length > 0 && (
              <div className="card">
                <div className="card-header"><Globe size={18} /> Idiomas</div>
                <div className="card-body">
                  <div className="tags">{perfil.idiomas.map((i: string, idx: number) => <span key={idx} className="tag">{i}</span>)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarGaleria && (
        <div className="galeria-modal" onClick={() => setMostrarGaleria(false)}>
          <button className="galeria-modal-close"><X size={32} /></button>
          <img src={fotos[fotoAtual]} alt={perfil.nome} onClick={e => e.stopPropagation()} />
          {fotos.length > 1 && (
            <>
              <button className="galeria-nav prev" style={{ left: '20px' }} onClick={(e) => { e.stopPropagation(); setFotoAtual(f => f > 0 ? f - 1 : fotos.length - 1) }}>
                <ChevronLeft size={24} />
              </button>
              <button className="galeria-nav next" style={{ right: '20px' }} onClick={(e) => { e.stopPropagation(); setFotoAtual(f => f < fotos.length - 1 ? f + 1 : 0) }}>
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}

      <div className="container" style={{ paddingBottom: '40px' }}>
        <button
          onClick={() => setModalDenuncia(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1px solid #ddd',
            padding: '10px 16px', borderRadius: '6px',
            color: '#888', fontSize: '13px', cursor: 'pointer',
            width: '100%', maxWidth: '300px',
            justifyContent: 'center', margin: '0 auto'
          }}
        >
          <Flag size={14} /> Denunciar anúncio
        </button>
      </div>

      {modalDenuncia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color={COR} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#222' }}>Denunciar Anúncio</h3>
              </div>
              <button onClick={fecharModalDenuncia} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#888" />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {denunciaEnviada ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle size={48} color="#00b450" style={{ marginBottom: '12px' }} />
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#222', marginBottom: '8px' }}>Denúncia Enviada!</h4>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Obrigado por ajudar a manter nossa plataforma segura.</p>
                  <button onClick={fecharModalDenuncia} style={{ background: COR, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Fechar</button>
                </div>
              ) : (
                <>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>Denunciando: <strong>{perfil.nome}</strong></p>
                  <label style={{ display: 'block', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Motivo da denúncia *</span>
                    <select value={motivoDenuncia} onChange={e => setMotivoDenuncia(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', color: '#333', background: '#fff' }}>
                      <option value="">Selecione...</option>
                      {MOTIVOS_DENUNCIA.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'block', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Detalhes (opcional)</span>
                    <textarea value={descricaoDenuncia} onChange={e => setDescricaoDenuncia(e.target.value)} placeholder="Descreva o problema..." rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', color: '#333', resize: 'vertical' }} />
                  </label>
                  <label style={{ display: 'block', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Seu email (opcional)</span>
                    <input type="email" value={emailDenuncia} onChange={e => setEmailDenuncia(e.target.value)} placeholder="Para retorno" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', color: '#333' }} />
                  </label>
                  {erroDenuncia && <p style={{ color: '#d32f2f', fontSize: '13px', marginBottom: '12px' }}>{erroDenuncia}</p>}
                  <button onClick={enviarDenuncia} disabled={enviandoDenuncia} style={{ width: '100%', background: COR, color: '#fff', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: enviandoDenuncia ? 'wait' : 'pointer', opacity: enviandoDenuncia ? 0.7 : 1 }}>
                    {enviandoDenuncia ? 'Enviando...' : 'Enviar Denúncia'}
                  </button>
                  <p style={{ color: '#999', fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>Denúncias falsas podem resultar em bloqueio.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
