import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "America/Sao_Paulo";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = params;
  const supabase = createServerSupabaseClient();

  const { data: a, error } = await supabase
    .from("agendamentos")
    .select("*, servico:servicos(*)")
    .eq("id", id)
    .single();

  if (error || !a) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const maqStartBRT = toZonedTime(new Date(a.data_hora), TZ);
  const endBRT = toZonedTime(new Date(a.data_hora_fim), TZ);
  let displayStart = maqStartBRT;
  if (a.data_hora_cabelo && new Date(a.data_hora_cabelo) < new Date(a.data_hora)) {
    displayStart = toZonedTime(new Date(a.data_hora_cabelo), TZ);
  }
  const extra: Record<string, string> = {
    data: format(displayStart, "yyyy-MM-dd"),
    hora_inicio: format(displayStart, "HH:mm"),
    hora_fim: format(endBRT, "HH:mm"),
  };
  if (a.data_hora_cabelo) {
    extra.hora_inicio_cabelo = format(toZonedTime(new Date(a.data_hora_cabelo), TZ), "HH:mm");
    extra.hora_inicio_maquiagem = format(maqStartBRT, "HH:mm");
  }

  return NextResponse.json({ ...a, ...extra });
}
