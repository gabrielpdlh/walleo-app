"use client";

import { useCallback, useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from "@/lib/orders-client";
import { fetchMerchantOrders, type MerchantOrder } from "@/lib/merchant-client";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PainelPedidosPage() {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const items = await fetchMerchantOrders();
    setOrders(items);
    setLoading(false);
  }, []);

  // Carrega + atualiza a cada 8s (a fila muda conforme clientes pedem/bipam).
  useEffect(() => {
    void (async () => {
      await load();
    })();
    const poll = setInterval(() => void load(), 8000);
    return () => clearInterval(poll);
  }, [load]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-[-0.03em]">Pedidos</h2>
        {!loading && (
          <span className="text-sm text-neutral-500">
            {pendingCount} pendente{pendingCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[24px] border border-black/8 bg-white/80 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-4 w-56" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            Nenhum pedido ainda.
          </p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-[24px] border border-black/8 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-950">
                    {o.customerName}
                  </p>
                  <p className="mt-1 truncate text-sm text-neutral-600">{o.itemsSummary}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    ORDER_STATUS_BADGE[o.status] ?? "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-base font-semibold text-neutral-950">
                  {formatBRL(o.totalCents)}
                </span>
                <span className="text-xs text-neutral-500">
                  {o.status === "redeemed" && o.redeemedAt
                    ? `Resgatado ${formatDateTime(o.redeemedAt)}`
                    : formatDateTime(o.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
