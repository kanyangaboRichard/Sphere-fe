import Topbar from "../../components/layouts/Topbar";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Total Articles", value: "24", sub: "+3 this week", color: "text-cyan" },
  { label: "Published", value: "18", sub: "Live on website", color: "text-green-500" },
  { label: "Drafts", value: "5", sub: "In progress", color: "text-amber-500" },
  { label: "Scheduled", value: "3", sub: "Upcoming", color: "text-violet-500" },
];

const recent = [
  { title: "BK Tech's mobile lending platform", category: "Fintech", status: "PUBLISHED", time: "3 hrs ago" },
  { title: "Rwandan hospitals using AI diagnostics", category: "AI", status: "PUBLISHED", time: "4 hrs ago" },
  { title: "Kaspersky opens Kigali threat intel hub", category: "Cybersecurity", status: "IN_REVIEW", time: "Yesterday" },
  { title: "Samsung Galaxy S25 FE review", category: "Review", status: "PUBLISHED", time: "6 hrs ago" },
  { title: "Tablet programme turning rural schools digital", category: "Education", status: "DRAFT", time: "2 days ago" },
];

const statusStyle: Record<string, string> = {
  PUBLISHED: "bg-green-50 text-green-700",
  DRAFT: "bg-gray-100 text-gray-500",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  SCHEDULED: "bg-violet-50 text-violet-700",
};

const statusLabel: Record<string, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  SCHEDULED: "Scheduled",
};

const quickActions = [
  { label: "Write new article", icon: "📄", path: "/dashboard/articles/new" },
  { label: "Add category", icon: "🏷️", path: "/dashboard/categories" },
  { label: "Add author", icon: "✍️", path: "/dashboard/authors" },
  { label: "Upload video", icon: "🎬", path: "/dashboard/videos" },
  { label: "Edit theme", icon: "🎨", path: "/dashboard/theme" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("sphere_user") || "{}");

  return (
    <>
      <Topbar
        title={`Good morning, ${user.firstName} 👋`}
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
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
          ))}
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
              {recent.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex-1 text-[13px] text-gray-800 font-medium leading-snug line-clamp-1">
                    {a.title}
                  </div>
                  <span className="text-[10px] px-2 py-[3px] rounded-full bg-gray-100 text-gray-500 font-medium whitespace-nowrap">
                    {a.category}
                  </span>
                  <span className={`text-[10px] px-2 py-[3px] rounded-full font-medium whitespace-nowrap ${statusStyle[a.status]}`}>
                    {statusLabel[a.status]}
                  </span>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">{a.time}</span>
                </div>
              ))}
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

            {/* System status */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-condensed text-sm font-bold text-gray-900 uppercase tracking-[0.06em]">
                  System
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {[
                  { label: "API", status: "Online" },
                  { label: "Database", status: "Connected" },
                  { label: "Cloudinary", status: "Ready" },
                ].map((sys) => (
                  <div key={sys.label} className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500">{sys.label}</span>
                    <span className="flex items-center gap-1.5 text-green-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {sys.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}