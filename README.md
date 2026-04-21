# 🌟 VipAcompanhante — Next.js App

Plataforma de acompanhantes reescrita em Next.js 14 + Supabase + MercadoPago.

---

## 📁 Estrutura do projeto

```
vipacompanhante/
├── supabase/
│   └── schema.sql          ← Execute no Supabase primeiro!
├── src/
│   ├── app/
│   │   ├── page.tsx         ← Homepage
│   │   ├── layout.tsx       ← Layout raiz
│   │   ├── globals.css
│   │   ├── [sexo]/page.tsx  ← /mulheres e /homens (listagem)
│   │   ├── acompanhante/[slug]/page.tsx ← Perfil individual
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx
│   │   ├── planos/page.tsx
│   │   ├── minha-conta/     ← (próxima etapa)
│   │   └── admin/           ← (próxima etapa)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts    ← Supabase client-side
│   │   │   └── server.ts    ← Supabase server-side
│   │   └── queries.ts       ← Funções de busca
│   └── types/
│       └── index.ts         ← Tipos TypeScript + constantes
└── .env.example             ← Copie para .env.local
```

---

## 🚀 Como configurar e subir

### 1. Instalar Node.js
Baixe em: https://nodejs.org (versão LTS)

### 2. Criar conta no Supabase
1. Acesse https://supabase.com
2. Clique em "Start your project" → crie sua conta
3. Crie um novo projeto (dê qualquer nome)
4. Aguarde o projeto inicializar (~2 minutos)

### 3. Criar o banco de dados
1. No Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **New query**
3. Copie e cole todo o conteúdo de `supabase/schema.sql`
4. Clique em **Run**
5. Deve aparecer "Success" ✅

### 4. Pegar as chaves do Supabase
1. Vá em **Settings → API**
2. Copie:
   - `Project URL` → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → vai em `SUPABASE_SERVICE_ROLE_KEY`

### 5. Criar conta no MercadoPago (para pagamentos)
1. Acesse https://mercadopago.com.br
2. Crie sua conta de vendedor
3. Vá em **Seu negócio → Configurações → Credenciais**
4. Pegue o `Access Token` e a `Public Key`

### 6. Configurar variáveis de ambiente
```bash
# Na pasta do projeto:
cp .env.example .env.local
# Edite o .env.local com suas chaves
```

### 7. Instalar dependências
```bash
npm install
```

### 8. Rodar localmente
```bash
npm run dev
# Acesse: http://localhost:3000
```

### 9. Criar usuário admin
1. Acesse http://localhost:3000/cadastro
2. Crie sua conta normalmente
3. No Supabase, vá em **Table Editor → perfis**
4. Encontre seu usuário e mude `tipo` de `cliente` para `admin`
5. Agora você tem acesso ao `/admin`

---

## 🌐 Deploy (subir para produção)

### Vercel (recomendado — gratuito)
1. Crie conta em https://vercel.com
2. Instale o CLI: `npm i -g vercel`
3. Na pasta do projeto: `vercel`
4. Siga as instruções e adicione as variáveis de ambiente
5. Aponte o domínio `vipacompanhante.com` no painel da Vercel

### Alternativa: VPS (DigitalOcean, Hostinger VPS)
```bash
npm run build
npm start
```

---

## 📋 Próximas etapas (ainda a construir)

- [ ] `/minha-conta` — painel da acompanhante (editar perfil, fotos, ver stats)
- [ ] `/admin` — painel administrativo (aprovar/suspender perfis, ver pagamentos)
- [ ] Upload de fotos (Supabase Storage)
- [ ] Integração MercadoPago (checkout dos planos)
- [ ] `/buscar` — página de busca por texto
- [ ] Middleware de autenticação (proteção de rotas)
- [ ] API routes para registrar visualizações

---

## 💰 Custo estimado mensal

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby (gratuito) ou Pro | R$0 – R$110 |
| Supabase | Free tier | R$0 |
| Domínio | Renovação anual | ~R$50/ano |
| **Total** | | **R$0 – R$120/mês** |
