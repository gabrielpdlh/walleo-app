import { NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/merchant-auth";
import {
  deleteProduct,
  ProductNotFoundError,
  updateProduct,
  type ProductInput,
} from "@/db/merchant";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const slug = await getSessionSlug();
  if (!slug) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;

  let body: {
    name?: string;
    priceCents?: number;
    description?: string | null;
    imageUrl?: string | null;
    category?: string | null;
    active?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const data: ProductInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 1) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }
    data.name = name;
  }
  if (body.priceCents !== undefined) {
    if (!Number.isInteger(body.priceCents) || body.priceCents <= 0) {
      return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
    }
    data.priceCents = body.priceCents;
  }
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl?.trim() || null;
  if (body.category !== undefined) data.category = body.category?.trim() || null;
  if (body.active !== undefined) data.active = !!body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  try {
    await updateProduct(slug, id, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[merchant] erro ao atualizar produto:", err);
    return NextResponse.json(
      { error: "Falha ao atualizar produto." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const slug = await getSessionSlug();
  if (!slug) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;

  try {
    await deleteProduct(slug, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[merchant] erro ao excluir produto:", err);
    return NextResponse.json(
      { error: "Falha ao excluir produto." },
      { status: 500 },
    );
  }
}
