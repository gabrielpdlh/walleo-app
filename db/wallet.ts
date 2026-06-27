/**
 * Carteira + ledger + recargas no Postgres (Drizzle).
 *
 * Substitui o antigo store em memória (`lib/store.ts`). Princípios:
 *  - O saldo da carteira é materializado (`wallets.balance_cents`) mas coerente
 *    com o ledger imutável (`ledger_entries`).
 *  - Modelo RESERVA + CAPTURA: `wallets.reserved_cents` guarda o que está preso
 *    em pedidos pendentes. Saldo DISPONÍVEL = balance_cents − reserved_cents.
 *  - Crédito de recarga é idempotente via índice único do ledger
 *    (reference_type, reference_id, entry_type) — webhook + polling não dobram.
 *  - A identidade da carteira da demo é o `walletId` do localStorage (não há
 *    auth real). Aqui ele vira a PK de uma linha `wallets`, provisionada
 *    preguiçosamente junto a um `consumer` anônimo, ligada ao evento da demo.
 *
 * GOTCHA (ver memória do projeto): em `db/` use imports RELATIVOS — o alias `@/`
 * não resolve sob `tsx`.
 */

import { and, desc, eq, inArray, lt, notInArray, or, sql } from "drizzle-orm";

import { db } from "./index";
import { consumers, ledgerEntries, orders, topUps, wallets } from "./schema";
import { DEMO_EVENT_ID } from "../lib/config";

export type WalletRow = typeof wallets.$inferSelect;
export type TopUpRow = typeof topUps.$inferSelect;

/** Tipo do objeto de transação do Drizzle (mesma API de `db`, escopada à tx). */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const TERMINAL_TOPUP_STATUS = [
  "confirmed",
  "failed",
  "expired",
  "canceled",
] as const;

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/** consumerId determinístico a partir do walletId → provisionamento idempotente. */
function consumerIdFor(walletId: string): string {
  return `con_${walletId.replace(/^wal_/, "")}`;
}

// ---------------------------------------------------------------------------
// Provisionamento da carteira (ponte localStorage ↔ Postgres)
// ---------------------------------------------------------------------------

/**
 * Garante que existe uma linha `wallets` cuja PK é o walletId do cliente,
 * criando (idempotentemente) um consumer anônimo e a carteira no evento da demo.
 */
export async function getOrProvisionWallet(walletId: string): Promise<WalletRow> {
  const existing = await db.query.wallets.findFirst({
    where: eq(wallets.id, walletId),
  });
  if (existing) return existing;

  const consumerId = consumerIdFor(walletId);
  await db
    .insert(consumers)
    .values({ id: consumerId, fullName: "Visitante" })
    .onConflictDoNothing({ target: consumers.id });
  await db
    .insert(wallets)
    .values({ id: walletId, consumerId, eventId: DEMO_EVENT_ID })
    .onConflictDoNothing({ target: wallets.id });

  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.id, walletId),
  });
  if (!wallet) throw new Error("Falha ao provisionar carteira.");
  return wallet;
}

/** Atualiza nome/CPF do consumer ligado à carteira (coletados na recarga). */
export async function updateConsumerIdentity(
  walletId: string,
  data: { fullName?: string; cpf?: string },
): Promise<void> {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.id, walletId),
    columns: { consumerId: true },
  });
  if (!wallet) return;

  const set: Partial<typeof consumers.$inferInsert> = { updatedAt: new Date() };
  if (data.fullName) set.fullName = data.fullName;
  if (data.cpf) set.cpf = data.cpf;
  if (Object.keys(set).length <= 1) return; // só updatedAt → nada a fazer

  await db.update(consumers).set(set).where(eq(consumers.id, wallet.consumerId));
}

// ---------------------------------------------------------------------------
// Expiração de reservas (libera saldo de pedidos pendentes vencidos)
// ---------------------------------------------------------------------------

/**
 * Dentro de uma transação JÁ existente (carteira deve estar travada FOR UPDATE):
 * marca pedidos pendentes vencidos como `expired` e devolve o valor reservado.
 */
