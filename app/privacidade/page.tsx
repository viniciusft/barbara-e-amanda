import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade do Âmbar Beauty Studio. Saiba como coletamos e usamos seus dados pessoais.",
  robots: { index: false, follow: false },
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#F5F0E8]">
      {/* Barra de navegação */}
      <div className="border-b border-[rgba(201,168,76,0.1)] bg-[rgba(10,10,10,0.95)]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#C9A84C] transition-colors"
          >
            <ArrowLeft size={15} />
            Voltar ao início
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-6 py-14 space-y-10">
        {/* Cabeçalho */}
        <header className="space-y-2 pb-8 border-b border-[rgba(201,168,76,0.15)]">
          <p className="text-[#C9A84C] text-[10px] tracking-[0.4em] uppercase font-sans">
            Âmbar Beauty Studio
          </p>
          <h1 className="font-display text-4xl font-light text-[#F5F0E8]">
            Política de Privacidade
          </h1>
          <p className="text-sm text-[#9CA3AF] font-sans mt-3">
            Vigência a partir de: <strong className="text-[#F5F0E8]">22 de março de 2026</strong>
          </p>
        </header>

        <Section title="1. Quem somos">
          <p>
            O <strong>Âmbar Beauty Studio</strong> é um studio de maquiagem e penteado localizado em
            Passos, MG, Brasil. Nosso site e sistema de agendamento online estão disponíveis em{" "}
            <span className="text-[#C9A84C]">ambarbeautystudio.com.br</span>.
          </p>
          <p>
            Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos
            as informações pessoais fornecidas por você ao utilizar nosso site e serviços de
            agendamento, em conformidade com a{" "}
            <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Ao realizar um agendamento, coletamos:</p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>
              <strong className="text-[#F5F0E8]">Nome completo</strong> — para identificação e
              personalização do atendimento.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Número de telefone (WhatsApp)</strong> — para
              confirmação do agendamento e envio de mensagens sobre o serviço contratado.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Endereço de e-mail</strong> (opcional) — para
              envio de confirmações e lembretes.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Data e horário escolhidos</strong> — para
              organização da agenda.
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Dados de rastreamento</strong> — identificadores
              do Meta Pixel (_fbp, _fbc) e endereço IP anonimizado, utilizados para mensuração de
              campanhas publicitárias.
            </li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
          <p>Utilizamos suas informações para:</p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>Confirmar, gerenciar e realizar o agendamento solicitado;</li>
            <li>
              Enviar mensagens via WhatsApp relacionadas ao serviço contratado (confirmação,
              lembrete, instruções de pagamento do sinal e avaliação pós-atendimento);
            </li>
            <li>Registrar o histórico de atendimentos para oferecer melhor experiência;</li>
            <li>
              Mensurar o desempenho de campanhas publicitárias no Facebook e Instagram (via Meta
              Pixel e API de Conversões);
            </li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </Section>

        <Section title="4. WhatsApp Business API — Mensagens automáticas">
          <div className="bg-[rgba(201,168,76,0.07)] border border-[rgba(201,168,76,0.2)] rounded-xl p-5 space-y-3">
            <p>
              O Âmbar Beauty Studio utiliza a{" "}
              <strong>API do WhatsApp Business (Meta Platforms)</strong> para enviar mensagens
              relacionadas ao agendamento, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
              <li>Confirmação do agendamento solicitado;</li>
              <li>Instruções para pagamento do sinal (quando aplicável);</li>
              <li>Lembrete do serviço com data e horário;</li>
              <li>Mensagem de avaliação após a conclusão do atendimento.</li>
            </ul>
            <p>
              <strong>Ao concluir um agendamento em nosso site, você consente expressamente</strong>{" "}
              no recebimento dessas mensagens no número de WhatsApp informado. Esse consentimento é
              necessário para a prestação do serviço contratado.
            </p>
            <p>
              Você pode solicitar a interrupção do envio de mensagens a qualquer momento entrando
              em contato diretamente conosco pelo WhatsApp ou pelo e-mail de contato disponível em
              nosso site.
            </p>
          </div>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <p>
            Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.
            Seus dados podem ser compartilhados apenas com:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>
              <strong className="text-[#F5F0E8]">Supabase</strong> — plataforma de banco de dados
              onde os agendamentos são armazenados com segurança (servidores na AWS);
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Meta Platforms (Facebook/Instagram)</strong> —
              dados anonimizados de conversão para mensuração de campanhas;
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Google</strong> — dados de uso via Google
              Analytics 4 (anonimizados) e integração com Google Calendar para gestão de agenda;
            </li>
            <li>
              Autoridades públicas, quando exigido por lei ou ordem judicial.
            </li>
          </ul>
        </Section>

        <Section title="6. Armazenamento e segurança">
          <p>
            Seus dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS) e
            em repouso. O acesso ao painel administrativo é restrito e protegido por autenticação.
            Mantemos seus dados pelo tempo necessário para a prestação dos serviços e cumprimento
            de obrigações legais.
          </p>
        </Section>

        <Section title="7. Seus direitos (LGPD)">
          <p>Conforme a LGPD, você tem direito a:</p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>Confirmar a existência de tratamento dos seus dados;</li>
            <li>Acessar os dados que possuímos sobre você;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação dos seus dados;</li>
            <li>Revogar o consentimento a qualquer momento;</li>
            <li>Solicitar informações sobre o compartilhamento dos seus dados.</li>
          </ul>
          <p>
            Para exercer qualquer desses direitos, entre em contato conosco pelo WhatsApp ou pelo
            e-mail disponível em nosso site.
          </p>
        </Section>

        <Section title="8. Cookies e rastreamento">
          <p>
            Nosso site utiliza cookies para funcionamento básico e rastreamento analítico. Os
            principais cookies utilizados são:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>
              <strong className="text-[#F5F0E8]">_ga, _ga_*</strong> — Google Analytics 4, para
              análise de tráfego (anonimizado);
            </li>
            <li>
              <strong className="text-[#F5F0E8]">_fbp, _fbc</strong> — Meta Pixel, para mensuração
              de campanhas no Facebook e Instagram.
            </li>
          </ul>
          <p>
            Você pode desativar cookies nas configurações do seu navegador, porém algumas
            funcionalidades do site podem ser afetadas.
          </p>
        </Section>

        <Section title="9. Alterações nesta política">
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Alterações relevantes
            serão comunicadas por meio do nosso site. O uso continuado do site após as alterações
            implica aceitação da nova versão.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>
            Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em
            contato:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>
              <strong className="text-[#F5F0E8]">WhatsApp:</strong> disponível no site
            </li>
            <li>
              <strong className="text-[#F5F0E8]">Local:</strong> Passos, MG, Brasil
            </li>
          </ul>
        </Section>

        {/* Rodapé da página */}
        <footer className="pt-8 border-t border-[rgba(201,168,76,0.15)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#6B7280]">
          <span>© {new Date().getFullYear()} Âmbar Beauty Studio. Todos os direitos reservados.</span>
          <Link href="/termos" className="hover:text-[#C9A84C] transition-colors">
            Termos de Uso →
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-medium text-[#C9A84C]">{title}</h2>
      <div className="space-y-3 text-[#D4CDBE] font-sans text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}
