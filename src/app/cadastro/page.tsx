'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ESTADOS_BR } from '@/types'
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'

const COR = '#8B0000'

export default function CadastroPage() {
  const [etapa, setEtapa] = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

  const [form, setForm] = useState({
    nome: '', email: '', senha: '', telefone: '',
    tipo: 'acompanhante',
    idade: '', sexo: 'mulher', estado: '', cidade: '', bairro: '',
    preco: '', descricao: '', atendimento: [] as string[],
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }))

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: { data: { nome: form.nome } }
    })

    if (authError) {
      setErro(authError.message === 'User already registered' ? 'Este e-mail já está cadastrado.' : authError.message)
      setCarregando(false)
      return
    }

    if (!authData.user) {
      setErro('Erro ao criar conta. Tente novamente.')
      setCarregando(false)
      return
    }

    await supabase.from('perfis').insert({
      user_id: authData.user.id,
      tipo: form.tipo,
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
    })

    if (form.tipo === 'acompanhante') {
      const slug = `${form.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-acompanhante-em-${form.cidade.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${form.estado.toLowerCase()}-${Date.now()}`

      await supabase.from('acompanhantes').insert({
        user_id: authData.user.id,
        nome: form.nome,
        slug,
        idade: parseInt(form.idade),
        sexo: form.sexo,
        estado: form.estado,
        cidade: form.cidade,
        bairro: form.bairro,
        telefone: form.telefone,
        preco: form.preco,
        descricao: form.descricao,
        atendimento: form.atendimento,
        plano: 'gratis',
        status: 'pendente',
      })

      router.push('/minha-conta?cadastro=sucesso')
    } else {
      router.push('/?cadastro=sucesso')
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: #f5f5f5; font-family: system-ui, -apple-system, sans-serif }
        .cadastro-container { min-height: 100vh; display: flex; flex-direction: column }
        .cadastro-header { background: ${COR}; padding: 16px; text-align: center }
        .cadastro-header a { color: #fff; text-decoration: none; font-size: 22px; font-weight: 800 }
        .cadastro-content { flex: 1; padding: 24px 16px; max-width: 500px; margin: 0 auto; width: 100% }
        .etapas { display: flex; gap: 8px; justify-content: center; margin-bottom: 24px }
        .etapa-dot { width: 40px; height: 4px; border-radius: 2px; background: #ddd }
        .etapa-dot.ativa { background: ${COR} }
        .etapa-dot.completa { background: #4caf50 }
        .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.08) }
        .card-title { font-size: 22px; font-weight: 700; color: #222; margin-bottom: 8px; text-align: center }
        .card-desc { font-size: 14px; color: #666; text-align: center; margin-bottom: 24px }
        .form-group { margin-bottom: 16px }
        .form-label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px }
        .form-input { width: 100%; padding: 12px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; outline: none; background: #fff; color: #333 }
        .form-input:focus { border-color: ${COR}; box-shadow: 0 0 0 3px ${COR}22 }
        .form-input::placeholder { color: #aaa }
        .form-select { width: 100%; padding: 12px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; outline: none; background: #fff; color: #333; cursor: pointer }
        .form-select:focus { border-color: ${COR} }
        .form-textarea { width: 100%; padding: 12px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; outline: none; resize: vertical; min-height: 100px }
        .form-textarea:focus { border-color: ${COR} }
        .form-textarea::placeholder { color: #aaa }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
        .tipo-btn { border: 2px solid #ddd; background: #fff; padding: 20px 16px; border-radius: 10px; cursor: pointer; text-align: center; transition: all .2s }
        .tipo-btn:hover { border-color: ${COR}88 }
        .tipo-btn.ativo { border-color: ${COR}; background: ${COR}08 }
        .tipo-btn h3 { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 4px }
        .tipo-btn p { font-size: 12px; color: #888 }
        .btn { width: 100%; padding: 14px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 8px }
        .btn-primary { background: ${COR}; color: #fff; border: none }
        .btn-primary:hover { background: #6b0000 }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed }
        .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #ddd }
        .btn-secondary:hover { background: #eee }
        .btns-row { display: flex; gap: 12px; margin-top: 20px }
        .btns-row .btn-secondary { flex: 1 }
        .btns-row .btn-primary { flex: 2 }
        .checkbox-group { display: flex; flex-wrap: wrap; gap: 12px }
        .checkbox-item { display: flex; align-items: center; gap: 8px; cursor: pointer }
        .checkbox-item input { accent-color: ${COR}; width: 18px; height: 18px }
        .checkbox-item span { font-size: 14px; color: #444 }
        .senha-container { position: relative }
        .senha-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #888; cursor: pointer; padding: 4px }
        .erro-msg { background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 14px; text-align: center; margin-top: 16px }
        .sucesso-icon { width: 80px; height: 80px; background: ${COR}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px }
        .link-login { text-align: center; margin-top: 20px; font-size: 14px; color: #666 }
        .link-login a { color: ${COR}; text-decoration: none; font-weight: 600 }
      `}</style>

      <div className="cadastro-container">
        <header className="cadastro-header">
          <Link href="/">VipAcompanhante</Link>
        </header>

        <div className="cadastro-content">
          {/* Indicador de etapas */}
          <div className="etapas">
            <div className={`etapa-dot ${etapa >= 1 ? 'ativa' : ''} ${etapa > 1 ? 'completa' : ''}`} />
            <div className={`etapa-dot ${etapa >= 2 ? 'ativa' : ''} ${etapa > 2 ? 'completa' : ''}`} />
            <div className={`etapa-dot ${etapa >= 3 ? 'ativa' : ''}`} />
          </div>

          <div className="card">
            {/* ETAPA 1 */}
            {etapa === 1 && (
              <>
                <h1 className="card-title">Criar conta</h1>
                <p className="card-desc">Que tipo de conta você quer criar?</p>
                <div className="form-row">
                  <button type="button" className={`tipo-btn ${form.tipo === 'acompanhante' ? 'ativo' : ''}`}
                    onClick={() => { set('tipo', 'acompanhante'); setEtapa(2) }}>
                    <h3>💃 Sou Acompanhante</h3>
                    <p>Quero anunciar meu perfil</p>
                  </button>
                  <button type="button" className={`tipo-btn ${form.tipo === 'cliente' ? 'ativo' : ''}`}
                    onClick={() => { set('tipo', 'cliente'); setEtapa(2) }}>
                    <h3>👤 Sou Cliente</h3>
                    <p>Quero encontrar companhia</p>
                  </button>
                </div>
              </>
            )}

            {/* ETAPA 2 */}
            {etapa === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); setEtapa(3) }}>
                <h1 className="card-title">Seus dados</h1>
                <p className="card-desc">Informações básicas da sua conta</p>

                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input type="text" className="form-input" required placeholder="Digite seu nome"
                    value={form.nome} onChange={e => set('nome', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input type="email" className="form-input" required placeholder="seu@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input type="tel" className="form-input" required placeholder="(11) 99999-9999"
                    value={form.telefone} onChange={e => set('telefone', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Senha</label>
                  <div className="senha-container">
                    <input type={mostrarSenha ? 'text' : 'password'} className="form-input" required minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      value={form.senha} onChange={e => set('senha', e.target.value)} />
                    <button type="button" className="senha-toggle" onClick={() => setMostrarSenha(!mostrarSenha)}>
                      {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="btns-row">
                  <button type="button" className="btn btn-secondary" onClick={() => setEtapa(1)}>
                    <ArrowLeft size={16} /> Voltar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Continuar
                  </button>
                </div>
              </form>
            )}

            {/* ETAPA 3 */}
            {etapa === 3 && (
              <form onSubmit={handleCadastro}>
                {form.tipo === 'acompanhante' ? (
                  <>
                    <h1 className="card-title">Seu perfil</h1>
                    <p className="card-desc">Dados do seu anúncio</p>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Idade</label>
                        <input type="number" className="form-input" required min={18} max={99}
                          placeholder="Ex: 25"
                          value={form.idade} onChange={e => set('idade', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sexo</label>
                        <select className="form-select" required value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                          <option value="mulher">Mulher</option>
                          <option value="homem">Homem</option>
                          <option value="trans">Trans</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Estado</label>
                        <select className="form-select" required value={form.estado} onChange={e => set('estado', e.target.value)}>
                          <option value="">Selecione o estado</option>
                          {Object.entries(ESTADOS_BR).sort((a,b) => a[1].localeCompare(b[1])).map(([s, n]) => (
                            <option key={s} value={s}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cidade</label>
                        <input type="text" className="form-input" required placeholder="Digite sua cidade"
                          value={form.cidade} onChange={e => set('cidade', e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bairro</label>
                      <input type="text" className="form-input" placeholder="Digite seu bairro (opcional)"
                        value={form.bairro} onChange={e => set('bairro', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Preço por hora</label>
                      <input type="text" className="form-input" placeholder="Ex: R$ 300,00"
                        value={form.preco} onChange={e => set('preco', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Atendo</label>
                      <div className="checkbox-group">
                        {['homens', 'mulheres', 'casais'].map(op => (
                          <label key={op} className="checkbox-item">
                            <input type="checkbox" checked={form.atendimento.includes(op)}
                              onChange={e => set('atendimento', e.target.checked ? [...form.atendimento, op] : form.atendimento.filter(x => x !== op))} />
                            <span>{op.charAt(0).toUpperCase() + op.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descrição</label>
                      <textarea className="form-textarea" placeholder="Fale um pouco sobre você, seus serviços e diferenciais..."
                        value={form.descricao} onChange={e => set('descricao', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:'center',padding:'20px 0'}}>
                    <div className="sucesso-icon">
                      <Check size={40} color="#fff" />
                    </div>
                    <h1 className="card-title">Tudo pronto!</h1>
                    <p className="card-desc">Clique abaixo para criar sua conta e começar a navegar.</p>
                  </div>
                )}

                {erro && <div className="erro-msg">{erro}</div>}

                <div className="btns-row">
                  <button type="button" className="btn btn-secondary" onClick={() => setEtapa(2)}>
                    <ArrowLeft size={16} /> Voltar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={carregando}>
                    {carregando ? 'Criando conta...' : 'Criar conta grátis'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="link-login">
            Já tem conta? <Link href="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </>
  )
}
