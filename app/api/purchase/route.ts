import { NextResponse } from "next/server";
import { InsufficientBalanceError, recordPurchase } from "@/lib/store";

export async function POST(req: Request) {
  let body: {
    walletId?: string;
    amountCents?: number;
    merchantName?: string;
    itemName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { walletId, amountCents, merchantName, itemName } = body;

  if (!walletId) {
    return NextResponse.json({ error: "walletId é obrigatório." }, { status: 400 });
  }
  if (!Number.isInteger(amountCents) || (amountCents ?? 0) <= 0) {
    return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  }

  try {
    const { wallet, entry } = recordPurchase({
      walletId,
      amountCents: amountCents!,
      merchantName: merchantName ?? "Estabelecimento",
      itemName: itemName ?? "Compra",
    });
    return NextResponse.json({ wallet, entry });
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Falha ao registrar compra." }, { status: 500 });
  }
}
