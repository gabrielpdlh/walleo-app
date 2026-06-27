import { NextResponse } from "next/server";
import { getSessionWalletId } from "@/lib/customer-auth";
import { getLedgerHistory } from "@/db/wallet";

export async function GET() {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  try {
    const items = await getLedgerHistory(walletId);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[wallet] erro ao carregar histórico:", err);
    return NextResponse.json(
      { error: "Falha ao carregar histórico." },
      { status: 500 },
    );
  }
}
