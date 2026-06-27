import { NextResponse } from "next/server";
import { getSessionWalletId } from "@/lib/customer-auth";
import { getConsumerName } from "@/db/wallet";

export async function GET() {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const name = await getConsumerName(walletId);
  return NextResponse.json({ name: name ?? "Visitante" });
}
