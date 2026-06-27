import { NextResponse } from "next/server";
import { CUSTOMER_NAME, cpfMasked, getSessionWalletId } from "@/lib/customer-auth";
import { getConsumerName } from "@/db/wallet";

export async function GET() {
  const walletId = await getSessionWalletId();
  if (!walletId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const name = (await getConsumerName(walletId)) ?? CUSTOMER_NAME;
  return NextResponse.json({ name, cpfMasked: cpfMasked() });
}
