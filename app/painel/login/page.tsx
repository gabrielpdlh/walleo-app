"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchMerchantSession, merchantLogin } from "@/lib/merchant-client";

export default function PainelLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Já autenticado? vai direto pro painel.
  useEffect(() => {
    void (async () => {
      const m = await fetchMerchantSession();
      if (m) router.replace("/painel");
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await merchantLogin(email, password);
      router.replace("/painel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login.");
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 text-neutral-950">
      <div className="w-full max-w-sm rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase">
          Portal do estabelecimento
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Entrar</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sunset@walleo.com"
              autoComplete="username"
              className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
              className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
