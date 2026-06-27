import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_CPF,
  CUSTOMER_NAME,
  CUSTOMER_WALLET_ID,
  SESSION_MAX_AGE,
  cpfMasked,
  createSessionToken,
  verifyAccessCode,
} from "@/lib/customer-auth";
import { getOrProvisionWallet, updateConsumerIdentity } from "@/db/wallet";

export async function POST(req: Request) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!verifyAccessCode(body.code ?? "")) {
    return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 });
  }

  // Usuário fixo da demo: provisiona/recupera a carteira e fixa nome + CPF.
  await getOrProvisionWallet(CUSTOMER_WALLET_ID);
  await updateConsumerIdentity(CUSTOMER_WALLET_ID, {
    fullName: CUSTOMER_NAME,
    cpf: CUSTOMER_CPF,
  });

  const res = NextResponse.json({ name: CUSTOMER_NAME, cpfMasked: cpfMasked() });
  res.cookies.set(CUSTOMER_COOKIE, createSessionToken(CUSTOMER_WALLET_ID), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
