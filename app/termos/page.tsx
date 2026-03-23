import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de Uso do Âmbar Beauty Studio. Condições para utilização do site e do sistema de agendamento online.",
  robots: { index: false, follow: false },
};

export default function TermosPage() {
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
            Termos de Uso
          </h1>
          <p className="text-sm text-[#9CA3AF] font-sans mt-3">
            Vigência a partir de: <strong className="text-[#F5F0E8]">22 de março de 2026</strong>
          </p>
        </header>

        <Section title="1. Aceitação dos termos">
          <p>
            Ao acessar e utilizar o site <span className="text-[#C9A84C]">ambarbeautystudio.com.br</span> e
            o sistema de agendamento online do <strong>Âmbar Beauty Studio</strong>, você declara
            ter lido, compreendido e concordado com estes Termos de Uso em sua totalidade.
          </p>
          <p>
            Caso não concorde com qualquer disposição destes termos, solicitamos que não utilize
            nossos serviços online.
          </p>
        </Section>

        <Section title="2. Sobre o serviço">
          <p>
            O Âmbar Beauty Studio é um studio de maquiagem e penteado localizado em Passos, MG,
            Brasil. Através deste site, disponibilizamos:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>Informações sobre nossos serviços e preços;</li>
            <li>Sistema de agendamento online;</li>
            <li>Galeria de trabalhos realizados;</li>
            <li>Canais de contato direto.</li>
          </ul>
        </Section>

        <Section title="3. Sistema de agendamento">
          <p>
            O agendamento online é uma <strong>solicitação</strong> de reserva de horário, sujeita
            à confirmação pelo studio. O agendamento é considerado <strong>confirmado</strong>{" "}
            somente após:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>Recebimento da confirmação via WhatsApp pela equipe do studio;</li>
            <li>
              Pagamento do sinal (quando aplicável), conforme valor e instruções informadas no
              contato de confirmação.
            </li>
          </ul>
          <p>
            A solicitação de agendamento não garante a reserva do horário até que a confirmação
            seja realizada.
          </p>
        </Section>

        <Section title="4. Sinal e pagamento">
          <p>
            Alguns serviços exigem o pagamento de um sinal antecipado para garantia do horário. O
            valor, a forma de pagamento e o prazo serão informados no contato de confirmação via
            WhatsApp.
          </p>
          <p>
            O sinal é não reembolsável em caso de cancelamento sem aviso prévio de no mínimo{" "}
            <strong>48 horas antes</strong> do horário agendado, salvo em casos de força maior
            devidamente comprovados, a critério do studio.
          </p>
        </Section>

        <Section title="5. Cancelamento e reagendamento">
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>
              Cancelamentos com aviso de <strong>48 horas ou mais</strong> de antecedência podem
              ter o sinal reembolsado ou convertido em crédito para novo agendamento, conforme
              combinado;
            </li>
            <li>
              Cancelamentos com menos de 48 horas de antecedência implicam perda do sinal;
            </li>
            <li>
              Não comparecimento sem aviso prévio implica perda do sinal e possível restrição para
              novos agendamentos;
            </li>
            <li>
              Reagendamentos estão sujeitos à disponibilidade de horários e devem ser solicitados
              com antecedência pelo WhatsApp.
            </li>
          </ul>
        </Section>

        <Section title="6. Mensagens via WhatsApp">
          <div className="bg-[rgba(201,168,76,0.07)] border border-[rgba(201,168,76,0.2)] rounded-xl p-5 space-y-3">
            <p>
              Ao realizar um agendamento, você <strong>consente expressamente</strong> no
              recebimento de mensagens via <strong>WhatsApp Business API</strong> relacionadas ao
              seu agendamento, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
              <li>Confirmação e detalhes do agendamento;</li>
              <li>Instruções para pagamento do sinal;</li>
              <li>Lembrete com data e horário do serviço;</li>
              <li>Pesquisa de satisfação após o atendimento.</li>
            </ul>
            <p>
              Essas mensagens são enviadas pelo número oficial do studio e têm caráter
              exclusivamente transacional, relacionado ao serviço contratado. Não enviamos
              publicidade não solicitada.
            </p>
            <p>
              Você pode solicitar a interrupção do envio de mensagens a qualquer momento
              respondendo diretamente ao WhatsApp do studio.
            </p>
          </div>
        </Section>

        <Section title="7. Responsabilidades do cliente">
          <p>Ao utilizar nosso sistema de agendamento, o cliente se compromete a:</p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>Fornecer informações verídicas e atualizadas;</li>
            <li>Comparecer no horário agendado ou avisar com antecedência em caso de impedimento;</li>
            <li>
              Comunicar com antecedência qualquer condição de saúde, alergia ou sensibilidade a
              produtos cosméticos que possa interferir no serviço;
            </li>
            <li>Utilizar o site e o sistema de agendamento de boa-fé e para fins lícitos.</li>
          </ul>
        </Section>

        <Section title="8. Propriedade intelectual">
          <p>
            Todo o conteúdo deste site — incluindo textos, imagens, logotipos, identidade visual e
            fotografias dos trabalhos realizados — é de propriedade do Âmbar Beauty Studio e
            protegido pela legislação de direitos autorais brasileira.
          </p>
          <p>
            É proibida a reprodução, distribuição ou utilização do conteúdo sem autorização prévia
            e expressa do studio.
          </p>
        </Section>

        <Section title="9. Limitação de responsabilidade">
          <p>O Âmbar Beauty Studio não se responsabiliza por:</p>
          <ul className="list-disc list-inside space-y-1 text-[#D4CDBE] pl-2">
            <li>
              Indisponibilidade temporária do site por manutenção ou falhas técnicas de terceiros;
            </li>
            <li>
              Resultados estéticos que possam variar em função de características individuais de
              cada cliente;
            </li>
            <li>
              Reações alérgicas a produtos cosméticos não informadas previamente pelo cliente.
            </li>
          </ul>
        </Section>

        <Section title="10. Privacidade">
          <p>
            O tratamento dos seus dados pessoais é regido por nossa{" "}
            <Link
              href="/privacidade"
              className="text-[#C9A84C] hover:underline"
            >
              Política de Privacidade
            </Link>
            , que integra estes Termos de Uso por referência.
          </p>
        </Section>

        <Section title="11. Alterações nos termos">
          <p>
            Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento. As
            alterações entrarão em vigor imediatamente após a publicação no site. O uso continuado
            dos serviços após a publicação das alterações constitui aceitação dos novos termos.
          </p>
        </Section>

        <Section title="12. Lei aplicável e foro">
          <p>
            Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer
            disputa decorrente da utilização do site ou dos serviços será submetida ao foro da
            Comarca de <strong>Passos, MG</strong>, com renúncia expressa a qualquer outro, por
            mais privilegiado que seja.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>
            Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo WhatsApp disponível
            em nosso site ou pessoalmente em Passos, MG.
          </p>
        </Section>

        {/* Rodapé da página */}
        <footer className="pt-8 border-t border-[rgba(201,168,76,0.15)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#6B7280]">
          <span>© {new Date().getFullYear()} Âmbar Beauty Studio. Todos os direitos reservados.</span>
          <Link href="/privacidade" className="hover:text-[#C9A84C] transition-colors">
            Política de Privacidade →
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
