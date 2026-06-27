/**
 * Auth do CLIENTE (mock para a demo, mas com sessão server-side real).
 *
 * "Login" = nome + código de acesso simulado (CUSTOMER_ACCESS_CODE, ex.: 1234).
 * A identidade da carteira é DERIVADA DO NOME (walletIdForName) → a mesma pessoa
 * cai sempre na mesma carteira, em QUALQUER aparelho (resolve o saldo divergente
 * entre desktop e celular, que vinha do walletId aleatório por dispositivo).
 *
 * A sessão é um cookie HTTP-only assinado por HMAC com expiração — fail-closed
 * (exige CUSTOMER_SESSION_SECRET forte, sem fallback para constante).
 *
 * SERVIDOR APENAS: importa node:crypto e next/headers. Nunca importar no client.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ACCESS_CODE = process.env.CUSTOMER_ACCESS_CODE ?? "1234";
// Chave PRÓPRIA do cliente — sem fallback para a do lojista (evita que um token
// assinado num domínio valide no outro).
const SECRET = process.env.CUSTOMER_SESSION_SECRET || "";
const SECRET_OK = SECRET.length >= 16;

export const CUSTOMER_COOKIE = "walleo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias (sessão longa p/ demo)

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Confere o código de acesso simulado (timing-safe). Fail-closed sem segredo. */
export function verifyAccessCode(code: string): boolean {
  if (!SECRET_OK || !ACCESS_CODE) return false;
  return safeEqual((code ?? "").trim(), ACCESS_CODE);
}

/** walletId determinístico a partir do nome (mesma pessoa → mesma carteira). */
export function walletIdForName(name: string): string | null {
  const slug = (name ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return null;
  return `wal_${slug}`;
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Token de sessão: `${walletId}.${exp}.${hmac(walletId.exp)}`. */
export function createSessionToken(walletId: string): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${walletId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Valida assinatura + expiração e devolve o walletId, ou null. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!SECRET_OK || !token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  const expDot = payload.lastIndexOf(".");
  if (expDot <= 0) return null;
  const walletId = payload.slice(0, expDot);
  const exp = Number(payload.slice(expDot + 1));
  if (!walletId.startsWith("wal_")) return null;
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  return walletId;
}

/** Lê o cookie da requisição atual e devolve o walletId autenticado (ou null). */
export async function getSessionWalletId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(CUSTOMER_COOKIE)?.value);
}
