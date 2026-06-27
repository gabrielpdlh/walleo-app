/** Helpers de cliente (browser) para a sessão do CLIENTE (login simples). */

export interface CustomerSession {
  name: string;
}

export async function customerLogin(
  name: string,
  code: string,
): Promise<CustomerSession> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha no login.");
  return { name: data.name };
}

/** Sessão atual (nome) ou null — nunca lança. */
export async function fetchCustomerSession(): Promise<CustomerSession | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return { name: data.name };
  } catch {
    return null;
  }
}

export async function customerLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignora — o redirect de logout acontece de qualquer forma
  }
}