export async function releaseStaleReservations(
  tx: Tx,
  walletId: string,
): Promise<void> {
  const stale = await tx
    .select({ id: orders.id, totalCents: orders.totalCents })
    .from(orders)
    .where(
      and(
        eq(orders.walletId, walletId),
        eq(orders.status, "pending"),
        lt(orders.expiresAt, sql`now()`),
      ),
    );
  if (stale.length === 0) return;

  const released = stale.reduce((sum, o) => sum + o.totalCents, 0);
  await tx
    .update(orders)
    .set({ status: "expired", updatedAt: sql`now()` })
    .where(
      inArray(
        orders.id,
        stale.map((o) => o.id),
      ),
    );
  await tx
    .update(wallets)
    .set({
      reservedCents: sql`GREATEST(0, ${wallets.reservedCents} - ${released})`,
      updatedAt: sql`now()`,
    })
    .where(eq(wallets.id, walletId));
}

/** Versão pública: abre sua própria transação e trava a carteira. */
export async function expireStaleOrders(walletId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const locked = await tx
      .select({ id: wallets.id })
      .from(wallets)
      .where(eq(wallets.id, walletId))
      .for("update");
    if (locked.length === 0) return;
    await releaseStaleReservations(tx, walletId);
  });
}

// ---------------------------------------------------------------------------
// Leitura do saldo (disponível = balance − reserved)
// ---------------------------------------------------------------------------

export interface WalletView {
  id: string;
  balanceCents: number;
  reservedCents: number;
  availableCents: number;
  currency: string;
  status: string;
}

export async function getWalletView(walletId: string): Promise<WalletView> {
  await getOrProvisionWallet(walletId);
  await expireStaleOrders(walletId);
  const w = await db.query.wallets.findFirst({ where: eq(wallets.id, walletId) });
  if (!w) throw new Error("Carteira não encontrada.");
  return {
    id: w.id,
    balanceCents: w.balanceCents,
    reservedCents: w.reservedCents,
    availableCents: w.balanceCents - w.reservedCents,
    currency: w.currency,
    status: w.status,
  };
}

/** Nome do consumidor dono da carteira (para a saudação "Olá, <nome>"). */
export async function getConsumerName(walletId: string): Promise<string | null> {
  const w = await db.query.wallets.findFirst({
    where: eq(wallets.id, walletId),
    columns: { consumerId: true },
  });
  if (!w) return null;
  const c = await db.query.consumers.findFirst({
    where: eq(consumers.id, w.consumerId),
    columns: { fullName: true },
  });
  return c?.fullName ?? null;
}

// ---------------------------------------------------------------------------
// Histórico (ledger) — recargas e, no futuro, débitos capturados
// ---------------------------------------------------------------------------

export interface LedgerView {
  id: string;
  type: string;
  /** Sinal aplicado: crédito positivo, débito negativo. */
  amountCents: number;
  description: string;
  createdAt: string;
}

export async function getLedgerHistory(walletId: string): Promise<LedgerView[]> {
  const rows = await db
    .select({
      id: ledgerEntries.id,
      entryType: ledgerEntries.entryType,
      direction: ledgerEntries.direction,
      amountCents: ledgerEntries.amountCents,
      description: ledgerEntries.description,
      createdAt: ledgerEntries.createdAt,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.walletId, walletId))
    .orderBy(desc(ledgerEntries.createdAt));

  return rows.map((r) => ({
    id: r.id,
    type: r.entryType,
    amountCents: r.direction === "debit" ? -r.amountCents : r.amountCents,
    description: r.description ?? "",
    createdAt: toIso(r.createdAt),
  }));
}

// ---------------------------------------------------------------------------
// Recargas (top-ups) — integração Confrapix
// ---------------------------------------------------------------------------

