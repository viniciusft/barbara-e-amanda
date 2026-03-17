// Envia eventos para o Facebook CAPI via servidor
// Não é bloqueado por AdBlock nem por iOS

const PIXEL_ID = process.env.META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const CAPI_URL = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_source_url?: string;
  user_data?: {
    em?: string;   // email hasheado SHA-256
    ph?: string;   // telefone hasheado SHA-256
    fn?: string;   // primeiro nome hasheado SHA-256
    ln?: string;   // sobrenome hasheado SHA-256
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;  // cookie _fbc
    fbp?: string;  // cookie _fbp
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
  };
}

// Hash SHA-256 obrigatório pela Meta para dados pessoais
async function hashData(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function enviarEventoCAPI(
  evento: CAPIEvent,
  dados?: { email?: string; telefone?: string; nome?: string }
) {
  console.log("[CAPI] config:", {
    pixelId: PIXEL_ID ? "OK" : "MISSING",
    token: CAPI_TOKEN ? "OK" : "MISSING",
    capiUrl: CAPI_URL,
    event: evento.event_name,
  });
  if (!PIXEL_ID || !CAPI_TOKEN) {
    console.log("[CAPI] abortando — variáveis de ambiente ausentes");
    return;
  }

  try {
    const userData: CAPIEvent["user_data"] = { ...evento.user_data };

    if (dados?.email) {
      userData.em = await hashData(dados.email);
    }
    if (dados?.telefone) {
      const tel = dados.telefone.replace(/\D/g, "");
      userData.ph = await hashData(tel.startsWith("55") ? tel : `55${tel}`);
    }
    if (dados?.nome) {
      const partes = dados.nome.trim().split(" ");
      userData.fn = await hashData(partes[0]);
      if (partes.length > 1) {
        userData.ln = await hashData(partes[partes.length - 1]);
      }
    }

    const payload: Record<string, unknown> = {
      data: [
        {
          ...evento,
          user_data: userData,
          event_time: Math.floor(Date.now() / 1000),
        },
      ],
      access_token: CAPI_TOKEN,
    };

    // Test event code só em development para não poluir dados reais
    if (process.env.NODE_ENV === "development") {
      payload.test_event_code = "TEST12345";
    }

    console.log("[CAPI] enviando para:", CAPI_URL);
    const res = await fetch(CAPI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const resText = await res.text();
    console.log("[CAPI] resposta:", res.status, resText);
  } catch (error) {
    // Nunca deixar erro de analytics quebrar o fluxo principal
    console.error("CAPI error:", error);
  }
}

// Funções prontas para cada evento do agendamento
export const metaEvents = {
  // Alguém visualizou uma página
  pageView: (url: string) =>
    enviarEventoCAPI({
      event_name: "PageView",
      event_time: 0,
      event_source_url: url,
    }),

  // Clicou em Agendar
  iniciarAgendamento: (url: string) =>
    enviarEventoCAPI({
      event_name: "InitiateCheckout",
      event_time: 0,
      event_source_url: url,
      custom_data: { content_category: "agendamento" },
    }),

  // Selecionou um serviço
  selecionouServico: (servico: string, preco: number, url: string) =>
    enviarEventoCAPI({
      event_name: "ViewContent",
      event_time: 0,
      event_source_url: url,
      custom_data: {
        content_name: servico,
        content_category: "servico",
        value: preco,
        currency: "BRL",
      },
    }),

  // Agendamento concluído — evento mais importante para otimização de campanhas
  agendamentoConcluido: (
    servico: string,
    preco: number,
    url: string,
    dados: { email?: string; telefone?: string; nome?: string }
  ) =>
    enviarEventoCAPI(
      {
        event_name: "Lead",
        event_time: 0,
        event_source_url: url,
        custom_data: {
          content_name: servico,
          content_category: "agendamento_concluido",
          value: preco,
          currency: "BRL",
        },
      },
      dados
    ),

  // Serviço executado — receita real confirmada (Purchase)
  servicoExecutado: (
    servico: string,
    preco: number,
    dados: { email?: string; telefone?: string; nome?: string }
  ) =>
    enviarEventoCAPI(
      {
        event_name: "Purchase",
        event_time: 0,
        custom_data: {
          content_name: servico,
          value: preco,
          currency: "BRL",
        },
      },
      dados
    ),
};
