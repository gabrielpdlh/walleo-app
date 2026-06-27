/**
 * Auth do PORTAL do estabelecimento (mock para a demo, mas FAIL-CLOSED).
 *
 * Credenciais no ambiente (.env.local): MERCHANT_PORTAL_EMAIL/PASSWORD e o
 * MERCHANT_PORTAL_SLUG que amarra o login a um merchants.slug semeado.
 *
 * A sessão é um cookie HTTP-only assinado por HMAC (server-enforced) — necessário
 * porque o portal faz CAPTURA, que move dinheiro real no ledger.
 *
 * Princípios de segurança (mesmo sendo mock):
 *  - A chave de assinatura (MERCHANT_SESSION_SECRET) é INDEPENDENTE da senha e NÃO
 *    tem fallback para constante: sem segredo forte, tudo falha fechado.
 *  - O token carrega `${slug}.${exp}` assinado → tem EXPIRAÇÃO no servidor.
 *  - getSessionSlug fixa o slug em MERCHANT_SLUG (a única loja do portal).
 *
 * SERVIDOR APENAS: importa node:crypto e next/headers. Nunca importar no client.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const EMAIL = process.env.MERCHANT_PORTAL_EMAIL ?? "";
const PASSWORD = process.env.MERCHANT_PORTAL_PASSWORD ?? "";
const SECRET = process.env.MERCHANT_SESSION_SECRET ?? "";
const SECRET_OK = SECRET.length >= 16; // sem segredo forte → fail-closed

export const MERCHANT_SLUG = process.env.MERCHANT_PORTAL_SLUG ?? "";
export const MERCHANT_COOKIE = "merchant_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12h (cookie + exp do token)

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Confere e-mail + senha contra o ambiente (comparação timing-safe). */
export function verifyCredentials(email: string, password: string): boolean {
  if (!SECRET_OK || !EMAIL || !PASSWORD || !MERCHANT_SLUG) return false;
  const okEmail = safeEqual((email ?? "").trim().toLowerCase(), EMAIL.toLowerCase());
  const okPass = safeEqual(password ?? "", PASSWORD);
  return okEmail && okPass;
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Token de sessão: `${slug}.${exp}.${hmac(slug.exp)}` (com expiração). */
export function createSessionToken(slug: string): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${slug}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Valida assinatura + expiração e devolve o slug, ou null se inválido. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!SECRET_OK || !token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  // payload = `${slug}.${exp}` (slug é kebab-case, sem pontos)
  const expDot = payload.lastIndexOf(".");
  if (expDot <= 0) return null;
  const slug = payload.slice(0, expDot);
  const exp = Number(payload.slice(expDot + 1));
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  return slug;
}

/**
 * Lê o cookie da requisição atual e devolve o slug autenticado — FIXADO na loja
 * do portal (MERCHANT_SLUG). Qualquer outra coisa → null (fail-closed).
 */
export async function getSessionSlug(): Promise<string | null> {
  const store = await cookies();
  const slug = verifySessionToken(store.get(MERCHANT_COOKIE)?.value);
  if (!slug || slug !== MERCHANT_SLUG) return null;
  return slug;
}
