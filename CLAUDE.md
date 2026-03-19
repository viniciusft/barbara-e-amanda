# CLAUDE.md — Contexto do Projeto para o Claude Code
## Identidade do Projeto
- **Nome:** Âmbar Beauty Studio
- **Repositório:** viniciusft/barbara-e-amanda
- **Site:** https://ambarbeautystudio.com.br
- **Stack:** Next.js 14 (App Router), Supabase, Vercel, TypeScript, Tailwind CSS
- **Supabase Project ID:** dlrbqzivpoloqbjewdws
## O que é este app
Sistema completo de agendamento online para um studio de maquiagem e penteados
em Passos, MG. Tem duas frentes:
1. Site público — agendamento online, páginas de SEO local, galeria
2. Painel admin — gestão de agendamentos, clientes, leads, serviços,
   configurações, editor de conteúdo do site
## Regras absolutas
- NUNCA alterar o fluxo de agendamento público sem instrução explícita
- NUNCA remover migrações existentes do Supabase
- NUNCA hardcodar URLs — sempre usar process.env.NEXT_PUBLIC_SITE_URL
- NUNCA quebrar RLS (Row Level Security) do Supabase
- Sempre manter TypeScript — sem "any" sem justificativa
- Commits em português, descritivos
- Antes de qualquer tarefa: fazer checkpoint com git commit
## Banco de dados (Supabase)
### Tabelas e campos importantes
**servicos** (5 linhas)
- id, nome, categoria (maquiagem/cabelo/combo), preco, duracao_minutos
- duracao_maquiagem_min, duracao_cabelo_min (para combos)
- sinal_tipo (percentual/fixo), sinal_valor_fixo, sinal_percentual_custom
- cor_agenda, ordem, ativo, imagem_url
- Serviços ativos: Babyliss (R$120), Maquiagem Social (R$185),
  Make+Penteado (R$300), Penteado (R$150), Make+Babyliss (R$420)
**agendamentos** (30 linhas)
- status: solicitacao → aguardando_sinal → confirmado → concluido
          → nao_compareceu → cancelado
- sinal_status: aguardando → pago → nao_compareceu → dispensado → reembolsado
- Campos de combo: data_hora_cabelo, gcal_event_id_cabelo, combo_ordem
- Campos financeiros: preco_original, preco_cobrado, sinal_valor, valor_restante
- Rastreamento: meta_fbp, meta_fbc, ip_hash
- Relacionamentos: servico_id → servicos, cliente_id → clientes
**clientes** (3 linhas)
- telefone (único), nome, email, data_nascimento, observacoes
- total_agendamentos, total_gasto, ultimo_agendamento_em
**leads** (16 linhas)
- etapa: solicitacao → whatsapp_sinal_enviado → sinal_pago → confirmado
         → confirmacao_enviada → concluido → avaliacao_enviada
         → nao_compareceu → cancelado
- historico (jsonb array de eventos)
- origem: agendamento_online
- Relacionamentos: agendamento_id → agendamentos, cliente_id → clientes
**notificacoes** (22 linhas)
- tipo: nova_solicitacao, contato_casamento, contato_destination,
        contato_duvida, sinal_pendente, agendamento_hoje,
        sem_confirmacao, nao_compareceu
- lida, lida_em, agendamento_id, lead_id
**galeria** (16 linhas)
- imagem_url (campo correto — NÃO "url")
- imagem_mobile_url
- categoria: geral/maquiagem/penteado/noiva/formatura/evento/babyliss/combo
- pagina: home (e outras)
- tipo_exibicao: carrossel/grid/hero
- ordem, ativo
**conteudo_paginas** (9 linhas — uma por página SEO)
- pagina (slug único): home, maquiagem-social, maquiagem-noiva, penteado,
  babyliss, maquiagem-e-penteado, casamento, formatura, eventos
- titulo, subtitulo, descricao_curta, texto_principal
- faq (jsonb array: [{pergunta, resposta}])
- meta_title, meta_description
- preco_a_partir_de, duracao_minutos (informativos, NÃO editáveis — vêm de servicos)
- para_quem, como_funciona (jsonb arrays)
- servico_id → servicos
**admin_config** (1 linha — configuração global)
- nome_studio, whatsapp, instagram, endereco, google_meu_negocio_url
- chave_pix, tipo_chave_pix, nome_recebedor_pix, sinal_percentual_padrao
- mensagem_whatsapp_template, mensagem_confirmacao_template,
  mensagem_avaliacao_template, mensagem_destination_beauty,
  mensagem_horario_personalizado
- titulo_casamento, descricao_casamento, mensagem_casamento
- titulo_destination_beauty, descricao_destination_beauty
- foto_perfil_url, foto_url, foto_header_url, foto_header_mobile_url
- meta_pixel_id, meta_capi_token
- google_access_token, google_refresh_token, google_token_expiry, google_calendar_id
- tema: dark/light
**horarios_disponiveis** (7 linhas)
- dia_semana (0-6), hora_inicio, hora_fim, intervalo_minutos
- horarios_customizados (jsonb), categoria, modo_horario
**bloqueios** — datas bloqueadas manualmente
**contatos_diretos** — leads de casamento/destination beauty
- tipo: casamento/destination_beauty/duvida
- etapa_funil: novo → em_conversa → orcamento_enviado → convertido → perdido
- convertido_em_agendamento_id → agendamentos
**agendamento_controle** — anti-spam por IP/telefone
## Variáveis de ambiente
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- NEXT_PUBLIC_GA_ID
- NEXT_PUBLIC_META_PIXEL_ID / META_CAPI_TOKEN
## Integrações ativas
- Google Calendar — sincronização de agendamentos (OAuth configurado)
- Google Analytics 4 — tracking de eventos
- Meta Pixel + Conversions API (CAPI) — tracking de conversões
- WhatsApp — envio manual via link (Cloud API pendente)
## Páginas SEO
- /servicos/maquiagem-social
- /servicos/maquiagem-noiva
- /servicos/penteado
- /servicos/babyliss
- /servicos/maquiagem-e-penteado
- /ocasioes/casamento
- /ocasioes/formatura
- /ocasioes/eventos
## Admin/Site editor
- Página: /admin/site
- Preview via iframe apontando para a página pública real
- O iframe recarrega após clicar em "Salvar e publicar"
- Não é preview em tempo real — mostra a versão já publicada
- Preço e duração NÃO são editáveis aqui — vêm da tabela servicos
  e o editor exibe um card informativo com link para /admin/servicos
- Upload de fotos insere na tabela galeria usando campo imagem_url
  (nunca "url" — esse campo não existe na tabela)
## Estilo visual
- Paleta: preto #0A0A0A, dourado #C9A84C, branco #FAFAFA
- Fonte: serif para títulos, sans para corpo
- Tom: elegante, feminino, profissional
## Backlog (não implementado)
- WhatsApp Cloud API automático (número em estabilização)
- Melhorias em admin/clientes e admin/leads
- Integração WhatsApp automático no fluxo de notificações
