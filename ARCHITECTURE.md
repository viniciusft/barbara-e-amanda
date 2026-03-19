# ARCHITECTURE.md — Âmbar Beauty Studio
## Stack
- Next.js 14 com App Router
- Supabase (Postgres + Auth + Storage)
- Vercel (deploy)
- TypeScript + Tailwind CSS
## Estrutura de pastas
app/
  (public)/
    page.tsx                  # Home pública
    agendar/                  # Fluxo de agendamento
    servicos/[slug]/          # Páginas SEO de serviços
    ocasioes/[slug]/          # Páginas SEO de ocasiões
  admin/
    (protected)/              # Requer autenticação Supabase
      agendamentos/
      clientes/
      leads/
      servicos/
      site/                   # Editor de conteúdo das páginas
      configuracoes/
  api/
    admin/                    # Route handlers (usam service role)
    public/                   # Route handlers públicos
  actions/
    revalidate.ts             # Server action: revalidatePath
components/
  ui/                         # Componentes base
  admin/                      # Componentes exclusivos do admin
  seo/                        # Schemas JSON-LD, meta tags
lib/
  supabase/                   # Clients: server, client, middleware
  google/                     # Google Calendar integration
  meta/                       # Meta Pixel + CAPI
## Decisões de arquitetura
### Autenticação
- Supabase Auth nativo — sem NextAuth
- RLS habilitado em todas as tabelas
- service role key usada apenas server-side (API routes e server actions)
### conteudo_paginas
- Cada página SEO busca seu conteúdo pelo campo "pagina" (slug único)
- Preço e duração vêm sempre da tabela "servicos", não daqui
- Editável via admin/site
### admin_config
- Tabela com exatamente 1 linha
- Usada como configuração global do studio
- Contém tokens do Google Calendar, templates de WhatsApp, dados do PIX
### galeria
- Campo correto para URL da imagem: imagem_url (NÃO "url")
- tipo_exibicao define onde a foto aparece: carrossel (vitrine),
  grid (portfólio), hero (fundo da página)
### Admin/Site editor
- Preview via iframe apontando para a URL pública real da página
- Iframe recarrega após salvar — não é tempo real durante digitação
- Isso garante que o preview seja 100% fiel ao site público
- Preço/duração: exibidos como card informativo somente leitura
  com link para /admin/servicos
### Fluxo de agendamento
1. Cliente escolhe serviço → data → horário → preenche dados
2. Agendamento criado com status "solicitacao"
3. Admin recebe notificação → envia WhatsApp manual com link
4. Admin marca sinal como pago → status "confirmado"
5. Google Calendar sincroniza automaticamente
### Fluxo de lead
- Todo agendamento gera um registro em "leads"
- contatos_diretos (casamento/destination) geram leads independentes
- Etapas refletem o progresso no funil de vendas
