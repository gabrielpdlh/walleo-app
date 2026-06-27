/**
 * Helpers de cliente (browser) para a carteira.
 *
 * A identidade da carteira vem da SESSÃO (cookie HTTP-only) — o frontend não
 * envia mais walletId. O SALDO é sempre lido do backend (coerente com o ledger).
 */

export interface WalletView {
  id: string;
  balanceCents: number;
  reservedCents: number;
  /** Saldo disponível para gastar = balanceCents − reservedCents. */
  availableCents: number;
}

/** Lê a carteira da sessão (saldo, reservado e disponível). NUNCA lança. */
export async function fetchWallet(): Promise<WalletView> {
  const fallback: WalletView = {
    id: "",
    balanceCents: 0,
    reservedCents: 0,
    availableCents: 0,
  };
  try {
    const res = await fetch("/api/wallet", { cache: "no-store" });
    if (!res.ok) return fallback;
    const data = await res.json();
    const w = data.wallet ?? {};
    const balanceCents = w.balanceCents ?? 0;
    const reservedCents = w.reservedCents ?? 0;
    return {
      id: w.id ?? "",
      balanceCents,
      reservedCents,
      availableCents: w.availableCents ?? balanceCents - reservedCents,
    };
  } catch {
    return fallback;
  }
}

/** Atalho: saldo DISPONÍVEL (o número exibido como "Saldo" ao cliente). */
export async function fetchBalanceCents(): Promise<number> {
  const { availableCents } = await fetchWallet();
  return availableCents;
}

export interface CreateRechargeResult {
  topUp: { id: string; status: string; amountCents: number; expiresAt: string };
  pix: { qrUrl: string | null; copyPasteCode: string | null; txid: string | null };
}

export async function createRecharge(input: {
  amountCents: number;
  cpf: string;
  name: string;
}): Promise<CreateRechargeResult> {
  const res = await fetch("/api/recharge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao criar recarga.");
  return data;
}

export interface RechargeStatus {
  topUp: {
    id: string;
    status: string;
    amountCents: number;
    expiresAt: string | null;
    confirmedAt: string | null;
  };
}

export async function fetchRechargeStatus(topUpId: string): Promise<RechargeStatus> {
  const res = await fetch(`/api/recharge/${topUpId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao consultar recarga.");
  return res.json();
}
