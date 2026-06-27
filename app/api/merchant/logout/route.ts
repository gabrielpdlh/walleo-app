import { NextResponse } from "next/server";
import { MERCHANT_COOKIE } from "@/lib/merchant-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MERCHANT_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
