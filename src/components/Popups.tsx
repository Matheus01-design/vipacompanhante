'use client'
import { useState, useEffect } from 'react'

const COR = '#8B0000'

export function Popup18() {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    const confirmado = localStorage.getItem('idade_confirmada')
    if (!confirmado) setMostrar(true)
  }, [])

  function confirmar() {
    localStorage.setItem('idade_confirmada', '1')
    setMostrar(false)
  }

  function recusar() {
    window.location.href = 'https://www.google.com'
  }

  if (!mostrar) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '32px',
        maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#222', marginBottom: '16px' }}>
          Conformidade ECA Digital
        </h2>
        <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '24px' }}>
          Em cumprimento ao <em>Estatuto da Criança e do Adolescente Digital (Lei nº 15.211/2025)</em>,
          informamos que este site utiliza sistemas de verificação de idade. O acesso a áreas restritas
          e o desbloqueio de conteúdo explícito exigem validação obrigatória de maioridade.
          <br /><br />
          A simples autodeclaração não é mais suficiente para visualizar o conteúdo protegido.
          Ao prosseguir, você declara ter mais de 18 anos e estar ciente de que o acesso será
          liberado apenas mediante verificação técnica.
        </p>
        <button onClick={confirmar} style={{
          width: '100%', background: COR, color: '#fff', border: 'none',
          padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 700,
          cursor: 'pointer', marginBottom: '10px'
        }}>
          Tenho 18 anos ou mais
        </button>
        <button onClick={recusar} style={{
          width: '100%', background: 'none', color: '#999', border: '1px solid #ddd',
          padding: '10px', borderRadius: '8px', fontSize: '14px',
          cursor: 'pointer'
        }}>
          Sair do site
        </button>
      </div>
    </div>
  )
}

export function CookieConsent() {
  const [mostrar, setMostrar] = useState(false)
  const [mostrarConfig, setMostrarConfig] = useState(false)

  useEffect(() => {
    const aceito = localStorage.getItem('cookies_aceitos')
    if (!aceito) setMostrar(true)
  }, [])

  function aceitar() {
    localStorage.setItem('cookies_aceitos', 'aceito')
    setMostrar(false)
  }

  function recusar() {
    localStorage.setItem('cookies_aceitos', 'recusado')
    setMostrar(false)
  }

  if (!mostrar) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: '#fff', borderTop: '3px solid ' + COR,
      padding: '20px 24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {!mostrarConfig ? (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#222', marginBottom: '10px' }}>
              Uso de cookies
            </h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, marginBottom: '16px' }}>
              Utilizamos cookies próprios e de terceiros para realizar estatísticas de uso com a
              finalidade de identificar falhas, melhorar os conteúdos e a configuração da web, assim
              como para recordar algumas opções que você escolheu para facilitar a sua navegação.
              Você pode aceitar esta configuração ou alterá-la se preferir.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button onClick={aceitar} style={{ background: COR, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Aceitar
              </button>
              <button onClick={recusar} style={{ background: COR, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Recusar
              </button>
              <button onClick={() => setMostrarConfig(true)} style={{ background: 'none', border: `1px solid ${COR}`, color: COR, padding: '10px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Configurar
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <a href="/termos" style={{ color: '#666', textDecoration: 'underline' }}>Termos e Condições</a>
              <a href="/privacidade" style={{ color: '#666', textDecoration: 'underline' }}>Política de Privacidade</a>
              <a href="/cookies" style={{ color: '#666', textDecoration: 'underline' }}>Política de Cookies</a>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#222', marginBottom: '12px' }}>
              Configurar cookies
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Cookies essenciais', desc: 'Necessários para o funcionamento do site', obrigatorio: true },
                { label: 'Cookies analíticos', desc: 'Nos ajudam a entender como você usa o site' },
                { label: 'Cookies de marketing', desc: 'Usados para personalizar anúncios' },
              ].map((c, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: c.obrigatorio ? 'not-allowed' : 'pointer' }}>
                  <input type="checkbox" defaultChecked={c.obrigatorio} disabled={c.obrigatorio} style={{ accentColor: COR, width: '16px', height: '16px' }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#222' }}>{c.label} {c.obrigatorio && <span style={{ fontSize: '11px', color: '#999' }}>(obrigatório)</span>}</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{c.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={aceitar} style={{ background: COR, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Salvar preferências
              </button>
              <button onClick={() => setMostrarConfig(false)} style={{ background: 'none', border: '1px solid #ddd', color: '#666', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
