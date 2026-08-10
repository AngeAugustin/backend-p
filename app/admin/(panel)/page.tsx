import Link from "next/link";
import {
  BookOpen,
  FolderKanban,
  Mail,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  MessagesEvolutionChart,
  type MessagesByMonthPoint,
} from "@/components/admin/MessagesEvolutionChart";
import { cn } from "@/lib/utils";

type StatTheme = {
  number: string;
  iconBg: string;
  icon: string;
  glow: string;
};

const themes: StatTheme[] = [
  {
    number: "text-[#312e81]",
    iconBg: "bg-[#eef2ff]",
    icon: "text-[#4f46e5]",
    glow: "bg-[#c7d2fe]",
  },
  {
    number: "text-[#9a3412]",
    iconBg: "bg-[#ffedd5]",
    icon: "text-[#ea580c]",
    glow: "bg-[#fed7aa]",
  },
  {
    number: "text-[#1e3a8a]",
    iconBg: "bg-[#dbeafe]",
    icon: "text-[#2563eb]",
    glow: "bg-[#bfdbfe]",
  },
  {
    number: "text-[#14532d]",
    iconBg: "bg-[#dcfce7]",
    icon: "text-[#16a34a]",
    glow: "bg-[#bbf7d0]",
  },
];

type StatCard = {
  href: string;
  title: string;
  subtitle: string;
  count: number;
  icon: LucideIcon;
};

function StatCardItem({
  href,
  title,
  subtitle,
  count,
  icon: Icon,
  theme,
}: StatCard & { theme: StatTheme }) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[14px] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(15,23,42,0.08),0_12px_28px_rgba(15,23,42,0.08)]"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-10 -top-10 size-36 rounded-full opacity-50 blur-2xl transition group-hover:opacity-70",
          theme.glow
        )}
      />

      <div className="relative">
        <div
          className={cn(
            "mb-5 flex size-10 items-center justify-center rounded-[10px]",
            theme.iconBg,
            theme.icon
          )}
        >
          <Icon className="size-[18px]" strokeWidth={2.25} />
        </div>

        <p
          className={cn(
            "text-[32px] font-bold leading-none tracking-tight",
            theme.number
          )}
        >
          {count}
        </p>
        <p className="mt-2 text-[15px] font-semibold leading-snug text-[#1e293b]">
          {title}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-[#94a3b8]">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

function buildMessagesByMonth(
  messages: { createdAt: Date }[],
  months = 12
): MessagesByMonthPoint[] {
  const now = new Date();
  const points: MessagesByMonthPoint[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });

    points.push({
      month: key,
      label: label.replace(".", ""),
      count: 0,
    });
  }

  const indexByMonth = new Map(points.map((point, index) => [point.month, index]));

  for (const message of messages) {
    const created = new Date(message.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const index = indexByMonth.get(key);
    if (index !== undefined) {
      points[index].count += 1;
    }
  }

  return points;
}

export default async function AdminDashboardPage() {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [projects, articles, services, unreadMessages, recentMessages] =
    await Promise.all([
      prisma.project.count(),
      prisma.article.count(),
      prisma.service.count(),
      prisma.contactMessage.count({ where: { status: "new" } }),
      prisma.contactMessage.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const cards: StatCard[] = [
    {
      href: "/admin/projects",
      title: "Projets",
      subtitle: "Tous les projets",
      count: projects,
      icon: FolderKanban,
    },
    {
      href: "/admin/articles",
      title: "Articles",
      subtitle: "Contenus du blog",
      count: articles,
      icon: BookOpen,
    },
    {
      href: "/admin/services",
      title: "Services",
      subtitle: "Offres proposées",
      count: services,
      icon: Sparkles,
    },
    {
      href: "/admin/contact-messages",
      title: "Messages",
      subtitle: "Nouveaux / non lus",
      count: unreadMessages,
      icon: Mail,
    },
  ];

  const chartData = buildMessagesByMonth(recentMessages, 12);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vue d’ensemble des contenus publiés via l’API portfolio."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <StatCardItem key={card.href} {...card} theme={themes[index]} />
        ))}
      </div>

      <div className="mt-4">
        <MessagesEvolutionChart data={chartData} />
      </div>
    </div>
  );
}