export async function createTopUpRow(input: {
  walletId: string;
  amountCents: number;
  customerName: string;
  customerDocument: string;
  providerTransactionId: string;
  providerUuid: string;
  txid: string | null;
  pixQrCode: string | null;
  pixCopyPasteCode: string | null;
  expiresAt: Date;
}): Promise<TopUpRow> {
  const [row] = await db
    .insert(topUps)
    .values({
      walletId: input.walletId,
      amountCents: input.amountCents,
      status: "pending",
      customerName: input.customerName,
      customerDocument: input.customerDocument,
      provider: "confrapix",
      providerTransactionId: input.providerTransactionId,
      providerUuid: input.providerUuid,
      txid: input.txid,
      pixQrCode: input.pixQrCode,
      pixCopyPasteCode: input.pixCopyPasteCode,
      expiresAt: input.expiresAt,
    })
    .returning();
  return row;
}

export async function getTopUpRow(id: string): Promise<TopUpRow | undefined> {
  return db.query.topUps.findFirst({ where: eq(topUps.id, id) });
}

export async function findTopUpByProvider(opts: {
  uuid?: string | null;
  providerTransactionId?: string | null;
  txid?: string | null;
}): Promise<TopUpRow | undefined> {
  const conds = [];
  if (opts.uuid) conds.push(eq(topUps.providerUuid, opts.uuid));
  if (opts.providerTransactionId)
    conds.push(eq(topUps.providerTransactionId, opts.providerTransactionId));
  if (opts.txid) conds.push(eq(topUps.txid, opts.txid));
  if (conds.length === 0) return undefined;
  return db.query.topUps.findFirst({ where: or(...conds) });
}

/** Marca um status terminal não-confirmado (sem regredir estados terminais). */
export async function markTopUpStatus(
  id: string,
  status: "canceled" | "expired" | "failed",
): Promise<void> {
  await db
    .update(topUps)
    .set({
      status,
      failedAt: status === "failed" ? sql`now()` : undefined,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(topUps.id, id),
        notInArray(topUps.status, [...TERMINAL_TOPUP_STATUS]),
      ),
    );
}

/**
 * Confirma a recarga e credita a carteira. Idempotente: o índice único do
 * ledger impede crédito em dobro (webhook + polling + retentativas).
 */
export async function creditTopUp(
  topUpId: string,
): Promise<{ wallet: WalletRow; credited: boolean }> {
  return db.transaction(async (tx) => {
    const top = await tx
      .select()
      .from(topUps)
      .where(eq(topUps.id, topUpId))
      .then((r) => r[0]);
    if (!top) throw new Error("Recarga não encontrada.");

    const wallet = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.id, top.walletId))
      .for("update")
      .then((r) => r[0]);
    if (!wallet) throw new Error("Carteira não encontrada.");

    const inserted = await tx
      .insert(ledgerEntries)
      .values({
        eventId: wallet.eventId,
        walletId: wallet.id,
        entryType: "top_up",
        direction: "credit",
        amountCents: top.amountCents,
        balanceAfterCents: wallet.balanceCents + top.amountCents,
        referenceType: "top_up",
        referenceId: top.id,
        description: "Recarga via PIX",
      })
      .onConflictDoNothing({
        target: [
          ledgerEntries.referenceType,
          ledgerEntries.referenceId,
          ledgerEntries.entryType,
        ],
      })
      .returning({ id: ledgerEntries.id });

    const credited = inserted.length > 0;
    if (credited) {
      await tx
        .update(wallets)
        .set({
          balanceCents: sql`${wallets.balanceCents} + ${top.amountCents}`,
          updatedAt: sql`now()`,
        })
        .where(eq(wallets.id, wallet.id));
    }

    // Marca a recarga como confirmada (idempotente).
    await tx
      .update(topUps)
      .set({
        status: "confirmed",
        confirmedAt: top.confirmedAt ?? sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(topUps.id, top.id), sql`${topUps.status} <> 'confirmed'`));

    const fresh = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.id, wallet.id))
      .then((r) => r[0]);
    return { wallet: fresh, credited };
  });
}
