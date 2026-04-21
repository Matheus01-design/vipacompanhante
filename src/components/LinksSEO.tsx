'use client'
import Link from 'next/link'

const COR = '#8B0000'

// URLs SEO organizadas por categoria
const LINKS_SEO = {
  'Por Cabelo': [
    { slug: 'loiras-sp', label: 'Loiras SP' },
    { slug: 'loiras-rj', label: 'Loiras RJ' },
    { slug: 'morenas-sp', label: 'Morenas SP' },
    { slug: 'morenas-rj', label: 'Morenas RJ' },
    { slug: 'ruivas-sp', label: 'Ruivas SP' },
    { slug: 'ruivas-rj', label: 'Ruivas RJ' },
    { slug: 'negras-sp', label: 'Negras SP' },
    { slug: 'negras-rj', label: 'Negras RJ' },
  ],
  'Por Etnia': [
    { slug: 'brancas-sp', label: 'Brancas SP' },
    { slug: 'brancas-rj', label: 'Brancas RJ' },
    { slug: 'mulatas-sp', label: 'Mulatas SP' },
    { slug: 'mulatas-rj', label: 'Mulatas RJ' },
    { slug: 'asiaticas-sp', label: 'Asiáticas SP' },
    { slug: 'latinas-sp', label: 'Latinas SP' },
  ],
  'Por Característica': [
    { slug: 'com-local-sp', label: 'Com Local SP' },
    { slug: 'com-local-rj', label: 'Com Local RJ' },
    { slug: 'verificadas-sp', label: 'Verificadas SP' },
    { slug: 'verificadas-rj', label: 'Verificadas RJ' },
    { slug: 'super-vip-sp', label: 'Super VIP SP' },
    { slug: 'super-vip-rj', label: 'Super VIP RJ' },
  ],
  'Por Corpo': [
    { slug: 'magras-sp', label: 'Magras SP' },
    { slug: 'magras-rj', label: 'Magras RJ' },
    { slug: 'atleticas-sp', label: 'Atléticas SP' },
    { slug: 'curvilineas-sp', label: 'Curvilíneas SP' },
    { slug: 'curvilineas-rj', label: 'Curvilíneas RJ' },
  ],
  'Por Estado': [
    { slug: 'loiras-mg', label: 'Loiras MG' },
    { slug: 'morenas-ba', label: 'Morenas BA' },
    { slug: 'loiras-pr', label: 'Loiras PR' },
    { slug: 'morenas-rs', label: 'Morenas RS' },
    { slug: 'loiras-sc', label: 'Loiras SC' },
    { slug: 'morenas-go', label: 'Morenas GO' },
    { slug: 'loiras-df', label: 'Loiras DF' },
    { slug: 'morenas-ce', label: 'Morenas CE' },
  ]
}

export default function LinksSEO() {
  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: '40px 16px',
      marginTop: '40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ 
          color: '#fff', 
          fontSize: '18px', 
          fontWeight: 700, 
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Encontre Acompanhantes por Característica
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          {Object.entries(LINKS_SEO).map(([categoria, links]) => (
            <div key={categoria}>
              <h3 style={{ 
                color: COR, 
                fontSize: '14px', 
                fontWeight: 700, 
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {categoria}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {links.map(link => (
                  <li key={link.slug} style={{ marginBottom: '8px' }}>
                    <Link 
                      href={`/${link.slug}`}
                      style={{
                        color: '#aaa',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'color 0.2s'
                      }}
                      onMouseOver={e => (e.target as HTMLElement).style.color = '#fff'}
                      onMouseOut={e => (e.target as HTMLElement).style.color = '#aaa'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '24px', 
          borderTop: '1px solid #333',
          textAlign: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '12px' }}>
            © {new Date().getFullYear()} VipAcompanhante - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
