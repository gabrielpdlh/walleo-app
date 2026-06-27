/**
 * Helpers de cliente (browser) para a carteira.
 *
 * A identidade da carteira da demo vive no localStorage (não há auth real ainda).
 * O SALDO, porém, é sempre lido do backend — nunca é calculado/persistido no
 * frontend, conforme o spec (saldo coerente com o ledger do servidor).
 */

const WALLET_KEY = "walletId";

export function getWalletId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(WALLET_KEY);
  if (!id) {
    id = `wal_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem(WALLET_KEY, id);
  }
  return id;
}

export async function fetchBalanceCents(walletId: string): Promise<number> {
  const res = await fetch(`/api/wallet/${walletId}`, { cache: "no-store" });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.wallet?.balanceCents ?? 0;
}

export interface CreateRechargeResult {
  topUp: { id: string; status: string; amountCents: number; expiresAt: string };
  pix: { qrUrl: string | null; copyPasteCode: string | null; txid: string | null };
}

export async function createRecharge(input: {
  walletId: string;
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
    expiresAt: string;
    confirmedAt: string | null;
  };
  wallet: { id: string; balanceCents: number };
}

export async function fetchRechargeStatus(topUpId: string): Promise<RechargeStatus> {
  const res = await fetch(`/api/recharge/${topUpId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao consultar recarga.");
  return res.json();
}

export async function purchase(input: {
  walletId: string;
  amountCents: number;
  merchantName: string;
  itemName: string;
}): Promise<{ balanceCents: number }> {
  const res = await fetch("/api/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha na compra.");
  return { balanceCents: data.wallet.balanceCents };
}
