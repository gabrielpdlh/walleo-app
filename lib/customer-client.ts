/** Helpers de cliente (browser) para a sessão do CLIENTE (login só com código). */

export interface CustomerSession {
  name: string;
  cpfMasked: string;
}

export async function customerLogin(code: string): Promise<CustomerSession> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha no login.");
  return { name: data.name, cpfMasked: data.cpfMasked };
}

/** Sessão atual (nome + CPF mascarado) ou null — nunca lança. */
export async function fetchCustomerSession(): Promise<CustomerSession | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return { name: data.name, cpfMasked: data.cpfMasked };
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
