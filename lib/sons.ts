// Web Audio API sound effects — no external dependencies
// AudioContext is created lazily on first call (requires prior user interaction)

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const W = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext ?? W.webkitAudioContext;
    if (!Ctx) return null;
    try { audioCtx = new Ctx(); } catch { return null; }
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === "suspended") { audioCtx.resume().catch(() => {}); }
  return audioCtx;
}

function tocarNota(freq: number, duracao: number, ganho: number) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(ganho, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao);
    osc.start();
    osc.stop(ctx.currentTime + duracao);
  } catch { /* ignore audio errors */ }
}

export function tocarSom(tipo: "selecao" | "avanco" | "sucesso") {
  if (typeof window === "undefined") return;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch { return; }

  if (tipo === "selecao") {
    tocarNota(523, 0.1, 0.1); // Dó suave
  } else if (tipo === "avanco") {
    tocarNota(659, 0.15, 0.12); // Mi — avanço de etapa
  } else if (tipo === "sucesso") {
    // Arpejo Dó–Mi–Sol — confirmação
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => tocarNota(f, 0.4, 0.12), i * 80);
    });
  }
}
