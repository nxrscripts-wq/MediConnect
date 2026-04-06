# Checklist de Deploy — MediConnect

## Ambiente e Configuração
- [ ] VITE_SUPABASE_URL configurada na Vercel (Environment Variables)
- [ ] VITE_SUPABASE_ANON_KEY configurada na Vercel
- [ ] Variáveis configuradas para: Production, Preview, Development
- [ ] .env.local NÃO está no repositório Git
- [ ] .env.example está no repositório Git

## Supabase — Produção
- [ ] URL do projecto Supabase de produção (não o de desenvolvimento)
- [ ] RLS activo em todas as tabelas
- [ ] Políticas de segurança testadas
- [ ] Auth: Site URL configurada para o domínio Vercel
      (Supabase > Auth > URL Configuration > Site URL)
- [ ] Auth: Redirect URLs incluem domínio Vercel
      (adicionar: https://SEU-DOMINIO.vercel.app/**)
- [ ] CORS configurado no Supabase para o domínio Vercel

## Build
- [ ] npm run build:check passa sem erros TypeScript
- [ ] npm run build gera pasta dist/ sem warnings críticos
- [ ] npm run lint:ci passa sem warnings
- [ ] Bundle size aceitável (verificar via npm run build output)

## Funcionalidade
- [ ] Login funciona em produção
- [ ] Refresh em rotas internas não dá 404 (ex: /pacientes)
- [ ] Logout redirige para /login
- [ ] Rotas protegidas redirrigem utilizador não autenticado
- [ ] Sem console.log ou dados sensíveis no bundle

## Performance
- [ ] Lighthouse score > 85 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Assets estáticos com cache correcto (verificar headers)

## Segurança
- [ ] Headers de segurança activos (verificar com securityheaders.com)
- [ ] Content-Security-Policy não bloqueia Supabase
- [ ] Sem chaves privadas no código fonte
- [ ] Sem dados de pacientes mock em produção

## Branding e Identidade
- [ ] Favicon SVG presente em `/public/favicon.svg`
- [ ] Gerar `favicon.ico` manualmente a partir do SVG (ex: realfavicongenerator.net) e substituir em `/public/`
- [ ] Gerar `apple-touch-icon.png` (180x180) e colocar em `/public/`
- [ ] Validar título "MediConnect — Sistema Nacional de Saúde" no browser

---

## Passos de Deploy na Vercel

### 1. Importar Repositório
- Aceder a vercel.com/new
- Seleccionar repositório Git do MediConnect
- Framework Preset: Vite (auto-detectado)
- Root Directory: ./ (raiz)

### 2. Configurar Environment Variables
Na secção "Environment Variables" antes de fazer deploy:
Adicionar cada variável para os 3 ambientes (Production, Preview, Development):
  VITE_SUPABASE_URL       → URL do projecto Supabase
  VITE_SUPABASE_ANON_KEY  → Anon key pública do Supabase
  VITE_APP_ENV            → production
  VITE_APP_VERSION        → 0.1.0

### 3. Build Settings (verificar)
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install
- Node.js Version: 20.x

### 4. Configurar Supabase para o domínio Vercel
Após primeiro deploy (obtém URL: https://mediconnect-xxx.vercel.app):
- Supabase Dashboard > Authentication > URL Configuration
- Site URL: https://mediconnect-xxx.vercel.app
- Redirect URLs: adicionar https://mediconnect-xxx.vercel.app/**

### 5. Domínio Personalizado (opcional)
- Vercel > Project > Settings > Domains
- Adicionar: mediconnect.saude.gov.ao (ou domínio escolhido)
- Configurar DNS: CNAME para cname.vercel-dns.com
- Actualizar Site URL e Redirect URLs no Supabase
