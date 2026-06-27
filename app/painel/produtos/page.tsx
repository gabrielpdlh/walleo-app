"use client";

import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { centsToReais, formatBRL, reaisToCents } from "@/lib/money";
import {
  createMerchantProduct,
  deleteMerchantProduct,
  fetchMerchantProducts,
  updateMerchantProduct,
  type MerchantProduct,
} from "@/lib/merchant-client";

interface FormState {
  name: string;
  price: string; // em reais, separador "." (casa com <input type="number">)
  description: string;
  imageUrl: string;
  category: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  price: "",
  description: "",
  imageUrl: "",
  category: "",
};

export default function PainelProdutosPage() {
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MerchantProduct | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const items = await fetchMerchantProducts();
    setProducts(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: MerchantProduct) => {
    setEditing(p);
    setForm({
      // separador "." para casar com <input type="number"> (não usar vírgula).
      price: String(centsToReais(p.priceCents)),
      name: p.name,
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? "",
      category: p.category ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    const name = form.name.trim();
    if (name.length < 1) {
      setFormError("Informe o nome do produto.");
      return;
    }
    const reais = parseFloat(form.price.replace(",", "."));
    const priceCents = reaisToCents(reais);
    if (!Number.isFinite(reais) || !Number.isInteger(priceCents) || priceCents <= 0) {
      setFormError("Informe um preço válido (maior que zero).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        priceCents,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        category: form.category.trim() || null,
      };
      if (editing) {
        await updateMerchantProduct(editing.id, payload);
      } else {
        await createMerchantProduct(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Falha ao salvar produto.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: MerchantProduct) => {
    setBusyId(p.id);
    try {
      await updateMerchantProduct(p.id, { active: !p.active });
      setProducts((list) =>
        list.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)),
      );
    } catch {
      // mantém o estado anterior em caso de falha
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: MerchantProduct) => {
    if (!window.confirm(`Excluir "${p.name}"?`)) return;
    setBusyId(p.id);
    try {
      await deleteMerchantProduct(p.id);
      setProducts((list) => list.filter((x) => x.id !== p.id));
    } catch {
      // ignora — recarrega na próxima
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="rounded-[32px] border border-black/8 bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Produtos</h2>
          <button
            onClick={openCreate}
            className="flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Novo produto
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-[24px] border border-black/8 bg-white/80 p-4">
                <Skeleton className="h-16 w-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">
              Nenhum produto cadastrado. Use “Novo produto”.
            </p>
          ) : (
            products.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-[24px] border border-black/8 bg-white/80 p-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black/5">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-neutral-950">
                      {p.name}
                      {!p.active && (
                        <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-[0.7rem] font-medium text-neutral-600">
                          inativo
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-600">{formatBRL(p.priceCents)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={busyId === p.id}
                    className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-black/5 disabled:opacity-40 sm:flex-none"
                  >
                    {p.active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-black/5 sm:flex-none"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(p)}
                    disabled={busyId === p.id}
                    className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40 sm:flex-none"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar produto" : "Novo produto"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Gin Tônica"
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">Preço (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="25.00"
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">Descrição (opcional)</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Com limão siciliano"
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">URL da imagem (opcional)</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…"
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">Categoria (opcional)</label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Drinks"
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-base text-neutral-950 outline-none focus:border-neutral-950/30 focus:ring-4 focus:ring-neutral-950/6"
            />
          </div>

          {formError && <p className="text-sm font-medium text-red-600">{formError}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </Modal>
    </>
  );
}
