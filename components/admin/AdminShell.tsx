"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Briefcase,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Sparkles,
  X,
} from "lucide-react";
import { resources } from "@/lib/admin-resources";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { cn } from "@/lib/utils";

const iconByKey: Record<string, React.ComponentType<{ className?: string }>> = {
  projects: FolderKanban,
  articles: BookOpen,
  services: Sparkles,
  experiences: Briefcase,
  testimonials: MessageSquareQuote,
  educations: GraduationCap,
};

function getInitials(email?: string | null) {
  if (!email) return "AD";
  const local = email.split("@")[0] || "admin";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function displayName(email?: string | null) {
  if (!email) return "Admin";
  const local = email.split("@")[0] || "admin";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const links = useMemo(
    () => [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      ...resources.map((resource) => ({
        href: `/admin/${resource.key}`,
        label: resource.label,
        icon: iconByKey[resource.key] || FolderKanban,
        exact: false,
      })),
      {
        href: "/admin/contact-messages",
        label: "Messages",
        icon: Mail,
        exact: false,
      },
    ],
    []
  );

  const current = links.find((link) =>
    link.exact
      ? pathname === link.href
      : pathname === link.href || pathname.startsWith(`${link.href}/`)
  );

  const initials = getInitials(email);
  const name = displayName(email);

  async function logout() {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLogoutLoading(false);
      setLogoutOpen(false);
    }
  }

  function requestLogout() {
    setLogoutOpen(true);
  }

  function Brand() {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/drapeau.png"
          alt="Drapeau du Bénin"
          className="h-8 w-auto shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold tracking-tight text-foreground">
            Augustin FACHEHOUN
          </p>
          <p className="text-xs text-muted-foreground">Back office</p>
        </div>
      </div>
    );
  }

  function NavItems({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="space-y-1 px-3">
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  function SidebarBody({
    onNavigate,
    showClose,
  }: {
    onNavigate?: () => void;
    showClose?: boolean;
  }) {
    return (
      <>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <Brand />
          {showClose ? (
            <button
              type="button"
              onClick={onNavigate}
              className="rounded-xl p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <NavItems onNavigate={onNavigate} />
        </div>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={requestLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/5"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/60 text-foreground">
      <ConfirmModal
        open={logoutOpen}
        title="Se déconnecter ?"
        description="Vous allez quitter le back-office. Vous pourrez vous reconnecter à tout moment."
        confirmLabel="Se déconnecter"
        cancelLabel="Rester connecté"
        tone="danger"
        loading={logoutLoading}
        onConfirm={() => void logout()}
        onCancel={() => setLogoutOpen(false)}
      />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-border bg-card md:flex">
        <SidebarBody />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col bg-card shadow-2xl">
            <SidebarBody onNavigate={() => setMobileOpen(false)} showClose />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-col md:pl-[260px]">
        <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-border bg-card">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-border bg-card p-2 text-foreground md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" />
              </button>
              <h2 className="truncate font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {current?.label || "Back-office"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">Administrateur</p>
              </div>
              <div
                className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                title={email || "Admin"}
              >
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
