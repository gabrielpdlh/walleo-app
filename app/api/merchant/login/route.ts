import { NextResponse } from "next/server";
import {
  MERCHANT_COOKIE,
  MERCHANT_SLUG,
  SESSION_MAX_AGE,
  createSessionToken,
  verifyCredentials,
} from "@/lib/merchant-auth";
import { getMerchantBasic } from "@/db/merchant";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!verifyCredentials(body.email ?? "", body.password ?? "")) {
    return NextResponse.json(
      { error: "E-mail ou senha inválidos." },
      { status: 401 },
    );
  }

  const merchant = await getMerchantBasic(MERCHANT_SLUG);
  if (!merchant) {
    return NextResponse.json(
      { error: "Estabelecimento do portal não configurado." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({
    merchant: { slug: merchant.slug, name: merchant.name },
  });
  res.cookies.set(MERCHANT_COOKIE, createSessionToken(merchant.slug), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
