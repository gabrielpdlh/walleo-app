/** Helpers de cliente (browser) para o PORTAL do estabelecimento (/painel). */

export interface MerchantInfo {
  slug: string;
  name: string;
}

export interface RedeemResult {
  orderId: string;
  status: "redeemed";
  totalCents: number;
  merchantName: string;
  customerName: string | null;
  redeemedAt: string;
  items: { name: string; quantity: number; lineTotalCents: number }[];
}

export interface MerchantOrder {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  redeemedAt: string | null;
  customerName: string;
  itemsSummary: string;
  itemCount: number;
}

export interface MerchantProduct {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
}

export interface ProductPayload {
  name?: string;
  priceCents?: number;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  active?: boolean;
}

// --- sessão ------------------------------------------------------------------

export async function merchantLogin(
  email: string,
  password: string,
): Promise<MerchantInfo> {
  const res = await fetch("/api/merchant/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha no login.");
  return data.merchant;
}

/** Devolve a sessão atual ou null (nunca lança). */
export async function fetchMerchantSession(): Promise<MerchantInfo | null> {
  try {
    const res = await fetch("/api/merchant/session", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.merchant ?? null;
  } catch {
    return null;
  }
}

export async function merchantLogout(): Promise<void> {
  try {
    await fetch("/api/merchant/logout", { method: "POST" });
  } catch {
    // ignora — o redirecionamento de logout acontece de qualquer forma
  }
}

// --- captura -----------------------------------------------------------------

export async function redeemQr(token: string): Promise<RedeemResult> {
  const res = await fetch("/api/merchant/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao resgatar pedido.");
  return data.result;
}

// --- pedidos -----------------------------------------------------------------

export async function fetchMerchantOrders(): Promise<MerchantOrder[]> {
  try {
    const res = await fetch("/api/merchant/orders", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

// --- produtos ----------------------------------------------------------------

export async function fetchMerchantProducts(): Promise<MerchantProduct[]> {
  try {
    const res = await fetch("/api/merchant/products", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function createMerchantProduct(
  data: { name: string; priceCents: number } & ProductPayload,
): Promise<MerchantProduct> {
  const res = await fetch("/api/merchant/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Falha ao criar produto.");
  return json.product;
}

export async function updateMerchantProduct(
  id: string,
  data: ProductPayload,
): Promise<void> {
  const res = await fetch(`/api/merchant/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Falha ao atualizar produto.");
  }
}

export async function deleteMerchantProduct(id: string): Promise<void> {
  const res = await fetch(`/api/merchant/products/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Falha ao excluir produto.");
  }
}
