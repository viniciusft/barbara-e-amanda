"use server";
import { revalidatePath } from "next/cache";

export async function revalidarPagina(path: string) {
  revalidatePath(path);
}
