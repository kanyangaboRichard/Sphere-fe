/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────
type Status = "published" | "draft";

interface Article {
  id: number;
  title: string;
  category: string;
  author: string;
  status: Status;
  date: string;
  views: number;
}

// ── Mock data (replace with API calls) ────────────────────────────────────
const MOCK_ARTICLES: Article[] = [
  { id: 1, title: "Rwanda's Growing Tech Startup Ecosystem", category: "Startups", author: "Alice Uwase", status: "published", date: "2026-06-28", views: 1420 },
  { id: 2, title: "How AI Is Reshaping Agriculture in East Africa", category: "AI", author: "Brian Nkusi", status: "published", date: "2026-06-25", views: 987 },
  { id: 3, title: "Kigali Innovation City: What to Expect in 2027", category: "Infrastructure", author: "Alice Uwase", status: "draft", date: "2026-06-22", views: 0 },
  { id: 4, title: "The Rise of Mobile Payments Across the Continent", category: "Fintech", author: "Diane Ingabire", status: "published", date: "2026-06-18", views: 2301 },
  { id: 5, title: "Open Source Software Adoption in Rwandan Schools", category: "Education", author: "Brian Nkusi", status: "draft", date: "2026-06-15", views: 0 },
  { id: 6, title: "Interview: Building Africa's First Satellite Ground Station", category: "Space", author: "Diane Ingabire", status: "published", date: "2026-06-10", views: 3140 },
  { id: 7, title: "Cybersecurity Threats Facing SMEs in 2026", category: "Security", author: "Alice Uwase", status: "published", date: "2026-06-05", views: 810 },
  { id: 8, title: "5G Rollout Timeline: Rwanda vs. the Region", category: "Telecom", author: "Brian Nkusi", status: "draft", date: "2026-05-30", views: 0 },
];

const CATEGORIES = ["All", "AI", "Startups", "Fintech", "Infrastructure", "Education", "Security", "Telecom", "Space"];

