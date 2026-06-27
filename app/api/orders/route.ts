import { NextResponse } from "next/server";
import { getSessionWalletId } from "@/lib/customer-auth";
import {
  createOrder,
  EmptyCartError,
  InsufficientBalanceError,
  listOrders,
  MerchantNotFoundError,
  ProductUnavailableError,
} from "@/db/orders";

export async function GET() {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  try {
    const items = await listOrders(walletId);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[orders] erro ao listar pedidos:", err);
    return NextResponse.json(
      { error: "Falha ao carregar pedidos." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: {
    merchantSlug?: string;
    items?: { productId: string; quantity: number }[];
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.merchantSlug || typeof body.merchantSlug !== "string") {
    return NextResponse.json(
      { error: "Estabelecimento é obrigatório." },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  }

  try {
    const order = await createOrder({
      walletId,
      merchantSlug: body.merchantSlug,
      items: body.items,
      note: body.note ?? null,
    });
    // Não expor o qr_token em texto puro — só id e total.
    return NextResponse.json(
      { order: { orderId: order.orderId, totalCents: order.totalCents } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof EmptyCartError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof MerchantNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ProductUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[orders] erro ao criar pedido:", err);
    return NextResponse.json(
      { error: "Falha ao criar pedido." },
      { status: 500 },
    );
  }
}
