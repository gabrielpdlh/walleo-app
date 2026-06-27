/**
 * Store/ledger em memória para a demo.
 *
 * NÃO é um banco de dados de produção — é um substituto coerente com as regras
 * do spec (saldo derivado do ledger, crédito idempotente, saldo nunca negativo).
 * O estado é mantido em `globalThis` para sobreviver ao hot-reload do Next em dev.
 *
 * Para produção, trocar por Supabase/Postgres mantendo a mesma interface.
 */

export type TopUpStatus =
  | "created"
  | "pending"
  | "processing"
  | "confirmed"
  | "failed"
  | "expired"
  | "canceled";

export interface Wallet {
  id: string;
  balanceCents: number;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  type: "top_up" | "purchase";
  /** Positivo para recarga, negativo para compra. */
  amountCents: number;
  description: string;
  merchantName?: string;
  /** Referência rastreável (id da recarga ou da compra). */
  refId: string;
  createdAt: string;
}

export interface TopUp {
  id: string;
  walletId: string;
  amountCents: number;
  status: TopUpStatus;
  customerName: string;
  customerDocument: string;
  // Dados vindos da Confrapix
  confrapixId: number;
  uuid: string;
  txid: string | null;
  qrUrl: string | null;
  copyPasteCode: string | null;
  expiresAt: string;
  createdAt: string;
  confirmedAt: string | null;
}

interface Db {
  wallets: Map<string, Wallet>;
  topUps: Map<string, TopUp>;
  ledger: LedgerEntry[];
}

const globalForDb = globalThis as unknown as { __walleoDb?: Db };

const db: Db =
  globalForDb.__walleoDb ??
  (globalForDb.__walleoDb = {
    wallets: new Map(),
    topUps: new Map(),
    ledger: [],
  });

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

// ---------- Wallet ----------

export function getOrCreateWallet(walletId: string): Wallet {
  let wallet = db.wallets.get(walletId);
  if (!wallet) {
    wallet = { id: walletId, balanceCents: 0, createdAt: new Date().toISOString() };
    db.wallets.set(walletId, wallet);
  }
  return wallet;
}

// ---------- TopUp (recarga) ----------

export function createTopUp(data: Omit<TopUp, "id" | "createdAt">): TopUp {
  const topUp: TopUp = { id: id("top"), createdAt: new Date().toISOString(), ...data };
  db.topUps.set(topUp.id, topUp);
  return topUp;
}

export function getTopUp(topUpId: string): TopUp | undefined {
  return db.topUps.get(topUpId);
}

export function findTopUpByConfrapix(opts: {
  uuid?: string | null;
  confrapixId?: number | null;
  txid?: string | null;
}): TopUp | undefined {
  for (const t of db.topUps.values()) {
    if (opts.uuid && t.uuid === opts.uuid) return t;
    if (opts.confrapixId != null && t.confrapixId === opts.confrapixId) return t;
    if (opts.txid && t.txid && t.txid === opts.txid) return t;
  }
  return undefined;
}

export function updateTopUpStatus(topUpId: string, status: TopUpStatus): TopUp | undefined {
  const topUp = db.topUps.get(topUpId);
  if (!topUp) return undefined;
  // Não regride a partir de um estado terminal.
  const terminal: TopUpStatus[] = ["confirmed", "failed", "expired", "canceled"];
  if (terminal.includes(topUp.status)) return topUp;
  topUp.status = status;
  return topUp;
}

/**
 * Confirma a recarga e credita a carteira. Idempotente: chamar de novo
 * (ex.: webhook + polling) não credita duas vezes.
 */
export function confirmTopUp(topUpId: string): TopUp | undefined {
  const topUp = db.topUps.get(topUpId);
  if (!topUp) return undefined;
  if (topUp.status === "confirmed") return topUp; // já creditado

  topUp.status = "confirmed";
  topUp.confirmedAt = new Date().toISOString();

  const wallet = getOrCreateWallet(topUp.walletId);
  wallet.balanceCents += topUp.amountCents;

  db.ledger.push({
    id: id("led"),
    walletId: topUp.walletId,
    type: "top_up",
    amountCents: topUp.amountCents,
    description: "Recarga via PIX",
    refId: topUp.id,
    createdAt: topUp.confirmedAt,
  });

  return topUp;
}

// ---------- Compra (débito) ----------

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Saldo insuficiente.");
    this.name = "InsufficientBalanceError";
  }
}

export function recordPurchase(input: {
  walletId: string;
  amountCents: number;
  merchantName: string;
  itemName: string;
}): { wallet: Wallet; entry: LedgerEntry } {
  const wallet = getOrCreateWallet(input.walletId);
  if (input.amountCents <= 0) throw new Error("Valor inválido.");
  if (wallet.balanceCents < input.amountCents) throw new InsufficientBalanceError();

  wallet.balanceCents -= input.amountCents;

  const entry: LedgerEntry = {
    id: id("led"),
    walletId: input.walletId,
    type: "purchase",
    amountCents: -input.amountCents,
    description: input.itemName,
    merchantName: input.merchantName,
    refId: id("pur"),
    createdAt: new Date().toISOString(),
  };
  db.ledger.push(entry);

  return { wallet, entry };
}

// ---------- Histórico ----------

export function getHistory(walletId: string): LedgerEntry[] {
  return db.ledger
    .filter((e) => e.walletId === walletId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
