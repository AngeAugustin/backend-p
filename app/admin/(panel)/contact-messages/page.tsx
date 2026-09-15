"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Check,
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-client";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  Pagination,
  useClientPagination,
} from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  locale: string;
  status: string;
  createdAt: string;
};

type Folder = "inbox" | "new" | "read" | "archived";

const FOLDERS: { key: Folder; label: string; icon: typeof Inbox }[] = [
  { key: "inbox", label: "Boîte de réception", icon: Inbox },
  { key: "new", label: "Non lus", icon: Mail },
  { key: "read", label: "Lus", icon: MailOpen },
  { key: "archived", label: "Archives", icon: Archive },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function preview(text: string, max = 72) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

function formatListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Hier";

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContactMessagesPage() {
  const [rows, setRows] = useState<Message[]>([]);
  const [folder, setFolder] = useState<Folder>("inbox");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileReading, setMobileReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(options?: { preserveSelection?: boolean }) {
    try {
      const response = await adminFetch<{ data: Message[] }>(
        "/api/admin/contact-messages"
      );
      const data = response.data || [];
      setRows(data);
      setError(null);

      if (!options?.preserveSelection) return;

      setSelectedId((current) => {
        if (current && data.some((row) => row.id === current)) return current;
        return data[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load({ preserveSelection: true });
  }, []);

  const counts = useMemo(
    () => ({
      inbox: rows.filter((row) => row.status !== "archived").length,
      new: rows.filter((row) => row.status === "new").length,
      read: rows.filter((row) => row.status === "read").length,
      archived: rows.filter((row) => row.status === "archived").length,
    }),
    [rows]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (folder === "inbox") return row.status !== "archived";
        return row.status === folder;
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.message.toLowerCase().includes(q)
        );
      });
  }, [rows, folder, query]);

  const { page, setPage, pageItems, meta, showPagination } = useClientPagination(
    visible,
    DEFAULT_ADMIN_PAGE_SIZE,
    `${folder}:${query}`
  );

  useEffect(() => {
    if (pageItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !pageItems.some((row) => row.id === selectedId)) {
      setSelectedId(pageItems[0]!.id);
    }
  }, [pageItems, selectedId]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/contact-messages/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, status } : row))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible");
    } finally {
      setBusyId(null);
    }
  }

  async function selectMessage(message: Message) {
    setSelectedId(message.id);
    setMobileReading(true);
    if (message.status === "new") {
      await setStatus(message.id, "read");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/contact-messages/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);
      setRows((current) => current.filter((row) => row.id !== deletedId));
      setSelectedId((current) => (current === deletedId ? null : current));
      setMobileReading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f3f7f5]">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Supprimer ce message ?"
        description={
          deleteTarget
            ? `Le message de ${deleteTarget.name} (${deleteTarget.email}) sera définitivement supprimé.`
            : "Ce message sera définitivement supprimé."
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />

      {error ? (
        <div className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(280px,380px)_minmax(0,1fr)]">
        {/* Folders */}
        <aside className="hidden min-h-0 flex-col border-r border-border bg-card lg:flex">
          <div className="border-b border-border px-5 py-5">
            <p className="font-display text-lg font-bold tracking-tight text-foreground">
              Messagerie
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {counts.new > 0
                ? `${counts.new} non lu${counts.new > 1 ? "s" : ""}`
                : "À jour"}
            </p>
          </div>
          <nav className="space-y-1 p-3" aria-label="Dossiers">
            {FOLDERS.map((item) => {
              const Icon = item.icon;
              const active = folder === item.key;
              const count = counts[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setFolder(item.key);
                    setMobileReading(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums text-xs font-semibold",
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Message list */}
        <section
          className={cn(
            "min-h-0 flex-col border-r border-border bg-card",
            mobileReading ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="shrink-0 space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div>
                <p className="font-display text-base font-bold tracking-tight">
                  Messagerie
                </p>
                <p className="text-xs text-muted-foreground">
                  {counts.new} non lu{counts.new > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un expéditeur ou un message"
                className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto lg:hidden">
              {FOLDERS.map((item) => {
                const active = folder === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFolder(item.key)}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {item.label.split(" ")[0]}
                    <span className="ml-1 tabular-nums opacity-80">
                      {counts[item.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {[0, 1, 2, 3, 4].map((key) => (
                  <div
                    key={key}
                    className="border-b border-border/70 px-4 py-4"
                  >
                    <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
                    <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-secondary/80" />
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                <Mail className="mb-3 size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  Aucun message ici
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {query
                    ? "Aucun résultat pour cette recherche."
                    : "Ce dossier est vide."}
                </p>
              </div>
            ) : (
              <ul role="listbox" aria-label="Liste des messages">
                {pageItems.map((row) => {
                  const active = row.id === selectedId;
                  const unread = row.status === "new";
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => void selectMessage(row)}
                        className={cn(
                          "group relative flex w-full gap-3 border-b border-border/70 px-4 py-3.5 text-left transition",
                          active
                            ? "bg-accent"
                            : "hover:bg-secondary/70",
                          unread && !active && "bg-[#f7fbf9]"
                        )}
                      >
                        {unread ? (
                          <span
                            aria-hidden
                            className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-glow"
                          />
                        ) : null}
                        <div
                          className={cn(
                            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold",
                            unread
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          )}
                        >
                          {initials(row.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p
                              className={cn(
                                "truncate text-sm",
                                unread
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground/90"
                              )}
                            >
                              {row.name}
                            </p>
                            <time
                              dateTime={row.createdAt}
                              className={cn(
                                "shrink-0 text-[11px] tabular-nums",
                                unread
                                  ? "font-semibold text-glow"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatListTime(row.createdAt)}
                            </time>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {row.email}
                          </p>
                          <p
                            className={cn(
                              "mt-1 line-clamp-2 text-[13px] leading-snug",
                              unread
                                ? "text-foreground/80"
                                : "text-muted-foreground"
                            )}
                          >
                            {preview(row.message)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {showPagination ? (
            <div className="shrink-0 border-t border-border bg-card px-3 py-3">
              <Pagination
                page={page}
                pageCount={meta.pageCount}
                total={meta.total}
                pageSize={meta.pageSize}
                onPageChange={setPage}
                disabled={loading}
              />
            </div>
          ) : null}
        </section>

        {/* Reading pane */}
        <section
          className={cn(
            "min-h-0 flex-col bg-[#f7fbf8]",
            mobileReading ? "flex" : "hidden lg:flex"
          )}
        >
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-card text-muted-foreground">
                <Inbox className="size-6" />
              </div>
              <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                Sélectionne un message
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                La conversation s’ouvrira ici, comme dans une boîte mail.
              </p>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-border bg-card">
                <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                  <button
                    type="button"
                    onClick={() => setMobileReading(false)}
                    className="inline-flex size-9 items-center justify-center rounded-xl text-foreground transition hover:bg-secondary lg:hidden"
                    aria-label="Retour à la liste"
                  >
                    <ArrowLeft className="size-4" />
                  </button>

                  <div className="ml-auto flex items-center gap-1">
                    {selected.status !== "read" ? (
                      <button
                        type="button"
                        disabled={busyId === selected.id}
                        onClick={() => void setStatus(selected.id, "read")}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
                      >
                        <Check className="size-3.5 text-glow" />
                        <span className="hidden sm:inline">Lu</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === selected.id}
                        onClick={() => void setStatus(selected.id, "new")}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
                      >
                        <Mail className="size-3.5" />
                        <span className="hidden sm:inline">Non lu</span>
                      </button>
                    )}
                    {selected.status !== "archived" ? (
                      <button
                        type="button"
                        disabled={busyId === selected.id}
                        onClick={() => void setStatus(selected.id, "archived")}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
                      >
                        <Archive className="size-3.5" />
                        <span className="hidden sm:inline">Archiver</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === selected.id}
                        onClick={() => void setStatus(selected.id, "read")}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
                      >
                        <Inbox className="size-3.5" />
                        <span className="hidden sm:inline">Restaurer</span>
                      </button>
                    )}
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: Contact portfolio — ${selected.name}`)}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Reply className="size-3.5" />
                      <span className="hidden sm:inline">Répondre</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selected)}
                      className="inline-flex size-9 items-center justify-center rounded-xl text-destructive transition hover:bg-destructive/5"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 sm:px-8">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-sm font-bold text-primary-foreground">
                      {initials(selected.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                          {selected.name}
                        </h1>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {selected.locale}
                        </span>
                      </div>
                      <a
                        href={`mailto:${selected.email}`}
                        className="mt-0.5 inline-block text-sm text-muted-foreground transition hover:text-glow"
                      >
                        {selected.email}
                      </a>
                      <p className="mt-2 text-xs capitalize text-muted-foreground">
                        {formatFullDate(selected.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
                <div className="mx-auto max-w-2xl">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-20px_rgba(16,44,39,0.35)] sm:p-7">
                    <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-foreground/90 sm:text-base">
                      {selected.message}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
