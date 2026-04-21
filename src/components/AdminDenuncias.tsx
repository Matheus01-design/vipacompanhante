'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const COR = '#8B0000'

interface Denuncia {
  id: string
  motivo: string
  descricao: string
  email_denunciante: string
  ip_denunciante: string
  status: string
  resposta_admin: string
  criado_em: string
  acompanhante: {
    id: string
    nome: string
    slug: string
    foto_capa: string
  }
}

export default function AdminDenuncias() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('pendente')
  const [selecionada, setSelecionada] = useState<Denuncia | null>(null)
  const [resposta, setResposta] = useState('')
  const [salvando, setSalvando] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    carregar()
  }, [filtroStatus])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase
      .from('denuncias')
      .select(`
        *,
        acompanhante:acompanhantes(id, nome, slug, foto_capa)
      `)
      .eq('status', filtroStatus)
      .order('criado_em', { ascending: false })
      .limit(50)
    
    setDenuncias(data || [])
    setCarregando(false)
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    setSalvando(true)
    const { error } = await supabase
      .from('denuncias')
      .update({ 
        status: novoStatus, 
        resposta_admin: resposta,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
    
    if (!error) {
      setSelecionada(null)
      setResposta('')
      carregar()
    }
    setSalvando(false)
  }

  async function suspenderAcompanhante(acompanhanteId: string, denunciaId: string) {
    if (!confirm('Tem certeza que deseja SUSPENDER este perfil?')) return
    
    await supabase
      .from('acompanhantes')
      .update({ status: 'suspenso' })
      .eq('id', acompanhanteId)
    
    await atualizarStatus(denunciaId, 'resolvida')
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const contadores = {
    pendente: denuncias.filter(d => d.status === 'pendente').length,
    analisando: 0,
    resolvida: 0,
    ignorada: 0
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle size={24} color={COR} />
        Denúncias
      </h2>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['pendente', 'analisando', 'resolvida', 'ignorada'].map(status => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: filtroStatus === status ? COR : '#f0f0f0',
              color: filtroStatus === status ? '#fff' : '#555',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {carregando ? (
        <p style={{ color: '#888' }}>Carregando...</p>
      ) : denuncias.length === 0 ? (
        <p style={{ color: '#888', padding: '40px', textAlign: 'center', background: '#f8f8f8', borderRadius: '8px' }}>
          Nenhuma denúncia com status "{filtroStatus}"
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {denuncias.map(d => (
            <div key={d.id} style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              {/* Foto */}
              {d.acompanhante?.foto_capa && (
                <img 
                  src={d.acompanhante.foto_capa} 
                  alt="" 
                  style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                />
              )}
              
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '15px' }}>{d.acompanhante?.nome || 'Perfil removido'}</strong>
                  {d.acompanhante && (
                    <Link 
                      href={`/acompanhante/${d.acompanhante.slug}`} 
                      target="_blank"
                      style={{ color: COR, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      Ver <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
                
                <div style={{ 
                  background: '#fff3cd', 
                  color: '#856404', 
                  padding: '6px 10px', 
                  borderRadius: '4px', 
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'inline-block',
                  marginBottom: '8px'
                }}>
                  {d.motivo}
                </div>
                
                {d.descricao && (
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
                    "{d.descricao}"
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#999' }}>
                  <span><Clock size={12} style={{ marginRight: '4px' }} />{formatarData(d.criado_em)}</span>
                  {d.email_denunciante && <span>📧 {d.email_denunciante}</span>}
                  <span>IP: {d.ip_denunciante}</span>
                </div>
              </div>
              
              {/* Ações */}
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button
                  onClick={() => setSelecionada(d)}
                  style={{
                    background: '#f0f0f0',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px'
                  }}
                >
                  <Eye size={14} /> Analisar
                </button>
                
                <button
                  onClick={() => atualizarStatus(d.id, 'ignorada')}
                  style={{
                    background: '#f0f0f0',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#888'
                  }}
                >
                  <XCircle size={14} /> Ignorar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de análise */}
      {selecionada && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Analisar Denúncia
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>Perfil:</strong> {selecionada.acompanhante?.nome}<br/>
              <strong>Motivo:</strong> {selecionada.motivo}<br/>
              {selecionada.descricao && <><strong>Detalhes:</strong> {selecionada.descricao}</>}
            </div>
            
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Resposta/Notas do Admin
              </span>
              <textarea
                value={resposta}
                onChange={e => setResposta(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="Anotações sobre a análise..."
              />
            </label>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => atualizarStatus(selecionada.id, 'resolvida')}
                disabled={salvando}
                style={{
                  background: '#00b450',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle size={16} /> Resolver
              </button>
              
              {selecionada.acompanhante && (
                <button
                  onClick={() => suspenderAcompanhante(selecionada.acompanhante.id, selecionada.id)}
                  disabled={salvando}
                  style={{
                    background: COR,
                    color: '#fff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🚫 Suspender Perfil
                </button>
              )}
              
              <button
                onClick={() => atualizarStatus(selecionada.id, 'ignorada')}
                disabled={salvando}
                style={{
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Ignorar
              </button>
              
              <button
                onClick={() => { setSelecionada(null); setResposta('') }}
                style={{
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #ddd',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
