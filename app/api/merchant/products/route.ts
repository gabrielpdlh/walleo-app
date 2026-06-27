import { NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/merchant-auth";
import { createProduct, listMerchantProducts } from "@/db/merchant";

export async function GET() {
  const slug = await getSessionSlug();
  if (!slug) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  try {
    const items = await listMerchantProducts(slug);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[merchant] erro ao listar produtos:", err);
    return NextResponse.json(
      { error: "Falha ao carregar produtos." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const slug = await getSessionSlug();
  if (!slug) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: {
    name?: string;
    priceCents?: number;
    description?: string | null;
    imageUrl?: string | null;
    category?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (name.length < 1) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (!Number.isInteger(body.priceCents) || (body.priceCents ?? 0) <= 0) {
    return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
  }

  try {
    const product = await createProduct(slug, {
      name,
      priceCents: body.priceCents!,
      description: body.description?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      category: body.category?.trim() || null,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[merchant] erro ao criar produto:", err);
    return NextResponse.json(
      { error: "Falha ao criar produto." },
      { status: 500 },
    );
  }
}
