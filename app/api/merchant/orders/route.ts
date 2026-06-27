import { NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/merchant-auth";
import { listMerchantOrders } from "@/db/merchant";

export async function GET() {
  const slug = await getSessionSlug();
  if (!slug) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  try {
    const items = await listMerchantOrders(slug);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[merchant] erro ao listar pedidos:", err);
    return NextResponse.json(
      { error: "Falha ao carregar pedidos." },
      { status: 500 },
    );
  }
}
