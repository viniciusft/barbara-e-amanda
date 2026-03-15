import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST /api/admin/site/fotos — multipart: file, file_mobile?, pagina, tipo_exibicao, titulo?
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Erro ao ler dados" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const fileMobile = formData.get("file_mobile") as File | null;
  const pagina = (formData.get("pagina") as string | null) ?? "maquiagem-social";
  const tipoExibicao = (formData.get("tipo_exibicao") as string | null) ?? "carrossel";
  const titulo = (formData.get("titulo") as string | null) || null;

  if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type))
    return NextResponse.json({ error: "Tipo inválido. Use JPG, PNG ou WebP" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Máximo 5MB" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const ts = Date.now();
  const storagePath = `galeria/${pagina}/${ts}.${ext}`;

  const db = createServerSupabaseClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from("studio-images")
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from("studio-images").getPublicUrl(storagePath);

  // Optional mobile image
  let mobileUrl: string | null = null;
  if (fileMobile && validTypes.includes(fileMobile.type) && fileMobile.size <= 5 * 1024 * 1024) {
    const mobileExt = fileMobile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const mobilePath = `galeria/${pagina}/${ts}-mobile.${mobileExt}`;
    const mobileBuffer = await fileMobile.arrayBuffer();
    const { error: mobileErr } = await db.storage
      .from("studio-images")
      .upload(mobilePath, mobileBuffer, { contentType: fileMobile.type, upsert: false });
    if (!mobileErr) {
      const { data: { publicUrl: mu } } = db.storage.from("studio-images").getPublicUrl(mobilePath);
      mobileUrl = mu;
    }
  }

  // Compute next ordem
  const { data: maxData } = await db
    .from("galeria")
    .select("ordem")
    .eq("pagina", pagina)
    .order("ordem", { ascending: false })
    .limit(1)
    .single();
  const nextOrdem = (maxData?.ordem ?? 0) + 1;

  const insertData: Record<string, unknown> = {
    pagina,
    tipo_exibicao: tipoExibicao,
    imagem_url: publicUrl,
    titulo,
    categoria: "maquiagem",
    ordem: nextOrdem,
    ativo: true,
  };
  if (mobileUrl) insertData.imagem_mobile_url = mobileUrl;

  const { data: foto, error: insertError } = await db
    .from("galeria")
    .insert(insertData)
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ foto }, { status: 201 });
}
