import { useState, useEffect } from "react";
import Topbar from "../../components/layouts/Topbar";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";

interface RecentArticle {
  id: string;
  title: string;
  categoryId: string | null;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  createdAt: string;
  publishedAt: string | null;
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  inReview: number;
}

const statusStyle: Record<string, string> = {
  PUBLISHED: "bg-green-50 text-green-700",
  DRAFT: "bg-gray-100 text-gray-500",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  SCHEDULED: "bg-violet-50 text-violet-700",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

const statusLabel: Record<string, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  SCHEDULED: "Scheduled",
  ARCHIVED: "Archived",
};

// Only routes that actually exist per the current sidebar — Categories,
// Authors, Theme, and standalone Videos were all dropped July 14.
const quickActions = [
  { label: "Write new article", icon: "📄", path: "/dashboard/articles/new" },
  { label: "View gallery", icon: "🖼️", path: "/dashboard/gallery" },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("sphere_user") || "{}");

  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.get("/articles/stats"),
          api.get("/articles", { params: { limit: 5, page: 1 } }),
        ]);
        setStats(statsRes.data.data ?? statsRes.data);
        const recentData = recentRes.data.data ?? recentRes.data;
        setRecent(recentData.articles ?? recentData);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = stats
    ? [
        { label: "Total Articles", value: stats.total, sub: "All statuses", color: "text-cyan" },
        { label: "Published", value: stats.published, sub: "Live on website", color: "text-green-500" },
        { label: "Drafts", value: stats.draft, sub: "In progress", color: "text-amber-500" },
        { label: "Scheduled", value: stats.scheduled, sub: "Upcoming", color: "text-violet-500" },
      ]
    : [];

  return (
    <>
      <Topbar
        title={`Good morning, ${user.firstName || "there"}`}
        subtitle="Here's what's happening with Sphere Tech today"
        actions={
          <button
            onClick={() => navigate("/dashboard/articles/new")}
            className="bg-navy-900 hover:bg-navy-800 text-white font-condensed text-xs font-bold tracking-[0.08em] uppercase px-4 py-2 rounded-lg transition-colors"
          >
            + New article
          </button>
        }
      />

      <div className="p-6 flex flex-col gap-5">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-[92px] animate-pulse" />
            ))
          ) : (
            statCards.map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-[11px] text-gray-400 uppercase tracking-[0.08em] mb-2 font-medium">
                  {s.label}
                </div>
                <div className="font-condensed text-[36px] font-bold text-gray-900 leading-none">
                  {s.value}
                </div>
                <div className={`text-[11px] mt-1 font-medium ${s.color}`}>
                  {s.sub}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-[1fr_280px] gap-4">

          {/* Recent articles */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="font-condensed text-sm font-bold text-gray-900 uppercase tracking-[0.06em]">
                Recent articles
              </div>
              <button
                onClick={() => navigate("/dashboard/articles")}
                className="text-[11px] text-cyan font-medium hover:underline"
              >
                See all →
              </button>
            </div>
            <div>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[46px] border-b border-gray-50 last:border-b-0 animate-pulse bg-gray-50/50" />
                ))
              ) : recent.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] text-gray-400">
                  No articles yet — create your first one.
                </div>
              ) : (
                recent.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/dashboard/articles/${a.id}`)}
                    className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 text-[13px] text-gray-800 font-medium leading-snug line-clamp-1">
                      {a.title}
                    </div>
                    {a.categoryId && (
                      <span className="text-[10px] px-2 py-[3px] rounded-full bg-gray-100 text-gray-500 font-medium whitespace-nowrap">
                        {a.categoryId}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-[3px] rounded-full font-medium whitespace-nowrap ${statusStyle[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {timeAgo(a.publishedAt || a.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Quick actions */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-condensed text-sm font-bold text-gray-900 uppercase tracking-[0.06em]">
                  Quick actions
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {quickActions.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => navigate(q.path)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors text-[12px] text-gray-700 text-left w-full"
                  >
                    <span className="text-sm">{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}