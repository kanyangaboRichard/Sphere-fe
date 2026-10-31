import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, ImageIcon, ClipboardList, ShoppingBag, Tag, ArrowRight } from "lucide-react";
import api from "../../lib/axios";
import axios from "axios";

type Status = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

interface RecentArticle {
  id: string;
  title: string;
  excerpt?: string | null;
  status: Status;
  createdAt: string;
  publishedAt: string | null;
  category?: { id: string; name: string } | null;
  coverMedia?: { url: string } | null;
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  inReview: number;
}

interface ShopSnapshot {
  products: number;
  onOffer: number;
  categories: number;
}

const statusDot: Record<Status, string> = {
  DRAFT: "#9ca3af",
  IN_REVIEW: "#f5b301",
  SCHEDULED: "#8b5cf6",
  PUBLISHED: "#10b981",
  ARCHIVED: "#6b7280",
};

const statusLabel: Record<Status, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  SCHEDULED: "Scheduled",
  ARCHIVED: "Archived",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

const listOf = (res: PromiseSettledResult<unknown>): unknown[] => {
  if (res.status !== "fulfilled") return [];
  const value = res.value as { data?: { data?: unknown } | unknown };
  const d = (value as { data?: { data?: unknown } })?.data?.data ?? (value as { data?: unknown })?.data;
  return Array.isArray(d) ? d : [];
};

