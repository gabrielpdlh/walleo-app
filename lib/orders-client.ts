/** Helpers de cliente (browser) para pedidos (carrinho → reserva → QR). */

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface OrderSummary {
  id: string;
  status: string;
  totalCents: number;
  merchantName: string;
  createdAt: string;
  expiresAt: string | null;
  itemsSummary: string;
  itemCount: number;
}

export interface OrderDetail {
  id: string;
  status: string;
  totalCents: number;
  merchantName: string;
  createdAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  cancelledAt: string | null;
  note: string | null;
  qrDataUrl: string | null;
  items: {
    id: string;
    name: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
}

/** Rótulos PT-BR para cada status do pedido. */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  redeemed: "Resgatado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

/** Classes Tailwind do badge por status. */
export const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  redeemed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-neutral-200 text-neutral-600",
  expired: "bg-neutral-200 text-neutral-600",
};

export async function createOrder(input: {
  merchantSlug: string;
  items: CartLine[];
  note?: string;
}): Promise<{ id: string; totalCents: number }> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao criar pedido.");
  return { id: data.order.orderId, totalCents: data.order.totalCents };
}

/** NUNCA lança: em falha de rede/HTTP retorna [] (evita travar a lista no skeleton). */
export async function fetchOrders(): Promise<OrderSummary[]> {
  try {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

/** Detalhe do pedido (com QR para pedidos pendentes), ou null se 404. */
export async function fetchOrder(orderId: string): Promise<OrderDetail | null> {
  const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Falha ao carregar pedido.");
  const data = await res.json();
  return data.order;
}

export async function cancelOrder(orderId: string): Promise<void> {
  const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Falha ao cancelar pedido.");
  }
}
