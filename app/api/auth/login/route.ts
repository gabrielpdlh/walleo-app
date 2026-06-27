import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifyAccessCode,
  walletIdForName,
} from "@/lib/customer-auth";
import { getOrProvisionWallet, updateConsumerIdentity } from "@/db/wallet";

export async function POST(req: Request) {
  let body: { name?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }
  if (!verifyAccessCode(body.code ?? "")) {
    return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 });
  }

  const walletId = walletIdForName(name);
  if (!walletId) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  // Provisiona/recupera a carteira dessa identidade e fixa o nome.
  await getOrProvisionWallet(walletId);
  await updateConsumerIdentity(walletId, { fullName: name });

  const res = NextResponse.json({ name });
  res.cookies.set(CUSTOMER_COOKIE, createSessionToken(walletId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
