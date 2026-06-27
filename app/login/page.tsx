"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication: check for a specific code
    if (code === "1234") {
      localStorage.setItem("isAuthenticated", "true");
      router.push("/");
    } else {
      alert("Invalid code. Please try again.");
      setCode("");
    }
  };

  return (
    <main className="min-h-screen text-neutral-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[32px] border border-black/8 bg-white/70 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-7">
          <div>
            <p className="font-mono text-[0.7rem] font-medium tracking-[0.28em] text-neutral-500 uppercase">
              Walleo Eventos
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
              Acesso à Carteira
            </h1>
          </div>
          <Link
            href="/welcome"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Voltar
          </Link>
        </header>

        <section className="mt-5 grid flex-1 place-items-center">
          <div className="w-full max-w-md">
            <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
              <div className="rounded-[28px] border border-black/6 bg-neutral-950 px-5 py-6 text-white sm:px-6">
                <p className="font-mono text-[0.68rem] font-medium tracking-[0.24em] uppercase text-white/56">
                  Área interna
                </p>
                <h2 className="mt-3 text-2xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-[2rem]">
                  Digite o código para acessar sua carteira.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                  O código foi enviado para seu e-mail após a compra do ingresso.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="login-code"
                    className="mb-2 block text-sm font-medium text-neutral-800"
                  >
                    Código de Acesso
                  </label>
                  <input
                    id="login-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="••••••"
                    className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-center text-base uppercase tracking-[0.18em] text-neutral-950 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
                  />
                </div>

                <button
                  type="submit"
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800"
                >
                  Validar e Entrar
                </button>
              </form>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}