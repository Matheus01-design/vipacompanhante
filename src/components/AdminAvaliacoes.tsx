'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Star, Eye, Trash2, MessageSquare } from 'lucide-react'

const COR = '#8B0000'

interface Avaliacao {
  id: string
  nota: number
  comentario: string
  cliente_nome: string
  status: string
  criado_em: string
  acompanhante: {
    id: string
    nome: string
    slug: string
  }
}

export default function AdminAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [filtro, setFiltro] = useState<'pendente' | 'aprovado' | 'rejeitado'>('pendente')
  const [carregando, setCarregando] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    carregarAvaliacoes()
  }, [filtro])

  async function carregarAvaliacoes() {
    setCarregando(true)
    
    const { data } = await supabase
      .from('avaliacoes')
      .select(`
        id, nota, comentario, cliente_nome, status, criado_em,
        acompanhante:acompanhantes(id, nome, slug)
      `)
      .eq('status', filtro)
      .order('criado_em', { ascending: false })
      .limit(100)
    
    if (data) {
      setAvaliacoes(data as any)
    }
    setCarregando(false)
  }

  async function moderar(id: string, novoStatus: 'aprovado' | 'rejeitado', motivo?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('avaliacoes')
      .update({
        status: novoStatus,
        moderado_por: user?.id,
        moderado_em: new Date().toISOString(),
        motivo_rejeicao: motivo
      })
      .eq('id', id)
    
    setAvaliacoes(prev => prev.filter(a => a.id !== id))
  }

  async function excluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return
    
    await supabase.from('avaliacoes').delete().eq('id', id)
    setAvaliacoes(prev => prev.filter(a => a.id !== id))
  }

  const contadores = {
    pendente: avaliacoes.filter(a => a.status === 'pendente').length,
    aprovado: avaliacoes.filter(a => a.status === 'aprovado').length,
    rejeitado: avaliacoes.filter(a => a.status === 'rejeitado').length
  }

  return (
    <>
      <style>{`
        .admin-avaliacoes { padding: 20px }
        .filtros-tabs { display: flex; gap: 8px; margin-bottom: 20px }
        .filtro-tab { 
          padding: 10px 20px; 
          border: none; 
          background: #f0f0f0; 
          border-radius: 8px; 
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filtro-tab.ativo { background: ${COR}; color: #fff }
        .filtro-tab .badge { 
          background: rgba(0,0,0,.1); 
          padding: 2px 8px; 
          border-radius: 10px; 
          font-size: 12px 
        }
        .filtro-tab.ativo .badge { background: rgba(255,255,255,.2) }
        
        .avaliacoes-lista { display: flex; flex-direction: column; gap: 16px }
        .avaliacao-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,.08);
        }
        .avaliacao-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .avaliacao-info { flex: 1 }
        .avaliacao-acompanhante {
          font-size: 16px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }
        .avaliacao-autor {
          font-size: 13px;
          color: #888;
        }
        .avaliacao-estrelas {
          display: flex;
          gap: 2px;
          color: #f5a623;
        }
        .avaliacao-comentario {
          background: #f8f8f8;
          padding: 14px;
          border-radius: 8px;
          color: #444;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .avaliacao-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .avaliacao-data {
          font-size: 12px;
          color: #aaa;
        }
        .avaliacao-acoes {
          display: flex;
          gap: 8px;
        }
        .btn-acao {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-aprovar { background: #e8f5e9; color: #2e7d32 }
        .btn-aprovar:hover { background: #c8e6c9 }
        .btn-rejeitar { background: #ffebee; color: #c62828 }
        .btn-rejeitar:hover { background: #ffcdd2 }
        .btn-excluir { background: #f5f5f5; color: #666 }
        .btn-excluir:hover { background: #e0e0e0 }
        .btn-ver { background: #e3f2fd; color: #1976d2 }
        .btn-ver:hover { background: #bbdefb }
        
        .vazio {
          text-align: center;
          padding: 60px 20px;
          color: #888;
        }
        .vazio p { margin-bottom: 8px }
      `}</style>

      <div className="admin-avaliacoes">
        <h2 style={{fontSize:'20px',fontWeight:700,marginBottom:'20px',display:'flex',alignItems:'center',gap:'10px'}}>
          <MessageSquare size={24} />
          Moderação de Avaliações
        </h2>

        {/* Filtros */}
        <div className="filtros-tabs">
          <button 
            className={`filtro-tab ${filtro === 'pendente' ? 'ativo' : ''}`}
            onClick={() => setFiltro('pendente')}
          >
            ⏳ Pendentes
          </button>
          <button 
            className={`filtro-tab ${filtro === 'aprovado' ? 'ativo' : ''}`}
            onClick={() => setFiltro('aprovado')}
          >
            ✅ Aprovadas
          </button>
          <button 
            className={`filtro-tab ${filtro === 'rejeitado' ? 'ativo' : ''}`}
            onClick={() => setFiltro('rejeitado')}
          >
            ❌ Rejeitadas
          </button>
        </div>

        {carregando ? (
          <p style={{textAlign:'center',padding:'40px',color:'#888'}}>Carregando...</p>
        ) : avaliacoes.length === 0 ? (
          <div className="vazio">
            <p style={{fontSize:'48px'}}>📭</p>
            <p>Nenhuma avaliação {filtro === 'pendente' ? 'pendente' : filtro === 'aprovado' ? 'aprovada' : 'rejeitada'}</p>
          </div>
        ) : (
          <div className="avaliacoes-lista">
            {avaliacoes.map(av => (
              <div key={av.id} className="avaliacao-card">
                <div className="avaliacao-header">
                  <div className="avaliacao-info">
                    <p className="avaliacao-acompanhante">
                      Para: {av.acompanhante?.nome || 'Desconhecida'}
                    </p>
                    <p className="avaliacao-autor">
                      De: {av.cliente_nome || 'Anônimo'}
                    </p>
                  </div>
                  <div className="avaliacao-estrelas">
                    {[1,2,3,4,5].map(n => (
                      <Star 
                        key={n} 
                        size={18} 
                        fill={n <= av.nota ? '#f5a623' : 'none'} 
                        color="#f5a623" 
                      />
                    ))}
                  </div>
                </div>

                {av.comentario && (
                  <div className="avaliacao-comentario">
                    {av.comentario}
                  </div>
                )}

                <div className="avaliacao-meta">
                  <span className="avaliacao-data">
                    {new Date(av.criado_em).toLocaleDateString('pt-BR')} às {new Date(av.criado_em).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                  </span>
                  
                  <div className="avaliacao-acoes">
                    {av.acompanhante?.slug && (
                      <a 
                        href={`/acompanhante/${av.acompanhante.slug}`}
                        target="_blank"
                        className="btn-acao btn-ver"
                      >
                        <Eye size={14} /> Ver perfil
                      </a>
                    )}
                    
                    {filtro === 'pendente' && (
                      <>
                        <button 
                          className="btn-acao btn-aprovar"
                          onClick={() => moderar(av.id, 'aprovado')}
                        >
                          <Check size={14} /> Aprovar
                        </button>
                        <button 
                          className="btn-acao btn-rejeitar"
                          onClick={() => {
                            const motivo = prompt('Motivo da rejeição (opcional):')
                            moderar(av.id, 'rejeitado', motivo || undefined)
                          }}
                        >
                          <X size={14} /> Rejeitar
                        </button>
                      </>
                    )}
                    
                    <button 
                      className="btn-acao btn-excluir"
                      onClick={() => excluir(av.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
