'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, CheckCircle, XCircle, AlertTriangle, BarChart2, Search, LogOut, Eye, Crown, RefreshCw, Edit2, Key, Trash2, Star, MessageCircleHeart, Settings, Save, Flag, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Aba = 'dashboard' | 'pendentes' | 'ativos' | 'suspensos' | 'denuncias' | 'usuarios' | 'pagamentos' | 'luna' | 'luna-config'

const ADMIN_SUPREMO = 'escritoriotaquara83@gmail.com'

export default function AdminPage() {
  const [aba, setAba] = useState<Aba>('dashboard')
  const [perfis, setPerfis] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [denuncias, setDenuncias] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [lunaStats, setLunaStats] = useState<any>({})
  const [lunaHistorico, setLunaHistorico] = useState<any[]>([])
  const [lunaConfig, setLunaConfig] = useState<any>({})
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos'|'cliente'|'acompanhante'|'admin'>('todos')
  const [filtroDenuncia, setFiltroDenuncia] = useState<'pendente'|'analisando'|'resolvida'|'ignorada'>('pendente')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [meuEmail, setMeuEmail] = useState('')
  const [editandoUsuario, setEditandoUsuario] = useState<any>(null)
  const [denunciaSelecionada, setDenunciaSelecionada] = useState<any>(null)
  const [respostaDenuncia, setRespostaDenuncia] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeuEmail(data.user?.email || ''))
    carregar()
  }, [aba, filtroDenuncia])

  const isSupremo = meuEmail === ADMIN_SUPREMO

  async function carregar() {
    setCarregando(true)

    if (aba === 'dashboard') {
      const [{ count: total }, { count: ativos }, { count: pendentes }, { count: suspensos }, { count: vip }, { count: totalUsuarios }, { count: clientes }, { count: denunciasPendentes }] = await Promise.all([
        supabase.from('acompanhantes').select('*', { count: 'exact', head: true }),
        supabase.from('acompanhantes').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('acompanhantes').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('acompanhantes').select('*', { count: 'exact', head: true }).eq('status', 'suspenso'),
        supabase.from('acompanhantes').select('*', { count: 'exact', head: true }).in('plano', ['vip', 'super_vip']),
        supabase.from('admin_usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('admin_usuarios').select('*', { count: 'exact', head: true }).eq('tipo', 'cliente'),
        supabase.from('denuncias').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
      ])
      setStats({ total, ativos, pendentes, suspensos, vip, totalUsuarios, clientes, denunciasPendentes })
      
      const { data: lunaData } = await supabase.from('luna_stats').select('*').single()
      setLunaStats(lunaData || {})
    }

    if (aba === 'denuncias') {
      const { data } = await supabase
        .from('denuncias')
        .select(`
          *,
          acompanhante:acompanhantes(id, nome, slug, foto_capa, cidade, estado)
        `)
        .eq('status', filtroDenuncia)
        .order('criado_em', { ascending: false })
        .limit(50)
      setDenuncias(data || [])
    }

    if (aba === 'luna') {
      const { data: statsData } = await supabase.from('luna_stats').select('*').single()
      setLunaStats(statsData || {})
      
      const { data: historico } = await supabase
        .from('luna_metricas')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(100)
      setLunaHistorico(historico || [])
    }

    if (aba === 'luna-config') {
      const { data: configData } = await supabase.from('luna_config').select('*').limit(1).single()
      setLunaConfig(configData || {
        foto_url: '',
        nome: 'Luna',
        emoji: '😈',
        cor_primaria: '#ff6b6b',
        cor_fundo: '#1a0a0a',
        temperamento: 'sensual',
        prompt_personalizado: '',
        temperatura: 0.95,
        ativo: true
      })
    }

    if (aba === 'pendentes') {
      const { data } = await supabase.from('acompanhantes').select('*').eq('status', 'pendente').order('criado_em', { ascending: false })
      setPerfis(data || [])
    }
    if (aba === 'ativos') {
      const { data } = await supabase.from('acompanhantes').select('*').eq('status', 'ativo').order('criado_em', { ascending: false }).limit(100)
      setPerfis(data || [])
    }
    if (aba === 'suspensos') {
      const { data } = await supabase.from('acompanhantes').select('*').eq('status', 'suspenso').order('criado_em', { ascending: false }).limit(100)
      setPerfis(data || [])
    }
    if (aba === 'usuarios') {
      const { data } = await supabase.from('admin_usuarios').select('*').order('criado_em', { ascending: false }).limit(200)
      setUsuarios(data || [])
    }
    if (aba === 'pagamentos') {
      const { data } = await supabase.from('assinaturas').select('*, acompanhantes(nome, cidade, estado)').order('criado_em', { ascending: false }).limit(50)
      setPerfis(data || [])
    }

    setCarregando(false)
  }

  async function salvarLunaConfig() {
    setSalvando(true)
    const { error } = await supabase
      .from('luna_config')
      .update({
        foto_url: lunaConfig.foto_url,
        nome: lunaConfig.nome,
        emoji: lunaConfig.emoji,
        cor_primaria: lunaConfig.cor_primaria,
        cor_fundo: lunaConfig.cor_fundo,
        temperamento: lunaConfig.temperamento,
        prompt_personalizado: lunaConfig.prompt_personalizado,
        temperatura: lunaConfig.temperatura,
        ativo: lunaConfig.ativo,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', lunaConfig.id)
    
    setSalvando(false)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Configurações salvas com sucesso!')
    }
  }

  async function aprovar(id: string) {
    setProcessando(id)
    await supabase.from('acompanhantes').update({ status: 'ativo' }).eq('id', id)
    setProcessando(null); carregar()
  }

  async function rejeitar(id: string) {
    if (!confirm('Rejeitar e suspender este perfil?')) return
    setProcessando(id)
    await supabase.from('acompanhantes').update({ status: 'suspenso' }).eq('id', id)
    setProcessando(null); carregar()
  }

  async function suspender(id: string) {
    if (!confirm('Suspender este perfil?')) return
    setProcessando(id)
    await supabase.from('acompanhantes').update({ status: 'suspenso' }).eq('id', id)
    setProcessando(null); carregar()
  }

  async function reativar(id: string) {
    if (!confirm('Reativar este perfil?')) return
    setProcessando(id)
    await supabase.from('acompanhantes').update({ status: 'ativo' }).eq('id', id)
    setProcessando(null); carregar()
  }

  async function mudarPlano(id: string, plano: string) {
    setProcessando(id)
    await supabase.from('acompanhantes').update({ plano }).eq('id', id)
    setProcessando(null); carregar()
  }

  async function atualizarDenuncia(id: string, novoStatus: string) {
    setProcessando(id)
    await supabase
      .from('denuncias')
      .update({ 
        status: novoStatus, 
        resposta_admin: respostaDenuncia,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
    setProcessando(null)
    setDenunciaSelecionada(null)
    setRespostaDenuncia('')
    carregar()
  }

  async function suspenderPorDenuncia(acompanhanteId: string, denunciaId: string) {
    if (!confirm('Suspender este perfil por denúncia?')) return
    setProcessando(denunciaId)
    await supabase.from('acompanhantes').update({ status: 'suspenso' }).eq('id', acompanhanteId)
    await atualizarDenuncia(denunciaId, 'resolvida')
  }

  async function resetarSenha(email: string) {
    if (!confirm(`Enviar email de reset de senha para ${email}?`)) return
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    alert(error ? 'Erro ao enviar email.' : 'Email de reset enviado!')
  }

  async function salvarEdicaoUsuario() {
    if (!editandoUsuario) return
    setProcessando(editandoUsuario.id)
    await supabase.from('perfis').update({
      nome: editandoUsuario.nome,
      telefone: editandoUsuario.telefone,
    }).eq('id', editandoUsuario.id)
    setProcessando(null)
    setEditandoUsuario(null)
    carregar()
  }

  async function promoverAdmin(userId: string, email: string) {
    if (!isSupremo) { alert('Apenas o admin supremo pode promover admins.'); return }
    if (!confirm(`Promover ${email} para admin?`)) return
    setProcessando(userId)
    await supabase.from('perfis').update({ tipo: 'admin' }).eq('user_id', userId)
    setProcessando(null); carregar()
  }

  async function rebaixarAdmin(userId: string, email: string) {
    if (!isSupremo) { alert('Apenas o admin supremo pode rebaixar admins.'); return }
    if (email === ADMIN_SUPREMO) { alert('Não é possível rebaixar o admin supremo.'); return }
    if (!confirm(`Remover privilégios de admin de ${email}?`)) return
    setProcessando(userId)
    await supabase.from('perfis').update({ tipo: 'cliente' }).eq('user_id', userId)
    setProcessando(null); carregar()
  }

  async function excluirUsuario(userId: string, email: string) {
    if (!isSupremo) { alert('Apenas o admin supremo pode excluir usuários.'); return }
    if (email === ADMIN_SUPREMO) { alert('Não é possível excluir o admin supremo.'); return }
    if (!confirm(`ATENÇÃO: Excluir permanentemente o usuário ${email}?`)) return
    if (!confirm(`Tem certeza absoluta?`)) return
    setProcessando(userId)
    const res = await fetch('/api/admin/excluir-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    setProcessando(null)
    if (res.ok) carregar()
    else alert('Erro ao excluir usuário.')
  }

  async function sair() {
    await supabase.auth.signOut(); router.push('/')
  }

  function formatarTempo(segundos: number): string {
    if (!segundos || segundos < 60) return `${segundos || 0}s`
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    if (minutos < 60) return `${minutos}m ${segs}s`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}m`
  }

  const perfisExibidos = perfis.filter(p =>
    !busca || p.nome?.toLowerCase().includes(busca.toLowerCase()) || p.cidade?.toLowerCase().includes(busca.toLowerCase())
  )

  const usuariosExibidos = usuarios.filter(u => {
    const matchBusca = !busca || u.nome?.toLowerCase().includes(busca.toLowerCase()) || u.email?.toLowerCase().includes(busca.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || u.tipo === filtroTipo
    return matchBusca && matchTipo
  })

  const s = {
    container: { background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' },
    header: { position: 'sticky' as const, top: 0, zIndex: 100, background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    sidebar: { width: '200px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '2rem 0', minHeight: 'calc(100vh - 60px)' },
    content: { flex: 1, padding: '2rem' },
    card: { border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem' },
    th: { textAlign: 'left' as const, padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em' },
    td: { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' as const },
    btnVerde: { background: 'rgba(0,180,80,0.15)', border: '1px solid rgba(0,180,80,0.3)', color: '#00b450', padding: '0.35rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' } as React.CSSProperties,
    btnVermelho: { background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff5050', padding: '0.35rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' } as React.CSSProperties,
    btnAmarelo: { background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa00', padding: '0.35rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' } as React.CSSProperties,
    btnDourado: { background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', padding: '0.35rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' } as React.CSSProperties,
    btnCinza: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '0.35rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' } as React.CSSProperties,
    btnRosa: { background: 'rgba(240,147,251,0.15)', border: '1px solid rgba(240,147,251,0.3)', color: '#f093fb', padding: '0.35rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' } as React.CSSProperties,
    input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '2px', fontSize: '0.85rem', outline: 'none', width: '100%' },
    label: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em' },
  }

  const abas = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={15} /> },
    { id: 'pendentes', label: `Pendentes${stats.pendentes > 0 ? ` (${stats.pendentes})` : ''}`, icon: <AlertTriangle size={15} /> },
    { id: 'ativos', label: 'Ativos', icon: <CheckCircle size={15} /> },
    { id: 'suspensos', label: 'Suspensos', icon: <XCircle size={15} /> },
    { id: 'denuncias', label: `Denúncias${stats.denunciasPendentes > 0 ? ` (${stats.denunciasPendentes})` : ''}`, icon: <Flag size={15} /> },
    { id: 'usuarios', label: 'Usuários', icon: <Users size={15} /> },
    { id: 'pagamentos', label: 'Pagamentos', icon: <Crown size={15} /> },
    { id: 'luna', label: 'Luna Stats', icon: <MessageCircleHeart size={15} /> },
    { id: 'luna-config', label: 'Luna Config', icon: <Settings size={15} /> },
  ]

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#d4af37', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 700 }}>VIP</Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Painel Admin</span>
          {isSupremo && <span style={{ fontSize: '0.7rem', background: 'rgba(212,175,55,0.2)', color: '#d4af37', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.3)' }}>★ Supremo</span>}
        </div>
        <button onClick={sair} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <LogOut size={14} /> Sair
        </button>
      </header>

      <div style={{ display: 'flex' }}>
        <div style={s.sidebar}>
          {abas.map(a => (
            <button key={a.id} onClick={() => { setAba(a.id as Aba); setBusca('') }} style={{
              width: '100%', background: aba === a.id ? 'rgba(212,175,55,0.1)' : 'none',
              border: 'none', borderLeft: `2px solid ${aba === a.id ? '#d4af37' : 'transparent'}`,
              color: aba === a.id ? '#d4af37' : 'rgba(255,255,255,0.5)',
              padding: '0.85rem 1.5rem', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s'
            }}>{a.icon}{a.label}</button>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '1rem 0' }} />
          <Link href="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.5rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <Eye size={15} /> Ver site
          </Link>
          <Link href="/luna" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.5rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <MessageCircleHeart size={15} /> Ver Luna
          </Link>
        </div>

        <div style={s.content}>

          {/* DASHBOARD */}
          {aba === 'dashboard' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif" }}>Dashboard</h1>
                <button onClick={carregar} style={{ ...s.btnCinza, padding: '0.5rem 1rem' }}>
                  <RefreshCw size={13} /> Atualizar
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total anúncios', valor: stats.total || 0, cor: '#fff' },
                  { label: 'Ativos', valor: stats.ativos || 0, cor: '#00b450' },
                  { label: 'Pendentes', valor: stats.pendentes || 0, cor: '#ffaa00' },
                  { label: 'Suspensos', valor: stats.suspensos || 0, cor: '#ff5050' },
                  { label: 'Planos VIP', valor: stats.vip || 0, cor: '#d4af37' },
                  { label: 'Denúncias', valor: stats.denunciasPendentes || 0, cor: '#ff5050' },
                  { label: 'Total usuários', valor: stats.totalUsuarios || 0, cor: '#888' },
                ].map((s2, i) => (
                  <div key={i} style={s.card}>
                    <p style={{ fontSize: '2rem', fontWeight: 300, color: s2.cor }}>{s2.valor}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{s2.label}</p>
                  </div>
                ))}
              </div>
              
              <div style={{ ...s.card, borderColor: 'rgba(240,147,251,0.3)', background: 'linear-gradient(135deg, rgba(240,147,251,0.05) 0%, rgba(245,87,108,0.05) 100%)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <MessageCircleHeart size={20} style={{ color: '#f093fb' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 500, color: '#f093fb' }}>Luna - Assistente Virtual</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#f093fb' }}>{lunaStats.conversas_hoje || 0}</p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Conversas hoje</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#f5576c' }}>{lunaStats.mensagens_hoje || 0}</p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Mensagens hoje</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff' }}>{lunaStats.total_conversas || 0}</p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Total conversas</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff' }}>{formatarTempo(lunaStats.tempo_medio_segundos || 0)}</p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Tempo médio</p>
                  </div>
                </div>
              </div>
              
              {stats.pendentes > 0 && (
                <div style={{ ...s.card, borderColor: 'rgba(255,170,0,0.3)', background: 'rgba(255,170,0,0.05)', marginBottom: '1rem' }}>
                  <p style={{ color: '#ffaa00', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} /> {stats.pendentes} perfil{stats.pendentes > 1 ? 'is' : ''} aguardando aprovação
                  </p>
                  <button onClick={() => setAba('pendentes')} style={{ background: '#ffaa00', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '2px', cursor: 'pointer', color: '#0a0a0a', fontSize: '0.8rem', fontWeight: 700 }}>
                    Revisar agora
                  </button>
                </div>
              )}

              {stats.denunciasPendentes > 0 && (
                <div style={{ ...s.card, borderColor: 'rgba(255,80,80,0.3)', background: 'rgba(255,80,80,0.05)' }}>
                  <p style={{ color: '#ff5050', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Flag size={16} /> {stats.denunciasPendentes} denúncia{stats.denunciasPendentes > 1 ? 's' : ''} pendente{stats.denunciasPendentes > 1 ? 's' : ''}
                  </p>
                  <button onClick={() => setAba('denuncias')} style={{ background: '#ff5050', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '2px', cursor: 'pointer', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                    Ver denúncias
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DENÚNCIAS */}
          {aba === 'denuncias' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif" }}>Denúncias</h1>
                <button onClick={carregar} style={s.btnCinza}><RefreshCw size={14} /></button>
              </div>

              {/* Filtros de status */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {(['pendente', 'analisando', 'resolvida', 'ignorada'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFiltroDenuncia(status)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: filtroDenuncia === status ? '#8B0000' : 'rgba(255,255,255,0.05)',
                      color: filtroDenuncia === status ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      textTransform: 'capitalize'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {carregando ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : denuncias.length === 0 ? (
                <div style={{ ...s.card, textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma denúncia com status "{filtroDenuncia}"</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {denuncias.map(d => (
                    <div key={d.id} style={{ ...s.card, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      {/* Foto */}
                      {d.acompanhante?.foto_capa && (
                        <img src={d.acompanhante.foto_capa} alt="" style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '1rem' }}>{d.acompanhante?.nome || 'Perfil removido'}</strong>
                          {d.acompanhante && (
                            <Link href={`/acompanhante/${d.acompanhante.slug}/`} target="_blank" style={{ color: '#8B0000', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                              Ver <ExternalLink size={12} />
                            </Link>
                          )}
                        </div>
                        
                        <div style={{ background: 'rgba(255,170,0,0.15)', color: '#ffaa00', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block', marginBottom: '0.5rem' }}>
                          {d.motivo}
                        </div>
                        
                        {d.descricao && (
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>"{d.descricao}"</p>
                        )}
                        
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                          <span>📅 {new Date(d.criado_em).toLocaleString('pt-BR')}</span>
                          {d.email_denunciante && <span>📧 {d.email_denunciante}</span>}
                          <span>IP: {d.ip_denunciante}</span>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        <button onClick={() => { setDenunciaSelecionada(d); setRespostaDenuncia('') }} style={s.btnAmarelo}>
                          <Eye size={12} /> Analisar
                        </button>
                        <button onClick={() => atualizarDenuncia(d.id, 'ignorada')} style={s.btnCinza}>
                          <XCircle size={12} /> Ignorar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal de análise */}
              {denunciaSelecionada && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                  <div style={{ background: '#1a1a1a', borderRadius: '8px', width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Analisar Denúncia</h3>
                    
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                      <p><strong>Perfil:</strong> {denunciaSelecionada.acompanhante?.nome}</p>
                      <p><strong>Motivo:</strong> {denunciaSelecionada.motivo}</p>
                      {denunciaSelecionada.descricao && <p><strong>Detalhes:</strong> {denunciaSelecionada.descricao}</p>}
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={s.label}>Resposta/Notas do Admin</label>
                      <textarea
                        value={respostaDenuncia}
                        onChange={e => setRespostaDenuncia(e.target.value)}
                        rows={3}
                        style={{ ...s.input, resize: 'vertical' }}
                        placeholder="Anotações sobre a análise..."
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => atualizarDenuncia(denunciaSelecionada.id, 'resolvida')} style={s.btnVerde}>
                        <CheckCircle size={14} /> Resolver
                      </button>
                      {denunciaSelecionada.acompanhante && (
                        <button onClick={() => suspenderPorDenuncia(denunciaSelecionada.acompanhante.id, denunciaSelecionada.id)} style={s.btnVermelho}>
                          🚫 Suspender Perfil
                        </button>
                      )}
                      <button onClick={() => atualizarDenuncia(denunciaSelecionada.id, 'ignorada')} style={s.btnCinza}>
                        Ignorar
                      </button>
                      <button onClick={() => { setDenunciaSelecionada(null); setRespostaDenuncia('') }} style={{ ...s.btnCinza, marginLeft: 'auto' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LUNA CONFIG */}
          {aba === 'luna-config' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif" }}>Configurar Luna</h1>
                <button onClick={salvarLunaConfig} disabled={salvando} style={{ ...s.btnVerde, padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
                  <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              {carregando ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  
                  {/* Coluna 1: Aparência */}
                  <div style={s.card}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Aparência</h3>
                    
                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={s.label}>Nome</label>
                      <input 
                        value={lunaConfig.nome || ''} 
                        onChange={e => setLunaConfig({ ...lunaConfig, nome: e.target.value })} 
                        style={s.input} 
                        placeholder="Luna"
                      />
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={s.label}>Emoji</label>
                      <input 
                        value={lunaConfig.emoji || ''} 
                        onChange={e => setLunaConfig({ ...lunaConfig, emoji: e.target.value })} 
                        style={{ ...s.input, width: '80px' }} 
                        placeholder="😈"
                      />
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={s.label}>URL da Foto</label>
                      <input 
                        value={lunaConfig.foto_url || ''} 
                        onChange={e => setLunaConfig({ ...lunaConfig, foto_url: e.target.value })} 
                        style={s.input} 
                        placeholder="https://exemplo.com/foto.jpg"
                      />
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>
                        Use uma URL de imagem (ex: do Imgur, Cloudinary, etc)
                      </p>
                      {lunaConfig.foto_url && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img src={lunaConfig.foto_url} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Preview</span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={s.label}>Cor Primária</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="color"
                          value={lunaConfig.cor_primaria || '#ff6b6b'} 
                          onChange={e => setLunaConfig({ ...lunaConfig, cor_primaria: e.target.value })} 
                          style={{ width: '50px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} 
                        />
                        <input 
                          value={lunaConfig.cor_primaria || ''} 
                          onChange={e => setLunaConfig({ ...lunaConfig, cor_primaria: e.target.value })} 
                          style={{ ...s.input, width: '120px' }} 
                          placeholder="#ff6b6b"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={s.label}>Cor de Fundo</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="color"
                          value={lunaConfig.cor_fundo || '#1a0a0a'} 
                          onChange={e => setLunaConfig({ ...lunaConfig, cor_fundo: e.target.value })} 
                          style={{ width: '50px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} 
                        />
                        <input 
                          value={lunaConfig.cor_fundo || ''} 
                          onChange={e => setLunaConfig({ ...lunaConfig, cor_fundo: e.target.value })} 
                          style={{ ...s.input, width: '120px' }} 
                          placeholder="#1a0a0a"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="checkbox"
                          checked={lunaConfig.ativo !== false} 
                          onChange={e => setLunaConfig({ ...lunaConfig, ativo: e.target.checked })} 
                          style={{ width: '16px', height: '16px' }}
                        />
                        Luna Ativa
                      </label>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>
                        Desmarque para desativar o chat temporariamente
                      </p>
                    </div>
                  </div>

                  {/* Coluna 2: Personalidade */}
                  <div style={s.card}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Personalidade</h3>
                    
                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={s.label}>Temperamento</label>
                      <select 
                        value={lunaConfig.temperamento || 'sensual'} 
                        onChange={e => setLunaConfig({ ...lunaConfig, temperamento: e.target.value })}
                        style={{ ...s.input, cursor: 'pointer' }}
                      >
                        <option value="fofa">🥰 Fofa e Carinhosa</option>
                        <option value="sensual">😈 Sensual e Provocante</option>
                        <option value="picante">🔥 Picante e Ousada</option>
                      </select>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>
                        Define o tom das respostas da Luna
                      </p>
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={s.label}>Temperatura da IA ({lunaConfig.temperatura || 0.95})</label>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={lunaConfig.temperatura || 0.95} 
                        onChange={e => setLunaConfig({ ...lunaConfig, temperatura: parseFloat(e.target.value) })} 
                        style={{ width: '100%', cursor: 'pointer' }} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                        <span>Mais previsível</span>
                        <span>Mais criativa</span>
                      </div>
                    </div>

                    <div>
                      <label style={s.label}>Prompt Personalizado (opcional)</label>
                      <textarea 
                        value={lunaConfig.prompt_personalizado || ''} 
                        onChange={e => setLunaConfig({ ...lunaConfig, prompt_personalizado: e.target.value })} 
                        style={{ ...s.input, minHeight: '180px', resize: 'vertical' }} 
                        placeholder="Deixe em branco para usar o prompt padrão do temperamento selecionado, ou escreva um prompt customizado aqui..."
                      />
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>
                        Se preenchido, substitui o prompt padrão do temperamento
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LUNA STATS */}
          {aba === 'luna' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif" }}>Luna Stats</h1>
                <button onClick={carregar} style={{ ...s.btnCinza, padding: '0.5rem 1rem' }}>
                  <RefreshCw size={13} /> Atualizar
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ ...s.card, borderColor: 'rgba(240,147,251,0.3)' }}>
                  <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#f093fb' }}>{lunaStats.conversas_hoje || 0}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Conversas hoje</p>
                </div>
                <div style={{ ...s.card, borderColor: 'rgba(245,87,108,0.3)' }}>
                  <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#f5576c' }}>{lunaStats.mensagens_hoje || 0}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Mensagens hoje</p>
                </div>
                <div style={s.card}>
                  <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff' }}>{lunaStats.total_conversas || 0}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Total conversas</p>
                </div>
                <div style={s.card}>
                  <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff' }}>{lunaStats.total_mensagens || 0}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Total mensagens</p>
                </div>
                <div style={s.card}>
                  <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#00b450' }}>{formatarTempo(lunaStats.tempo_medio_segundos || 0)}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Tempo médio</p>
                </div>
                <div style={s.card}>
                  <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#d4af37' }}>{lunaStats.dias_ativos || 0}</p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Dias ativos</p>
                </div>
              </div>

              <div style={s.card}>
                <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Histórico de Sessões</h3>
                {carregando ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Sessão</th>
                        <th style={s.th}>Evento</th>
                        <th style={s.th}>Mensagens</th>
                        <th style={s.th}>Tempo</th>
                        <th style={s.th}>Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lunaHistorico.map((h, i) => (
                        <tr key={i}>
                          <td style={s.td}><span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{h.sessao_id?.slice(-8) || '—'}</span></td>
                          <td style={s.td}>
                            <span style={{
                              fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px',
                              background: h.evento === 'inicio' ? 'rgba(0,180,80,0.15)' : h.evento === 'mensagem' ? 'rgba(240,147,251,0.15)' : 'rgba(255,170,0,0.15)',
                              color: h.evento === 'inicio' ? '#00b450' : h.evento === 'mensagem' ? '#f093fb' : '#ffaa00'
                            }}>
                              {h.evento === 'inicio' ? '🚀 Início' : h.evento === 'mensagem' ? '💬 Mensagem' : '👋 Fim'}
                            </span>
                          </td>
                          <td style={s.td}>{h.total_mensagens || 0}</td>
                          <td style={s.td}>{formatarTempo(h.tempo_sessao || 0)}</td>
                          <td style={s.td}><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{new Date(h.criado_em).toLocaleString('pt-BR')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {lunaHistorico.length === 0 && !carregando && (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>Nenhuma conversa ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* TABELA ANÚNCIOS */}
          {(aba === 'pendentes' || aba === 'ativos' || aba === 'suspensos') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif" }}>
                  {aba === 'pendentes' ? 'Anúncios Pendentes' : aba === 'ativos' ? 'Anúncios Ativos' : 'Anúncios Suspensos'}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...s.input, paddingLeft: '2.2rem', width: '200px' }} />
                  </div>
                  <button onClick={carregar} style={s.btnCinza}><RefreshCw size={14} /></button>
                </div>
              </div>
              {carregando ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : (
                <div style={s.card}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Foto</th>
                        <th style={s.th}>Nome</th>
                        <th style={s.th}>Cidade</th>
                        <th style={s.th}>Plano</th>
                        <th style={s.th}>Data</th>
                        <th style={s.th}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfisExibidos.map(p => (
                        <tr key={p.id}>
                          <td style={s.td}>
                            <div style={{ width: '40px', height: '50px', borderRadius: '2px', overflow: 'hidden', background: '#1a1a1a' }}>
                              {p.foto_capa ? <img src={p.foto_capa} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>✦</div>}
                            </div>
                          </td>
                          <td style={s.td}>
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem' }}>{p.nome}</p>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{p.idade} anos • {p.sexo}</p>
                          </td>
                          <td style={s.td}><span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.cidade} — {p.estado}</span></td>
                          <td style={s.td}>
                            <span style={{ color: p.plano === 'super_vip' ? '#d4af37' : p.plano === 'vip' ? '#c0c0c0' : 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                              {p.plano === 'super_vip' ? '★ Super VIP' : p.plano === 'vip' ? '◆ VIP' : 'Grátis'}
                            </span>
                          </td>
                          <td style={s.td}><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span></td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {p.slug && <Link href={`/acompanhante/${p.slug}/`} target="_blank" style={{ ...s.btnVerde, textDecoration: 'none' }}><Eye size={11} /> Ver</Link>}
                              {(aba === 'pendentes' || aba === 'suspensos') && <button onClick={() => aprovar(p.id)} disabled={processando === p.id} style={s.btnVerde}><CheckCircle size={11} /> Aprovar</button>}
                              {aba === 'pendentes' && <button onClick={() => rejeitar(p.id)} disabled={processando === p.id} style={s.btnVermelho}><XCircle size={11} /> Rejeitar</button>}
                              {aba === 'ativos' && (
                                <>
                                  {p.plano !== 'super_vip' && <button onClick={() => mudarPlano(p.id, 'super_vip')} disabled={processando === p.id} style={s.btnDourado}><Star size={11} /> Super VIP</button>}
                                  {p.plano !== 'vip' && <button onClick={() => mudarPlano(p.id, 'vip')} disabled={processando === p.id} style={s.btnCinza}><Star size={11} /> VIP</button>}
                                  {p.plano !== 'gratis' && <button onClick={() => mudarPlano(p.id, 'gratis')} disabled={processando === p.id} style={s.btnCinza}><XCircle size={11} /> Remover plano</button>}
                                  <button onClick={() => suspender(p.id)} disabled={processando === p.id} style={s.btnVermelho}><XCircle size={11} /> Suspender</button>
                                </>
                              )}
                              {aba === 'suspensos' && <button onClick={() => reativar(p.id)} disabled={processando === p.id} style={s.btnAmarelo}><RefreshCw size={11} /> Reativar</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {perfisExibidos.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>Nenhum perfil encontrado.</p>}
                </div>
              )}
            </div>
          )}

          {/* USUÁRIOS */}
          {aba === 'usuarios' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 400, fontFamily: "'Cormorant Garamond', serif" }}>Usuários</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." style={{ ...s.input, paddingLeft: '2.2rem', width: '180px' }} />
                  </div>
                  <button onClick={carregar} style={s.btnCinza}><RefreshCw size={14} /></button>
                </div>
              </div>
              {carregando ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : (
                <div style={s.card}>
                  <p style={{ marginBottom: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{usuariosExibidos.length} usuário(s)</p>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Nome</th>
                        <th style={s.th}>Email</th>
                        <th style={s.th}>Tipo</th>
                        <th style={s.th}>Cadastro</th>
                        <th style={s.th}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosExibidos.map(u => (
                        <tr key={u.id}>
                          <td style={s.td}>{u.nome || '—'}</td>
                          <td style={s.td}><span style={{ color: 'rgba(255,255,255,0.5)' }}>{u.email}</span></td>
                          <td style={s.td}>
                            <span style={{
                              fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px',
                              background: u.tipo === 'admin' ? 'rgba(212,175,55,0.15)' : u.tipo === 'acompanhante' ? 'rgba(139,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                              color: u.tipo === 'admin' ? '#d4af37' : u.tipo === 'acompanhante' ? '#ff8080' : 'rgba(255,255,255,0.5)'
                            }}>
                              {u.tipo === 'admin' ? '★ Admin' : u.tipo === 'acompanhante' ? 'Acompanhante' : 'Cliente'}
                            </span>
                          </td>
                          <td style={s.td}><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>{new Date(u.criado_em).toLocaleDateString('pt-BR')}</span></td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {u.email && <button onClick={() => resetarSenha(u.email)} style={s.btnAmarelo}><Key size={11} /> Reset</button>}
                              {isSupremo && u.email !== ADMIN_SUPREMO && u.tipo !== 'admin' && <button onClick={() => promoverAdmin(u.user_id, u.email)} style={s.btnDourado}><Crown size={11} /> Admin</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usuariosExibidos.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>Nenhum usuário encontrado.</p>}
                </div>
              )}
            </div>
          )}

          {/* PAGAMENTOS */}
          {aba === 'pagamentos' && (
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.5rem', fontFamily: "'Cormorant Garamond', serif" }}>Pagamentos</h1>
              {carregando ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Carregando...</p> : (
                <div style={s.card}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Acompanhante</th>
                        <th style={s.th}>Plano</th>
                        <th style={s.th}>Valor</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfis.map(p => (
                        <tr key={p.id}>
                          <td style={s.td}>{p.acompanhantes?.nome || '—'}</td>
                          <td style={s.td}><span style={{ color: p.plano === 'super_vip' ? '#d4af37' : '#c0c0c0' }}>{p.plano === 'super_vip' ? 'Super VIP' : 'VIP'}</span></td>
                          <td style={s.td}>R$ {Number(p.valor).toFixed(2).replace('.', ',')}</td>
                          <td style={s.td}><span style={{ color: p.status === 'ativo' ? '#00b450' : '#ffaa00' }}>{p.status}</span></td>
                          <td style={s.td}><span style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {perfis.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>Nenhum pagamento.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
