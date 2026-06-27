import { NextResponse } from "next/server";
import { getSessionSlug } from "@/lib/merchant-auth";
import {
  MerchantNotFoundError,
  OrderExpiredError,
  OrderNotFoundError,
  OrderNotRedeemableError,
  OrderWrongMerchantError,
  redeemOrder,
} from "@/db/merchant";

function notRedeemableMessage(status: string): string {
  switch (status) {
    case "redeemed":
      return "Pedido já foi resgatado.";
    case "cancelled":
      return "Pedido foi cancelado pelo cliente.";
    case "expired":
      return "Pedido expirado.";
    default:
      return "Pedido não pode ser resgatado.";
  }
}

export async function POST(req: Request) {
  const slug = await getSessionSlug();
  if (!slug) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "Código do QR inválido." }, { status: 400 });
  }

  try {
    const result = await redeemOrder({ token: body.token, merchantSlug: slug });
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof OrderWrongMerchantError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof OrderExpiredError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof OrderNotRedeemableError) {
      return NextResponse.json(
        { error: notRedeemableMessage(err.status), status: err.status },
        { status: 409 },
      );
    }
    if (err instanceof MerchantNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("[merchant] erro ao resgatar pedido:", err);
    return NextResponse.json(
      { error: "Falha ao resgatar pedido." },
      { status: 500 },
    );
  }
}
