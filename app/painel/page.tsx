"use client";

import { useCallback, useRef, useState } from "react";

import { QrScanner } from "@/components/painel/QrScanner";
import { redeemQr, type RedeemResult } from "@/lib/merchant-client";
import { formatBRL } from "@/lib/money";

export default function BiparPage() {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const handleToken = useCallback(async (token: string) => {
    if (busyRef.current) return; // bloqueia uma segunda captura em voo
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const r = await redeemQr(token);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao resgatar pedido.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">Pedido resgatado!</p>
            <p className="text-sm text-neutral-600">
              Cliente: {result.customerName ?? "Visitante"}
            </p>
          </div>
        </div>

        <p className="mt-6 font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-neutral-500">
          Entregar ao cliente
        </p>
        <ul className="mt-3 divide-y divide-black/8">
          {result.items.map((it, i) => (
            <li key={i} className="flex items-center justify-between py-3">
              <span className="text-sm text-neutral-800">
                <span className="font-semibold tabular-nums">{it.quantity}×</span> {it.name}
              </span>
              <span className="text-sm font-semibold text-neutral-950">
                {formatBRL(it.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
          <span className="text-base font-semibold text-neutral-950">Total</span>
          <span className="text-base font-semibold text-neutral-950">
            {formatBRL(result.totalCents)}
          </span>
        </div>

        <button
          onClick={reset}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800"
        >
          Bipar próximo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <QrScanner onToken={handleToken} busy={busy} />
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
