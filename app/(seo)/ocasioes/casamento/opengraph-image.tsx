import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Maquiagem e Penteado para Casamento em Passos MG | Âmbar Beauty Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid rgba(201,168,76,0.25)",
            margin: "24px",
          }}
        />
        <p
          style={{
            color: "#C9A84C",
            fontSize: 18,
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            marginBottom: 32,
            fontFamily: "sans-serif",
          }}
        >
          Âmbar Beauty Studio · Passos MG
        </p>
        <p
          style={{
            color: "#F5F0E8",
            fontSize: 60,
            fontWeight: 300,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.15,
            fontFamily: "serif",
            margin: 0,
          }}
        >
          Maquiagem e Penteado para Casamento
        </p>
        <p
          style={{
            color: "rgba(245,240,232,0.45)",
            fontSize: 22,
            marginTop: 28,
            fontFamily: "sans-serif",
          }}
        >
          Dia da noiva completo em Passos MG
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
