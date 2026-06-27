"use client";

import { useEffect, useRef, useState } from "react";

type Html5QrcodeType = import("html5-qrcode").Html5Qrcode;

const REGION_ID = "qr-reader";

/**
 * Leitor de QR do pedido: câmera (html5-qrcode, carregada sob demanda) + entrada
 * manual como fallback. Ao detectar um código, desliga a câmera e dispara onToken
 * uma única vez (lockRef evita disparos repetidos do mesmo burst de frames).
 */
export function QrScanner({
  onToken,
  busy,
}: {
  onToken: (token: string) => void;
  busy: boolean;
}) {
  const [manual, setManual] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const lockRef = useRef(false);
  // Mantém a callback atual sem reiniciar a câmera quando o pai re-renderiza.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);
  // Espelha `busy` num ref para a callback da câmera respeitar uma captura em voo.
  const busyRef = useRef(busy);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (!cameraOn) return;
    let cancelled = false;
    lockRef.current = false;

    void (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(REGION_ID);
        scannerRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decoded: string) => {
            if (lockRef.current || busyRef.current) return;
            lockRef.current = true;
            onTokenRef.current(decoded.trim());
            setCameraOn(false); // para a câmera após uma leitura
          },
          () => {
            // frames sem QR — ignora silenciosamente
          },
        );
        // Se o efeito foi desmontado enquanto start() estava em voo, a câmera
        // já abriu o stream — pare/limpe imediatamente para não vazar.
        if (cancelled) {
          await instance.stop().catch(() => {});
          try {
            instance.clear();
          } catch {
            // ignora
          }
          scannerRef.current = null;
          return;
        }
      } catch {
        if (!cancelled) {
          setCamError(
            "Não foi possível acessar a câmera. Use a entrada manual abaixo.",
          );
          setCameraOn(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      scannerRef.current = null;
      if (inst) {
        // stop() pode LANÇAR síncrono se start() ainda não chegou ao estado
        // SCANNING. Promise.resolve().then converte isso em rejeição tratável,
        // e o finally garante clear() (libera o stream da câmera) em todo caso.
        Promise.resolve()
          .then(() => inst.stop())
          .catch(() => {})
          .finally(() => {
            try {
              inst.clear();
            } catch {
              // ignora
            }
          });
      }
    };
  }, [cameraOn]);

  const submitManual = () => {
    const t = manual.trim();
    if (!t || busy) return;
    onToken(t);
    setManual("");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <h2 className="text-xl font-semibold tracking-[-0.03em]">Bipar pedido</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Escaneie o QR do cliente ou cole o código manualmente.
        </p>

        <div
          id={REGION_ID}
          className={`mt-5 overflow-hidden rounded-2xl ${
            cameraOn ? "border border-black/10" : "hidden"
          }`}
        />

        <button
          onClick={() => {
            setCamError(null);
            setCameraOn((v) => !v);
          }}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:bg-black/5"
        >
          {cameraOn ? "Desligar câmera" : "Ligar câmera"}
        </button>

        {camError && (
          <p className="mt-3 text-sm font-medium text-amber-600">{camError}</p>
        )}
      </div>

      <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <label className="mb-2 block text-sm font-medium text-neutral-800">
          Código do pedido (manual)
        </label>
        <div className="flex items-stretch gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitManual();
            }}
            placeholder="cole o código do QR"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
          />
          <button
            onClick={submitManual}
            disabled={busy || !manual.trim()}
            className="shrink-0 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
          >
            {busy ? "…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
