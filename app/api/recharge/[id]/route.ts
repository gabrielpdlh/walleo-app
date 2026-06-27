import { NextResponse } from "next/server";
import { getTransaction } from "@/lib/confrapix";
import {
  creditTopUp,
  getTopUpRow,
  markTopUpStatus,
  type TopUpRow,
} from "@/db/wallet";

const TERMINAL = ["confirmed", "failed", "expired", "canceled"];

function serialize(topUp: TopUpRow) {
  return {
    id: topUp.id,
    status: topUp.status,
    amountCents: topUp.amountCents,
    expiresAt: topUp.expiresAt ? topUp.expiresAt.toISOString() : null,
    confirmedAt: topUp.confirmedAt ? topUp.confirmedAt.toISOString() : null,
    pix: {
      qrUrl: topUp.pixQrCode,
      copyPasteCode: topUp.pixCopyPasteCode,
      txid: topUp.txid,
    },
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const topUp = await getTopUpRow(id);
  if (!topUp) {
    return NextResponse.json(
      { error: "Recarga não encontrada." },
      { status: 404 },
    );
  }

  // Se ainda não é terminal, o webhook pode não ter chegado (ex.: local sem
  // túnel público). Re-consulta a Confrapix como fonte de verdade.
  if (!TERMINAL.includes(topUp.status) && topUp.providerTransactionId) {
    try {
      const tx = await getTransaction(topUp.providerTransactionId);
      if (tx) {
        if (tx.confirmed || tx.status === "succeeded") {
          await creditTopUp(topUp.id);
        } else if (tx.status === "canceled") {
          await markTopUpStatus(topUp.id, "canceled");
        } else if (tx.status === "expired") {
          await markTopUpStatus(topUp.id, "expired");
        }
      }
    } catch {
      // Falha de consulta não deve quebrar o polling do frontend.
    }
  }

  // Rota não-gateada (polling por id opaco): NÃO expõe saldo de carteira aqui.
  // O frontend, ao ver "confirmed", busca o saldo na rota gateada /api/wallet.
  const fresh = (await getTopUpRow(id))!;
  return NextResponse.json({ topUp: serialize(fresh) });
}