// Shared dark-surface tokens (change the accent here to retheme the page)
const ACCENT = "#00C8E0";
const panel = "bg-[var(--c-surface,#ffffff)] border border-[var(--c-border,#e8eaed)] rounded-2xl";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8E0] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg,#f4f5f7)]";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("sphere_user") || "{}");

  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentArticle[]>([]);
  const [shop, setShop] = useState<ShopSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.get("/articles/stats"),
          api.get("/articles", { params: { limit: 6, page: 1 } }),
        ]);
        setStats(statsRes.data.data ?? statsRes.data);
        const recentData = recentRes.data.data ?? recentRes.data;
        setRecent(recentData.articles ?? recentData);
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Couldn't load the dashboard. Check your connection and refresh.";
        setError(message);
      } finally {
        setLoading(false);
      }

      // Shop numbers are secondary: a failure here shouldn't break the page.
      const [prodRes, catRes] = await Promise.allSettled([api.get("/shop-products"), api.get("/shop-categories")]);
      const products = listOf(prodRes) as Array<{ isDeal?: boolean }>;
      setShop({
        products: products.length,
        onOffer: products.filter((p) => p.isDeal).length,
        categories: listOf(catRes).length,
      });
    };
    load();
  }, []);

  const stages = stats
    ? [
        { key: "DRAFT", label: "Drafts", value: stats.draft, bar: "bg-gray-500", dot: "bg-gray-500" },
        { key: "IN_REVIEW", label: "In review", value: stats.inReview, bar: "bg-amber-400", dot: "bg-amber-400" },
        { key: "SCHEDULED", label: "Scheduled", value: stats.scheduled, bar: "bg-violet-500", dot: "bg-violet-500" },
        { key: "PUBLISHED", label: "Published", value: stats.published, bar: "bg-emerald-500", dot: "bg-emerald-500" },
      ]
    : [];

  const attention = stats
    ? ([
        stats.inReview > 0 && {
          text: `${stats.inReview} ${stats.inReview === 1 ? "story is" : "stories are"} waiting for review`,
          path: "/dashboard/articles?status=IN_REVIEW",
        },
        stats.draft > 0 && {
          text: `${stats.draft} ${stats.draft === 1 ? "draft is" : "drafts are"} unfinished`,
          path: "/dashboard/articles?status=DRAFT",
        },
      ].filter(Boolean) as { text: string; path: string }[])
    : [];

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex-1 min-h-screen bg-[var(--c-bg,#f4f5f7)] text-[var(--c-text,#111418)]">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 lg:px-8 h-[72px] border-b border-[var(--c-border,#e8eaed)] sticky top-0 z-10 bg-[var(--c-bg,#f4f5f7)]">
        <div className="min-w-0">
          <h1 className="font-condensed text-[22px] font-bold leading-tight truncate">
            {greeting()}, {user.firstName || "there"}
          </h1>
          <p className="text-[13px] text-[var(--c-muted,#6b7280)]">{today}</p>
        </div>
        <button
          onClick={() => navigate("/dashboard/articles/new")}
          className={`flex items-center gap-1.5 text-[#0b1118] font-condensed text-sm font-bold px-4 py-2 rounded-lg hover:brightness-110 transition ${focusRing}`}
          style={{ background: ACCENT }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New article
        </button>
      </header>

      <div className="px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-[1280px]">
        {error && (
          <div role="alert" className="bg-[var(--c-danger-bg,#fff1f1)] border border-[var(--c-danger-border,#fecaca)] text-[var(--c-danger,#dc2626)] text-sm px-4 py-3 rounded-xl flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="font-medium underline underline-offset-2 whitespace-nowrap">
              Try again
            </button>
          </div>
        )}

        {/* Pipeline */}
        <section className={`bg-[var(--c-surface,#ffffff)] text-[var(--c-text,#111418)] border border-[var(--c-border,#e8eaed)] shadow-sm rounded-2xl relative overflow-hidden p-6`}>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 w-[380px] h-[380px] rounded-full opacity-[0.10] blur-3xl"
            style={{ background: ACCENT }}
          />
          <div className="relative">
            {loading || !stats ? (
              <div className="animate-pulse">
                <div className="h-10 w-72 bg-[var(--c-hover-strong,#e8eaed)] rounded mb-6" />
                <div className="h-3 w-full bg-[var(--c-hover-strong,#e8eaed)] rounded-full mb-5" />
                <div className="flex gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 w-20 bg-[var(--c-hover-strong,#e8eaed)] rounded" />
                  ))}
                </div>
              </div>
            ) : stats.total === 0 ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-condensed text-3xl font-bold leading-tight">No stories yet</h2>
                  <p className="text-sm text-[var(--c-muted,#6b7280)] mt-1">Write your first article and it will show up here as it moves toward publishing.</p>
                </div>
                <button
                  onClick={() => navigate("/dashboard/articles/new")}
                  className={`text-[#0b1118] font-condensed font-bold text-sm px-5 py-2.5 rounded-lg hover:brightness-110 transition ${focusRing}`}
                  style={{ background: ACCENT }}
                >
                  Write an article
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
                  <h2 className="font-condensed text-[44px] font-bold leading-none">{stats.published} live on the site</h2>
                  <p className="text-sm text-[var(--c-muted,#6b7280)]">
                    {stats.total} {stats.total === 1 ? "story" : "stories"} in total
                  </p>
                </div>

                <div
                  className="flex h-2.5 w-full rounded-full overflow-hidden bg-[var(--c-hover-strong,#e8eaed)] gap-[2px]"
                  role="img"
                  aria-label={stages.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(", ")}
                >
                  {stages
                    .filter((s) => s.value > 0)
                    .map((s) => (
                      <div key={s.key} className={s.bar} style={{ flexGrow: s.value, flexBasis: 0 }} />
                    ))}
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {stages.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => navigate(`/dashboard/articles?status=${s.key}`)}
                      className={`text-left rounded-xl px-4 py-3 bg-[var(--c-surface-2,#f8f9fb)] border border-[var(--c-border,#e8eaed)] hover:bg-[var(--c-hover,#f3f4f6)] transition-colors ${focusRing}`}
                    >
                      <div className="flex items-center gap-2 text-sm text-[var(--c-muted,#6b7280)]">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </div>
                      <div className="font-condensed text-3xl font-bold leading-tight mt-1">{s.value}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Needs attention */}
        {attention.length > 0 && (
          <div className="flex flex-wrap gap-2 -mt-2">
            {attention.map((a) => (
              <button
                key={a.text}
                onClick={() => navigate(a.path)}
                className={`cms-attn ${focusRing}`}
              >
                <span className="cms-attn-dot" />
                {a.text}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Latest stories */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-condensed text-xl font-bold">Latest stories</h2>
              <button
                onClick={() => navigate("/dashboard/articles")}
                className={`flex items-center gap-1 text-sm font-medium rounded hover:underline text-[var(--c-accent-ink,#007f8f)] ${focusRing}`}
              >
                See all articles
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`${panel} h-[300px] animate-pulse`} />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className={`${panel} px-6 py-14 text-center`}>
                <p className="text-sm text-[var(--c-muted,#6b7280)] mb-4">No articles yet.</p>
                <button
                  onClick={() => navigate("/dashboard/articles/new")}
                  className={`text-[#0b1118] font-condensed text-sm font-bold px-4 py-2 rounded-lg hover:brightness-110 ${focusRing}`}
                  style={{ background: ACCENT }}
                >
                  Write your first article
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {recent.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => navigate(`/dashboard/articles/${a.id}`)}
                      className={`${panel} group w-full text-left overflow-hidden hover:border-[var(--c-border-strong,#e2e4e8)] transition-colors ${focusRing}`}
                    >
                      <div className="relative aspect-[16/9] bg-gradient-to-br from-[#e6edf3] to-[#cfd9e3]">
                        {a.coverMedia?.url ? (
                          <img src={a.coverMedia.url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 motion-reduce:transition-none" />
                        ) : (
                          <FileText className="absolute inset-0 m-auto w-8 h-8 text-slate-400/70" strokeWidth={1.5} />
                        )}
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm shadow-sm" style={{ background: "rgba(255,255,255,0.92)", color: "#1f2937" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot[a.status] }} />
                          {statusLabel[a.status]}
                        </span>
                      </div>
                      <div className="p-4">
                        {a.category?.name && (
                          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 text-[var(--c-accent-ink,#007f8f)]">
                            {a.category.name}
                          </div>
                        )}
                        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2">{a.title}</h3>
                        {a.excerpt && (
                          <p className="text-[13px] leading-relaxed text-[var(--c-muted,#6b7280)] mt-1.5 line-clamp-3">{a.excerpt}</p>
                        )}
                        <p className="text-xs text-[var(--c-faint,#9ca3af)] mt-3">{timeAgo(a.publishedAt || a.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <section className={`${panel} p-5`}>
              <h2 className="font-condensed text-lg font-bold mb-4">Shop</h2>
              {shop === null ? (
                <div className="h-16 bg-[var(--c-hover,#f3f4f6)] rounded animate-pulse" />
              ) : (
                <>
                  <dl className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Products", value: shop.products },
                      { label: "On offer", value: shop.onOffer },
                      { label: "Categories", value: shop.categories },
                    ].map((m) => (
                      <div key={m.label}>
                        <dd className="font-condensed text-2xl font-bold leading-none">{m.value}</dd>
                        <dt className="text-xs text-[var(--c-muted,#6b7280)] mt-1">{m.label}</dt>
                      </div>
                    ))}
                  </dl>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/dashboard/shop-products")}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-[var(--c-hover,#f3f4f6)] hover:bg-[var(--c-hover-strong,#e8eaed)] rounded-lg py-2 transition-colors ${focusRing}`}
                    >
                      <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
                      Products
                    </button>
                    <button
                      onClick={() => navigate("/dashboard/shop-categories")}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-[var(--c-border-strong,#e2e4e8)] hover:bg-[var(--c-hover,#f3f4f6)] rounded-lg py-2 transition-colors ${focusRing}`}
                    >
                      <Tag className="w-4 h-4" strokeWidth={1.75} />
                      Categories
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className={`${panel} p-5`}>
              <h2 className="font-condensed text-lg font-bold mb-3">Shortcuts</h2>
              <div className="flex flex-col gap-1">
                {[
                  { label: "Write new article", path: "/dashboard/articles/new", icon: Plus },
                  { label: "Open gallery", path: "/dashboard/gallery", icon: ImageIcon },
                  { label: "View audit logs", path: "/dashboard/audit-logs", icon: ClipboardList },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => navigate(q.path)}
                    className={`flex items-center gap-3 text-sm text-left text-[var(--c-text-2,#374151)] px-3 py-2.5 rounded-lg hover:bg-[var(--c-hover,#f3f4f6)] transition-colors ${focusRing}`}
                  >
                    <q.icon className="w-4 h-4 text-[var(--c-muted,#6b7280)]" strokeWidth={1.75} />
                    {q.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}