// ── Delete confirm modal ───────────────────────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,20,32,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "32px 28px", width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff1f1", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 2h4M2 4h12M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111418", marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>Delete article?</div>
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
          "<span style={{ color: "#111418" }}>{title}</span>" will be permanently removed and cannot be recovered.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e2e4e8", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow', sans-serif" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Barlow', sans-serif" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ArticlesPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const filtered = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.author.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || a.category === categoryFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const toggleStatus = (id: number) => {
    const art = articles.find(a => a.id === id);
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: a.status === "published" ? "draft" : "published" } : a));
    if (art) showToast(`"${art.title.slice(0, 36)}…" ${art.status === "published" ? "moved to draft" : "published"}`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setArticles(prev => prev.filter(a => a.id !== deleteTarget.id));
    showToast(`"${deleteTarget.title.slice(0, 36)}…" deleted`);
    setDeleteTarget(null);
  };

  const totalPublished = articles.filter(a => a.status === "published").length;
  const totalDraft = articles.filter(a => a.status === "draft").length;
  const totalViews = articles.reduce((s, a) => s + a.views, 0);

  return (
    <>
      <style>{`
        .ap-topbar {
          background: #fff; border-bottom: 1px solid #e8eaed;
          padding: 0 32px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 5;
        }
        .ap-topbar-title { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; color: #111418; letter-spacing: 0.02em; }
        .ap-topbar-breadcrumb { font-size: 12px; color: #8a95a3; margin-top: 1px; }
        .ap-content { padding: 28px 32px; flex: 1; background: #f4f5f7; min-height: calc(100vh - 60px); }

        .ap-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .ap-stat-card { background: #fff; border: 1px solid #e8eaed; border-radius: 10px; padding: 18px 20px; }
        .ap-stat-label { font-size: 10px; font-weight: 700; color: #8a95a3; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .ap-stat-value { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 700; color: #111418; line-height: 1; }
        .ap-stat-sub { font-size: 11px; color: #8a95a3; margin-top: 4px; }

        .ap-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .ap-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
        .ap-search-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #8a95a3; pointer-events: none; }
        .ap-search-input { width: 100%; padding: 9px 12px 9px 34px; border: 1px solid #e2e4e8; border-radius: 8px; font-size: 13px; color: #111418; background: #fff; outline: none; font-family: 'Barlow', sans-serif; transition: border-color 0.15s; }
        .ap-search-input:focus { border-color: #00C8E0; }
        .ap-search-input::placeholder { color: #b0b7c3; }
        .ap-filter-select { padding: 9px 12px; border: 1px solid #e2e4e8; border-radius: 8px; font-size: 13px; color: #374151; background: #fff; outline: none; font-family: 'Barlow', sans-serif; cursor: pointer; }
        .ap-filter-select:focus { border-color: #00C8E0; }
        .ap-new-btn { margin-left: auto; display: flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 8px; border: none; background: #00C8E0; color: #fff; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .ap-new-btn:hover { background: #00afc6; }

        .ap-cat-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
        .ap-cat-pill { padding: 5px 13px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid #e2e4e8; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.12s; font-family: 'Barlow', sans-serif; }
        .ap-cat-pill:hover { border-color: #00C8E0; color: #00C8E0; }
        .ap-cat-pill.active { background: #00C8E0; border-color: #00C8E0; color: #fff; }

        .ap-table-wrap { background: #fff; border: 1px solid #e8eaed; border-radius: 10px; overflow: hidden; }
        .ap-table-head { display: grid; grid-template-columns: 2fr 1fr 1fr 110px 80px 90px; padding: 11px 20px; background: #f8f9fb; border-bottom: 1px solid #e8eaed; }
        .ap-th { font-size: 10px; font-weight: 700; color: #8a95a3; text-transform: uppercase; letter-spacing: 0.1em; }
        .ap-table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 110px 80px 90px; padding: 14px 20px; border-bottom: 1px solid #f0f2f5; align-items: center; transition: background 0.1s; }
        .ap-table-row:last-child { border-bottom: none; }
        .ap-table-row:hover { background: #fafbfc; }
        .ap-article-title { font-size: 13px; font-weight: 600; color: #111418; line-height: 1.4; margin-bottom: 2px; }
        .ap-article-date { font-size: 11px; color: #8a95a3; }
        .ap-td { font-size: 12px; color: #374151; }
        .ap-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .ap-badge-published { background: #ecfdf5; color: #059669; }
        .ap-badge-draft { background: #f8f9fb; color: #8a95a3; border: 1px solid #e2e4e8; }
        .ap-views { font-size: 12px; color: #6b7280; font-variant-numeric: tabular-nums; }
        .ap-actions { display: flex; align-items: center; gap: 4px; }
        .ap-action-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e4e8; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: all 0.12s; }
        .ap-action-btn:hover { border-color: #00C8E0; color: #00C8E0; background: rgba(0,200,224,0.05); }
        .ap-action-btn.del:hover { border-color: #dc2626; color: #dc2626; background: #fff1f1; }

        .ap-empty { padding: 56px 20px; text-align: center; }
        .ap-empty-title { font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .ap-empty-sub { font-size: 13px; color: #8a95a3; }

        .ap-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #111418; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 200; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
      `}</style>

      {/* Topbar */}
      <div className="ap-topbar">
        <div>
          <div className="ap-topbar-title">Articles</div>
          <div className="ap-topbar-breadcrumb">CMS Admin · Content</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C8E0" }} />
          <span style={{ fontSize: 11, color: "#8a95a3" }}>Sphere Tech Group Ltd</span>
        </div>
      </div>

      {/* Content */}
      <div className="ap-content">

        {/* Stat cards */}
        <div className="ap-stats-row">
          <div className="ap-stat-card">
            <div className="ap-stat-label">Total articles</div>
            <div className="ap-stat-value">{articles.length}</div>
            <div className="ap-stat-sub">{totalPublished} published · {totalDraft} drafts</div>
          </div>
          <div className="ap-stat-card">
            <div className="ap-stat-label">Total views</div>
            <div className="ap-stat-value">{totalViews.toLocaleString()}</div>
            <div className="ap-stat-sub">Across all published articles</div>
          </div>
          <div className="ap-stat-card">
            <div className="ap-stat-label">Categories</div>
            <div className="ap-stat-value">{CATEGORIES.length - 1}</div>
            <div className="ap-stat-sub">Active content tags</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ap-toolbar">
          <div className="ap-search-wrap">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <input className="ap-search-input" placeholder="Search articles or authors…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="ap-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button className="ap-new-btn" onClick={() => navigate("/dashboard/articles/new")}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            New article
          </button>
        </div>

        {/* Category pills */}
        <div className="ap-cat-pills">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`ap-cat-pill${categoryFilter === cat ? " active" : ""}`} onClick={() => setCategoryFilter(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="ap-table-wrap">
          <div className="ap-table-head">
            <div className="ap-th">Article</div>
            <div className="ap-th">Category</div>
            <div className="ap-th">Author</div>
            <div className="ap-th">Status</div>
            <div className="ap-th">Views</div>
            <div className="ap-th">Actions</div>
          </div>

          {filtered.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-title">No articles found</div>
              <div className="ap-empty-sub">Try adjusting your search or filters</div>
            </div>
          ) : (
            filtered.map(article => (
              <div className="ap-table-row" key={article.id}>
                <div>
                  <div className="ap-article-title">{article.title}</div>
                  <div className="ap-article-date">
                    {new Date(article.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="ap-td">
                  <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#f0fafb", color: "#0891b2", border: "1px solid #b2e8f0" }}>
                    {article.category}
                  </span>
                </div>
                <div className="ap-td">{article.author}</div>
                <div>
                  <button onClick={() => toggleStatus(article.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} title="Click to toggle status">
                    <span className={`ap-badge ap-badge-${article.status}`}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: article.status === "published" ? "#059669" : "#9ca3af", flexShrink: 0 }} />
                      {article.status === "published" ? "Published" : "Draft"}
                    </span>
                  </button>
                </div>
                <div className="ap-views">{article.status === "published" ? article.views.toLocaleString() : "—"}</div>
                <div className="ap-actions">
                  <button className="ap-action-btn" title="Edit" onClick={() => navigate(`/dashboard/articles/${article.id}`)}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
                  </button>
                  <button className="ap-action-btn del" title="Delete" onClick={() => setDeleteTarget(article)}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#8a95a3" }}>
            Showing {filtered.length} of {articles.length} articles
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal title={deleteTarget.title} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* Toast */}
      {toast && <div className="ap-toast">{toast}</div>}
    </>
  );
}