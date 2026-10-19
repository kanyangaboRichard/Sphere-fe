import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../../components/layouts/Topbar";
import api from "../../lib/axios";
import axios from "axios";

type Status = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

interface RecentArticle {
  id: string;
  title: string;
  status: Status;
  createdAt: string;
  publishedAt: string | null;
  category?: { id: string; name: string } | null;
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

const statusChip: Record<Status, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-gray-100 text-gray-600",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  SCHEDULED: "bg-violet-50 text-violet-700",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

const statusDot: Record<Status, string> = {
  PUBLISHED: "bg-emerald-500",
  DRAFT: "bg-gray-300",
  IN_REVIEW: "bg-amber-500",
  SCHEDULED: "bg-violet-500",
  ARCHIVED: "bg-gray-300",
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
  const value = res.value as { data?: { data?: unknown } & unknown };
  const d = value?.data?.data ?? value?.data;
  return Array.isArray(d) ? d : [];
};

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
      const [prodRes, catRes] = await Promise.allSettled([
        api.get("/shop-products"),
        api.get("/shop-categories"),
      ]);
      const products = listOf(prodRes) as { isDeal?: boolean }[];
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
        { key: "DRAFT", label: "Drafts", value: stats.draft, bar: "bg-gray-300", dot: "bg-gray-300" },
        { key: "IN_REVIEW", label: "In review", value: stats.inReview, bar: "bg-amber-400", dot: "bg-amber-400" },
        { key: "SCHEDULED", label: "Scheduled", value: stats.scheduled, bar: "bg-violet-500", dot: "bg-violet-500" },
        { key: "PUBLISHED", label: "Published", value: stats.published, bar: "bg-emerald-500", dot: "bg-emerald-500" },
      ]
    : [];

  const attention = stats
    ? [
        stats.inReview > 0 && {
          text: `${stats.inReview} ${stats.inReview === 1 ? "story is" : "stories are"} waiting for review`,
          path: "/dashboard/articles?status=IN_REVIEW",
        },
        stats.draft > 0 && {
          text: `${stats.draft} ${stats.draft === 1 ? "draft is" : "drafts are"} unfinished`,
          path: "/dashboard/articles?status=DRAFT",
        },
      ].filter(Boolean) as { text: string; path: string }[]
    : [];

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8E0] focus-visible:ring-offset-2";

  return (
    <>
      <Topbar
        title={`${greeting()}, ${user.firstName || "there"}`}
        subtitle="Your newsroom at a glance"
        actions={
          <button
            onClick={() => navigate("/dashboard/articles/new")}
            className={`bg-navy-900 hover:bg-navy-800 text-white font-condensed text-sm font-semibold tracking-wide px-4 py-2 rounded-lg transition-colors ${focusRing}`}
          >
            New article
          </button>
        }
      />

      <div className="p-6 flex flex-col gap-5 max-w-[1240px]">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="font-medium underline underline-offset-2 whitespace-nowrap">
              Try again
            </button>
          </div>
        )}

        {/* Pipeline: the one featured element */}
        <section className="bg-navy-900 rounded-2xl p-6 text-white">
          {loading || !stats ? (
            <div className="animate-pulse">
              <div className="h-10 w-72 bg-white/10 rounded mb-6" />
              <div className="h-3 w-full bg-white/10 rounded-full mb-5" />
              <div className="flex gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-20 bg-white/10 rounded" />
                ))}
              </div>
            </div>
          ) : stats.total === 0 ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-condensed text-3xl font-bold leading-tight">No stories yet</h2>
                <p className="text-sm text-white/60 mt-1">Write your first article and it will show up here as it moves toward publishing.</p>
              </div>
              <button
                onClick={() => navigate("/dashboard/articles/new")}
                className={`bg-[#00C8E0] text-navy-900 font-condensed font-bold text-sm px-5 py-2.5 rounded-lg hover:brightness-110 transition ${focusRing}`}
              >
                Write an article
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
                <h2 className="font-condensed text-[40px] font-bold leading-none">
                  {stats.published} live on the site
                </h2>
                <p className="text-sm text-white/60">
                  {stats.total} {stats.total === 1 ? "story" : "stories"} in total
                </p>
              </div>

              <div
                className="flex h-3 w-full rounded-full overflow-hidden bg-white/10 gap-[2px]"
                role="img"
                aria-label={stages.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(", ")}
              >
                {stages.filter((s) => s.value > 0).map((s) => (
                  <div key={s.key} className={s.bar} style={{ flexGrow: s.value, flexBasis: 0 }} />
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stages.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => navigate(`/dashboard/articles?status=${s.key}`)}
                    className={`text-left rounded-lg px-3 py-2 -mx-3 hover:bg-white/5 transition-colors ${focusRing} focus-visible:ring-offset-navy-900`}
                  >
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </div>
                    <div className="font-condensed text-3xl font-bold leading-tight mt-0.5">{s.value}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Needs attention */}
        {attention.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attention.map((a) => (
              <button
                key={a.text}
                onClick={() => navigate(a.path)}
                className={`flex items-center gap-2 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-4 py-1.5 hover:bg-amber-100 transition-colors ${focusRing}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {a.text}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* Recent articles */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-condensed text-lg font-bold text-gray-900">Recent articles</h2>
              <button
                onClick={() => navigate("/dashboard/articles")}
                className={`text-sm text-[#007f8f] font-medium hover:underline rounded ${focusRing}`}
              >
                See all articles
              </button>
            </div>

            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[60px] border-b border-gray-50 last:border-b-0 animate-pulse bg-gray-50/60" />
              ))
            ) : recent.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-gray-500 mb-3">No articles yet.</p>
                <button
                  onClick={() => navigate("/dashboard/articles/new")}
                  className={`bg-navy-900 text-white font-condensed text-sm font-semibold px-4 py-2 rounded-lg hover:bg-navy-800 ${focusRing}`}
                >
                  Write your first article
                </button>
              </div>
            ) : (
              <ul>
                {recent.map((a) => (
                  <li key={a.id} className="border-b border-gray-50 last:border-b-0">
                    <button
                      onClick={() => navigate(`/dashboard/articles/${a.id}`)}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors ${focusRing} focus-visible:ring-inset focus-visible:ring-offset-0`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[a.status]}`} aria-hidden />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-medium text-gray-900 truncate">{a.title}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {a.category?.name ? `${a.category.name}, ` : ""}
                          {timeAgo(a.publishedAt || a.createdAt)}
                        </span>
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${statusChip[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-condensed text-lg font-bold text-gray-900 mb-3">Shop</h2>
              {shop === null ? (
                <div className="h-16 bg-gray-50 rounded animate-pulse" />
              ) : (
                <>
                  <dl className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Products", value: shop.products },
                      { label: "On offer", value: shop.onOffer },
                      { label: "Categories", value: shop.categories },
                    ].map((m) => (
                      <div key={m.label}>
                        <dd className="font-condensed text-2xl font-bold text-gray-900 leading-none">{m.value}</dd>
                        <dt className="text-xs text-gray-500 mt-1">{m.label}</dt>
                      </div>
                    ))}
                  </dl>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/dashboard/shop-products")}
                      className={`flex-1 text-sm font-medium bg-gray-900 text-white rounded-lg py-2 hover:bg-gray-800 transition-colors ${focusRing}`}
                    >
                      Add product
                    </button>
                    <button
                      onClick={() => navigate("/dashboard/shop-categories")}
                      className={`flex-1 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg py-2 hover:bg-gray-50 transition-colors ${focusRing}`}
                    >
                      Categories
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-condensed text-lg font-bold text-gray-900 mb-3">Shortcuts</h2>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Write new article", path: "/dashboard/articles/new" },
                  { label: "Open gallery", path: "/dashboard/gallery" },
                  { label: "View audit logs", path: "/dashboard/audit-logs" },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => navigate(q.path)}
                    className={`text-sm text-left text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${focusRing}`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}