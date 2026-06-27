import { NextResponse } from "next/server";
import { confirmTopUp, findTopUpByConfrapix, updateTopUpStatus } from "@/lib/store";

/**
 * Webhook chamado pela Confrapix (callback_url) quando o status da transação muda.
 * Idempotente: confirmar duas vezes não credita em dobro (ver store.confirmTopUp).
 *
 * Sempre responde 200 para evitar retentativas desnecessárias após processarmos.
 */
export async function POST(req: Request) {
  let payload: {
    id?: number;
    uuid?: string;
    status?: string;
    confirmed?: boolean;
    pix?: { txid?: string | null };
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ received: false, error: "JSON inválido." }, { status: 400 });
  }

  const topUp = findTopUpByConfrapix({
    uuid: payload.uuid,
    confrapixId: payload.id,
    txid: payload.pix?.txid ?? null,
  });

  if (!topUp) {
    // Não conhecemos esta transação — confirma o recebimento mesmo assim.
    return NextResponse.json({ received: true, matched: false });
  }

  if (payload.confirmed || payload.status === "succeeded") {
    confirmTopUp(topUp.id);
  } else if (payload.status === "canceled") {
    updateTopUpStatus(topUp.id, "canceled");
  } else if (payload.status === "expired") {
    updateTopUpStatus(topUp.id, "expired");
  }

  return NextResponse.json({ received: true, matched: true });
}
