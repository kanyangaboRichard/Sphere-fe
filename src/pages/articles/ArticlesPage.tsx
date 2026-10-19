/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Pencil, Eye, EyeOff, Trash2, X } from "lucide-react";
import Topbar from "../../components/layouts/Topbar";
import api from "../../lib/axios";

// ── Types ──────────────────────────────────────────────────────────────────

type Status = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

interface Article {
  id: string;
  title: string;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  author: { id: string; firstName: string; lastName: string } | null;
  status: Status;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  inReview: number;
}

const TABS: { key: "all" | Status; label: string; stat: keyof Stats }[] = [
  { key: "all", label: "All", stat: "total" },
  { key: "PUBLISHED", label: "Published", stat: "published" },
  { key: "DRAFT", label: "Drafts", stat: "draft" },
  { key: "IN_REVIEW", label: "In review", stat: "inReview" },
  { key: "SCHEDULED", label: "Scheduled", stat: "scheduled" },
];

const VALID = new Set(TABS.map((t) => t.key));

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

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C8E0] focus-visible:ring-offset-1";

// ── Delete confirm dialog ──────────────────────────────────────────────────

function DeleteDialog({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="del-title" className="bg-white rounded-xl w-full max-w-[400px] p-6 shadow-xl">
        <h2 id="del-title" className="font-condensed text-lg font-bold text-gray-900 mb-2">Delete this article?</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          <span className="font-medium text-gray-900">"{title}"</span> will be permanently removed. This can't be undone.
        </p>
        <div className="flex gap-2">
          <button ref={cancelRef} onClick={onCancel} className={`flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 ${focusRing}`}>
            Keep article
          </button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 ${focusRing}`}>
            Delete article
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const rawStatus = params.get("status") ?? "all";
  const statusFilter = (VALID.has(rawStatus as any) ? rawStatus : "all") as "all" | Status;

  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const setStatus = (key: "all" | Status) => {
    const next = new URLSearchParams(params);
    if (key === "all") next.delete("status");
    else next.set("status", key);
    setParams(next, { replace: true });
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/articles/stats");
      setStats(res.data.data ?? res.data);
    } catch {
      /* tab counts are optional */
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/articles", {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          limit: 100,
        },
      });
      const data = res.data.data ?? res.data;
      const list = data.articles ?? data;
      setArticles(list);
      setTotalCount(data.total ?? list.length);
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't load articles. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(loadStats, 0);
    return () => clearTimeout(t);
  }, [loadStats]);

  useEffect(() => {
    const t = setTimeout(loadArticles, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadArticles, search]);

  const togglePublish = async (article: Article) => {
    const willPublish = article.status !== "PUBLISHED";
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, status: willPublish ? "PUBLISHED" : "DRAFT" } : a))
    );
    try {
      await api.post(`/articles/${article.id}/${willPublish ? "publish" : "unpublish"}`);
      showToast(`${willPublish ? "Published" : "Moved to drafts"}: ${article.title.slice(0, 40)}`);
      loadStats();
    } catch {
      showToast("Couldn't update the article. Refreshing the list.");
      loadArticles();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setArticles((prev) => prev.filter((a) => a.id !== target.id));
    setDeleteTarget(null);
    try {
      await api.delete(`/articles/${target.id}`);
      showToast(`Deleted: ${target.title.slice(0, 40)}`);
      loadStats();
    } catch {
      showToast("Couldn't delete the article. Refreshing the list.");
      loadArticles();
    }
  };

  const filtering = search !== "" || statusFilter !== "all";

  return (
    <>
      <Topbar
        title="Articles"
        subtitle={loading ? "Loading your content" : `${totalCount} ${totalCount === 1 ? "article" : "articles"}`}
        actions={
          <button
            onClick={() => navigate("/dashboard/articles/new")}
            className={`flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white font-condensed text-sm font-semibold tracking-wide px-4 py-2 rounded-lg transition-colors ${focusRing}`}
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            New article
          </button>
        }
      />

      <div className="p-6 flex flex-col gap-4 max-w-[1240px]">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={loadArticles} className="font-medium underline underline-offset-2 whitespace-nowrap">
              Try again
            </button>
          </div>
        )}

        {/* Status tabs + search */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div role="tablist" aria-label="Filter by status" className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {TABS.map((t) => {
              const active = statusFilter === t.key;
              const count = stats ? stats[t.stat] : null;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${focusRing} ${
                    active ? "bg-white text-gray-900 font-medium shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                  {count !== null && <span className={`text-xs tabular-nums ${active ? "text-gray-500" : "text-gray-400"}`}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-[300px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title"
              aria-label="Search articles"
              className={`w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 ${focusRing}`}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded ${focusRing}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs text-gray-500">
                <th className="font-medium px-5 py-3">Article</th>
                <th className="font-medium px-3 py-3 hidden md:table-cell">Category</th>
                <th className="font-medium px-3 py-3 hidden lg:table-cell">Author</th>
                <th className="font-medium px-3 py-3">Status</th>
                <th className="font-medium px-3 py-3 text-right hidden sm:table-cell">Views</th>
                <th className="font-medium px-5 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td colSpan={6} className="h-[62px] animate-pulse bg-gray-50/60" />
                  </tr>
                ))
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {filtering ? "No articles match these filters" : "No articles yet"}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {filtering ? "Try a different status or search term." : "Write your first article to see it here."}
                    </p>
                    {filtering ? (
                      <button
                        onClick={() => {
                          setSearch("");
                          setStatus("all");
                        }}
                        className={`text-sm font-medium text-[#007f8f] hover:underline rounded ${focusRing}`}
                      >
                        Clear filters
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/dashboard/articles/new")}
                        className={`bg-navy-900 text-white font-condensed text-sm font-semibold px-4 py-2 rounded-lg hover:bg-navy-800 ${focusRing}`}
                      >
                        Write an article
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                articles.map((a) => {
                  const date = new Date(a.publishedAt || a.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const isLive = a.status === "PUBLISHED";
                  return (
                    <tr key={a.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/70 transition-colors group">
                      <td className="px-5 py-3.5 max-w-[360px]">
                        <button
                          onClick={() => navigate(`/dashboard/articles/${a.id}`)}
                          className={`block text-left w-full rounded ${focusRing}`}
                        >
                          <span className="block text-[14px] font-medium text-gray-900 truncate group-hover:text-[#007f8f] transition-colors">
                            {a.title}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">{date}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3.5 hidden md:table-cell">
                        {a.category?.name ? (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 font-medium">{a.category.name}</span>
                        ) : (
                          <span className="text-xs text-gray-400">No category</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-sm text-gray-700 hidden lg:table-cell">
                        {a.author ? `${a.author.firstName} ${a.author.lastName}` : <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${statusChip[a.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[a.status]}`} aria-hidden />
                          {statusLabel[a.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-gray-600 text-right tabular-nums hidden sm:table-cell">
                        {isLive ? a.viewCount.toLocaleString() : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/dashboard/articles/${a.id}`)}
                            aria-label={`Edit ${a.title}`}
                            title="Edit"
                            className={`p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 ${focusRing}`}
                          >
                            <Pencil className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => togglePublish(a)}
                            aria-label={`${isLive ? "Unpublish" : "Publish"} ${a.title}`}
                            title={isLive ? "Unpublish" : "Publish"}
                            className={`p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 ${focusRing}`}
                          >
                            {isLive ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(a)}
                            aria-label={`Delete ${a.title}`}
                            title="Delete"
                            className={`p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 ${focusRing}`}
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && articles.length > 0 && (
          <p className="text-xs text-gray-500">
            Showing {articles.length} of {totalCount}
          </p>
        )}
      </div>

      {deleteTarget && <DeleteDialog title={deleteTarget.title} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

      <div aria-live="polite" role="status">
        {toast && (
          <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-lg shadow-lg z-[200] max-w-[90vw] truncate">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}