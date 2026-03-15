import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/admin/galeria?pagina=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const pagina = req.nextUrl.searchParams.get("pagina");

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("galeria")
    .select("id, pagina, url, titulo, ativo, ordem")
    .order("ordem", { ascending: true });

  if (pagina) query = query.eq("pagina", pagina);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ fotos: data ?? [] });
}

// POST /api/admin/galeria — multipart: file + pagina + titulo? + ordem?
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
  const pagina = formData.get("pagina") as string | null;
  const titulo = (formData.get("titulo") as string | null) || null;

  if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  if (!pagina) return NextResponse.json({ error: "Página obrigatória" }, { status: 400 });

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type))
    return NextResponse.json({ error: "Tipo inválido. Use JPG, PNG ou WebP" }, { status: 400 });

  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Máximo 5MB" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `galeria/${pagina}/${Date.now()}.${ext}`;

  const supabase = createServerSupabaseClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("studio-images")
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("studio-images")
    .getPublicUrl(storagePath);

  // Determine next ordem
  const { data: maxData } = await supabase
    .from("galeria")
    .select("ordem")
    .eq("pagina", pagina)
    .order("ordem", { ascending: false })
    .limit(1)
    .single();

  const nextOrdem = (maxData?.ordem ?? 0) + 1;

  const { data: foto, error: insertError } = await supabase
    .from("galeria")
    .insert({ pagina, url: publicUrl, titulo, ativo: true, ordem: nextOrdem })
    .select()
    .single();

  if (insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ foto }, { status: 201 });
}
