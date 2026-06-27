"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatBRL, reaisToCents } from "@/lib/money";
import {
  createRecharge,
  fetchRechargeStatus,
  type CreateRechargeResult,
} from "@/lib/wallet-client";

type Step = "form" | "pix" | "success" | "failed";

interface RechargeModalProps {
  isOpen: boolean;
  walletId: string;
  onClose: () => void;
  /** Chamado quando a recarga é confirmada, com o novo saldo (em centavos). */
  onConfirmed: (newBalanceCents: number) => void;
}

const POLL_INTERVAL_MS = 4000;

/**
 * A Confrapix retorna o QR em `pix.url` ora como URL, ora como PNG em base64
 * (sem o prefixo data:). Normaliza para um src utilizável pelo <img>.
 */
function qrSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `data:image/png;base64,${url}`;
}

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function RechargeModal({
  isOpen,
  walletId,
  onClose,
  onConfirmed,
}: RechargeModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recharge, setRecharge] = useState<CreateRechargeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limpa o polling ao desmontar.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(topUpId: string) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchRechargeStatus(topUpId);
        const s = data.topUp.status;
        if (s === "confirmed") {
          stopPolling();
          onConfirmed(data.wallet.balanceCents);
          setStep("success");
        } else if (s === "expired" || s === "failed" || s === "canceled") {
          stopPolling();
          setStep("failed");
        }
      } catch {
        // Silencioso: tenta de novo no próximo ciclo.
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleCreate() {
    setError(null);
    const amountCents = reaisToCents(parseFloat(amount.replace(",", ".")));
    if (!Number.isFinite(amountCents) || amountCents < 100) {
      setError("Informe um valor de no mínimo R$ 1,00.");
      return;
    }
    setLoading(true);
    try {
      const result = await createRecharge({
        walletId,
        amountCents,
        cpf,
        name,
      });
      setRecharge(result);
      setStep("pix");
      startPolling(result.topUp.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar recarga.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const code = recharge?.pix.copyPasteCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar.");
    }
  }

  function handleClose() {
    stopPolling();
    // Reseta para a próxima abertura (mantém nome/CPF por conveniência).
    setStep("form");
    setError(null);
    setRecharge(null);
    setCopied(false);
    setAmount("");
    onClose();
  }

  const title =
    step === "success"
      ? "Recarga confirmada"
      : step === "pix"
        ? "Pague com PIX"
        : step === "failed"
          ? "Recarga não concluída"
          : "Recarregar Carteira";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {step === "form" && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Preencha os dados para gerar um PIX e adicionar saldo à sua carteira.
          </p>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">
              Nome completo
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria da Silva"
              className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">
              CPF
            </label>
            <input
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">
              Valor da Recarga (R$)
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50,00"
              className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-center text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Gerando PIX…" : "Gerar PIX"}
          </button>
        </div>
      )}

      {step === "pix" && recharge && (
        <div className="space-y-4">
          <p className="text-center text-gray-600">
            Escaneie o QR Code ou copie o código para pagar.
            <br />
            Aguardando confirmação do pagamento…
          </p>

          {qrSrc(recharge.pix.qrUrl) && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc(recharge.pix.qrUrl)!}
                alt="QR Code PIX"
                className="h-56 w-56 rounded-2xl border border-black/10 bg-white object-contain p-2"
              />
            </div>
          )}

          {recharge.pix.copyPasteCode && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                PIX copia e cola
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={recharge.pix.copyPasteCode}
                  className="h-12 w-full truncate rounded-2xl border border-black/10 bg-neutral-50 px-4 text-sm text-neutral-700 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Valor: {formatBRL(recharge.topUp.amountCents)}
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            onClick={handleClose}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 px-5 text-sm font-semibold text-neutral-700 transition hover:bg-black/5"
          >
            Pagar depois
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-neutral-900">
            Pagamento confirmado!
          </p>
          <p className="text-gray-600">Seu saldo já foi atualizado.</p>
          <button
            onClick={handleClose}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800"
          >
            Voltar à carteira
          </button>
        </div>
      )}

      {step === "failed" && (
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-neutral-900">
            Recarga não concluída
          </p>
          <p className="text-gray-600">
            A cobrança expirou ou foi cancelada. Tente novamente.
          </p>
          <button
            onClick={() => setStep("form")}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </Modal>
  );
}
