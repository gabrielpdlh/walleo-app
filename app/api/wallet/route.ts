import { NextResponse } from "next/server";
import { getSessionWalletId } from "@/lib/customer-auth";
import { getWalletView } from "@/db/wallet";

export async function GET() {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  try {
    const wallet = await getWalletView(walletId);
    return NextResponse.json({ wallet });
  } catch (err) {
    console.error("[wallet] erro ao carregar carteira:", err);
    return NextResponse.json(
      { error: "Falha ao carregar carteira." },
      { status: 500 },
    );
  }
}
