import { NextResponse } from "next/server";
import { creditTopUp, findTopUpByProvider, markTopUpStatus } from "@/db/wallet";

/**
 * Webhook chamado pela Confrapix (callback_url) quando o status da transação muda.
 * Idempotente: confirmar duas vezes não credita em dobro (ver creditTopUp:
 * o índice único do ledger barra o crédito repetido).
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
    return NextResponse.json(
      { received: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const topUp = await findTopUpByProvider({
    uuid: payload.uuid,
    providerTransactionId: payload.id != null ? String(payload.id) : null,
    txid: payload.pix?.txid ?? null,
  });

  if (!topUp) {
    // Não conhecemos esta transação — confirma o recebimento mesmo assim.
    return NextResponse.json({ received: true, matched: false });
  }

  try {
    if (payload.confirmed || payload.status === "succeeded") {
      await creditTopUp(topUp.id);
    } else if (payload.status === "canceled") {
      await markTopUpStatus(topUp.id, "canceled");
    } else if (payload.status === "expired") {
      await markTopUpStatus(topUp.id, "expired");
    }
  } catch (err) {
    console.error("[webhook] erro ao processar recarga:", err);
    // Ainda responde 200: a Confrapix não deve ficar retentando indefinidamente;
    // o polling do frontend reconcilia o estado.
  }

  return NextResponse.json({ received: true, matched: true });
}
