"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Loader2, MessageCircle, ArrowRight, Info } from "lucide-react";

/* ── Tipagem mínima do Facebook JS SDK ────────────────────────────── */
declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        autoLogAppEvents: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: { code: string } | null;
          status: string;
        }) => void,
        params: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: { featureType: string; sessionInfoVersion: string };
        }
      ) => void;
    };
  }
}

interface ConnectionResult {
  access_token: string;
  waba_id: string | null;
  phone_number_id: string | null;
}

type Status = "idle" | "loading" | "success" | "error";

export default function WhatsAppSetupPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<ConnectionResult | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const sessionInfoRef = useRef<{ wabaId: string; phoneNumberId: string } | null>(null);

  const configId = "2205757726897177";

  /* ── Carregar e inicializar o Facebook SDK diretamente ───────── */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.FB.init({
        appId: "1642748973646659",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v22.0",
      });
      setSdkReady(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Trocar code pelo token via API route ─────────────────────── */
  async function exchangeToken(
    code: string,
    wabaId?: string,
    phoneNumberId?: string
  ) {
    setStatus("loading");
    try {
      const res = await fetch("/api/whatsapp/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, wabaId, phoneNumberId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Erro desconhecido ao trocar token");
      }

      setResult(data as ConnectionResult);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  /* ── Abrir fluxo Embedded Signup ──────────────────────────────── */
  function launchEmbeddedSignup() {
    sessionInfoRef.current = null;
    setStatus("idle");
    setErrorMsg("");
    setResult(null);

    /* Captura WABA ID e Phone Number ID do evento de mensagem do popup */
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com") return;
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string;
          event?: string;
          data?: { phone_number_id?: string; waba_id?: string };
        };
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH" && data.data) {
            sessionInfoRef.current = {
              wabaId: data.data.waba_id ?? "",
              phoneNumberId: data.data.phone_number_id ?? "",
            };
          }
        }
      } catch {
        // mensagens não-JSON do Facebook; ignorar
      }
    }

    window.addEventListener("message", handleMessage);

    window.FB.login(
      (response) => {
        window.removeEventListener("message", handleMessage);

        if (response.authResponse?.code) {
          const info = sessionInfoRef.current;
          exchangeToken(
            response.authResponse.code,
            info?.wabaId,
            info?.phoneNumberId
          );
        } else {
          if (response.status !== "connected") {
            setErrorMsg("Fluxo cancelado ou não autorizado.");
            setStatus("error");
          }
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          featureType: "coex",
          sessionInfoVersion: "3",
        },
      }
    );
  }

  return (
    <div className="py-8 space-y-8 max-w-2xl">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <MessageCircle size={22} className="text-[var(--gold)]" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            WhatsApp Cloud API — Coexistência
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] ml-[34px]">
          Conecte o número +55 35 9196‑2702 à Cloud API sem remover o WhatsApp Business App.
        </p>
      </div>

      {/* Card de informações */}
      <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--gold)] mt-0.5 shrink-0" />
          <div className="space-y-1.5 text-sm text-[var(--text-secondary)]">
            <p>
              O fluxo <strong className="text-[var(--text-primary)]">Embedded Signup</strong> abre
              um popup da Meta onde você autoriza o acesso à sua conta WhatsApp Business.
            </p>
            <p>
              Ao concluir, o sistema salva automaticamente o{" "}
              <strong className="text-[var(--text-primary)]">WABA ID</strong> e o{" "}
              <strong className="text-[var(--text-primary)]">Phone Number ID</strong> no banco de
              dados. Adicione o <code className="text-[var(--gold)] text-xs">WHATSAPP_APP_SECRET</code>{" "}
              e o <code className="text-[var(--gold)] text-xs">WHATSAPP_ACCESS_TOKEN</code> nas
              variáveis de ambiente antes de continuar.
            </p>
          </div>
        </div>
      </div>

      {/* Estado: sucesso */}
      {status === "success" && result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle size={18} />
            Conexão estabelecida com sucesso!
          </div>
          <div className="space-y-2 text-sm font-mono">
            <Row label="WABA ID" value={result.waba_id ?? "—"} />
            <Row label="Phone Number ID" value={result.phone_number_id ?? "—"} />
            <Row
              label="Access Token"
              value={
                result.access_token
                  ? `${result.access_token.slice(0, 24)}…`
                  : "—"
              }
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Os IDs foram salvos no banco de dados. Adicione o{" "}
            <code className="text-[var(--gold)]">WHATSAPP_ACCESS_TOKEN</code> permanente
            (System User) nas variáveis de ambiente da Vercel para enviar mensagens.
          </p>
        </div>
      )}

      {/* Estado: erro */}
      {status === "error" && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{errorMsg}</p>
        </div>
      )}

      {/* Botão principal — desabilitado até o FB.init() completar */}
      <button
        onClick={launchEmbeddedSignup}
        disabled={!sdkReady || status === "loading"}
        className="flex items-center gap-2.5 px-6 py-3 rounded-lg font-medium text-sm
          bg-[var(--gold)] text-[#111] hover:bg-[var(--gold-light)] active:bg-[var(--gold-dark)]
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {!sdkReady ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Aguardando SDK…
          </>
        ) : status === "loading" ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processando…
          </>
        ) : (
          <>
            <MessageCircle size={16} />
            {status === "success" ? "Reconectar WhatsApp" : "Conectar WhatsApp via Coexistência"}
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[var(--text-secondary)] w-40 shrink-0">{label}</span>
      <span className="text-[var(--text-primary)] break-all">{value}</span>
    </div>
  );
}
