/**
 * Client da API Confrapix (PIX).
 *
 * Documentação: https://doc.confrapix.com.br
 * Auth: Bearer token no header. O token NUNCA vai ao frontend — só é lido aqui,
 * no servidor, a partir de variáveis de ambiente.
 */

import { centsToReais } from "./money";

const BASE_URL = process.env.CONFRAPIX_BASE_URL ?? "https://api.confrapix.com.br/api";
const TOKEN = process.env.CONFRAPIX_API_TOKEN ?? "";

export type ConfrapixStatus =
  | "processing"
  | "succeeded"
  | "canceled"
  | "refunded"
  | "expired"
  | string;

export interface ConfrapixPix {
  url: string | null;
  txid: string | null;
  code: string | null;
  payer_data?: unknown;
}

export interface ConfrapixTransaction {
  id: number;
  uuid: string;
  customer_name?: string | null;
  customer_document?: string | null;
  description?: string | null;
  status: ConfrapixStatus;
  confirmed: boolean;
  type?: string | null;
  payment_type?: string | null;
  amount?: number | string;
  captured_in?: string | null;
  expired_in?: string | null;
  payed_in?: string | null;
  pix?: ConfrapixPix;
}

interface ConfrapixEnvelope<T> {
  status: number;
  success: boolean;
  message: string;
  transaction?: T;
  error?: string;
}

export class ConfrapixError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ConfrapixError";
  }
}

function assertConfigured(): void {
  if (!TOKEN) {
    throw new ConfrapixError(
      "CONFRAPIX_API_TOKEN não configurado no ambiente do servidor.",
      500,
    );
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { method: string },
): Promise<T> {
  assertConfigured();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
    // Integração externa: nunca cachear.
    cache: "no-store",
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body as ConfrapixEnvelope<unknown>)?.message ||
      (body as ConfrapixEnvelope<unknown>)?.error ||
      `Falha na chamada à Confrapix (HTTP ${res.status})`;
    throw new ConfrapixError(message, res.status, body);
  }

  return body as T;
}

export interface CreatePixTopUpInput {
  amountCents: number;
  customerName: string;
  customerDocument: string; // CPF (apenas dígitos)
  description?: string;
  /** ISO-ish "YYYY-MM-DD HH:mm:ss" exigido pela Confrapix. */
  expirationDate: string;
  callbackUrl?: string;
}

/** Cria uma cobrança PIX. POST /transaction-ec/store */
export async function createPixTopUp(
  input: CreatePixTopUpInput,
): Promise<ConfrapixTransaction> {
  const payload: Record<string, unknown> = {
    amount: centsToReais(input.amountCents),
    customer_name: input.customerName,
    customer_document: input.customerDocument,
    description: input.description ?? "Recarga de carteira Walleo",
    expiration_date: input.expirationDate,
  };
  if (input.callbackUrl) payload.callback_url = input.callbackUrl;

  const env = await request<ConfrapixEnvelope<ConfrapixTransaction>>(
    "/transaction-ec/store",
    { method: "POST", body: JSON.stringify(payload) },
  );

  if (!env.transaction) {
    throw new ConfrapixError(
      env.message || "Confrapix não retornou a transação.",
      env.status || 502,
      env,
    );
  }
  return env.transaction;
}

/** Consulta o status de uma transação. GET /transaction-ec/show/:id */
export async function getTransaction(
  id: number | string,
): Promise<ConfrapixTransaction | null> {
  const env = await request<ConfrapixEnvelope<ConfrapixTransaction>>(
    `/transaction-ec/show/${id}`,
    { method: "GET" },
  );
  return env.transaction ?? null;
}

/** Formata uma data para o padrão exigido pela Confrapix. */
export function toConfrapixDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
