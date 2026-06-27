import { NextResponse } from "next/server";
import { getTransaction } from "@/lib/confrapix";
import {
  confirmTopUp,
  getOrCreateWallet,
  getTopUp,
  updateTopUpStatus,
  type TopUp,
} from "@/lib/store";

function serialize(topUp: TopUp) {
  return {
    id: topUp.id,
    status: topUp.status,
    amountCents: topUp.amountCents,
    expiresAt: topUp.expiresAt,
    confirmedAt: topUp.confirmedAt,
    pix: {
      qrUrl: topUp.qrUrl,
      copyPasteCode: topUp.copyPasteCode,
      txid: topUp.txid,
    },
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const topUp = getTopUp(id);
  if (!topUp) {
    return NextResponse.json({ error: "Recarga não encontrada." }, { status: 404 });
  }

  // Se ainda não é terminal, o webhook pode não ter chegado (ex.: local sem
  // túnel público). Re-consulta a Confrapix como fonte de verdade.
  const terminal = ["confirmed", "failed", "expired", "canceled"];
  if (!terminal.includes(topUp.status)) {
    try {
      const tx = await getTransaction(topUp.confrapixId);
      if (tx) {
        if (tx.confirmed || tx.status === "succeeded") {
          confirmTopUp(topUp.id);
        } else if (tx.status === "canceled") {
          updateTopUpStatus(topUp.id, "canceled");
        } else if (tx.status === "expired") {
          updateTopUpStatus(topUp.id, "expired");
        }
      }
    } catch {
      // Falha de consulta não deve quebrar o polling do frontend.
    }
  }

  const fresh = getTopUp(id)!;
  const wallet = getOrCreateWallet(fresh.walletId);
  return NextResponse.json({ topUp: serialize(fresh), wallet });
}
