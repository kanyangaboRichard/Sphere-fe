import { useState, useEffect, useCallback } from "react";
import {fetchMedia,deleteMedia,deleteMediaBulk,} from "../../lib/media";
import type {MediaAsset,SortOption,TypeFilter} from "../../lib/media";

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TABS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
];

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  largest: "Largest",
  smallest: "Smallest",
};

export default function GalleryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMedia({ search, type: typeFilter, sort });
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media.");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, sort]);

  useEffect(() => {
    const timeout = setTimeout(loadAssets, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [loadAssets, search]);

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    setAssets(prev => prev.filter(a => !selected.has(a.id)));
    setSelected(new Set());
    try {
      await deleteMediaBulk(ids);
      showToast(`Deleted ${ids.length} item${ids.length !== 1 ? "s" : ""}`);
    } catch {
      showToast("Some deletes failed — refreshing list");
      loadAssets();
    }
  }

  async function handleDeleteAsset(id: string) {
    setAssets(prev => prev.filter(a => a.id !== id));
    setActiveAsset(null);
    try {
      await deleteMedia(id);
      showToast("Asset deleted");
    } catch {
      showToast("Delete failed — refreshing list");
      loadAssets();
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    showToast("URL copied");
  }

  return (
    <>
      <style>{`
        .gp-root { min-height: 100vh; background: #fff; padding: 32px 40px; box-sizing: border-box; }

        .gp-topline { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 6px; }
        .gp-count { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 0.02em; color: #111418; margin: 0; text-transform: uppercase; }
        .gp-count-hint { font-size: 11px; color: #9ca3af; font-weight: 400; text-transform: none; letter-spacing: normal; margin-left: 10px; }
        .gp-search-wrap { position: relative; }
        .gp-search-icon { position: absolute; left: 0; top: 50%; transform: translateY(-50%); font-size: 12px; color: #9ca3af; pointer-events: none; }
        .gp-search { border: none; border-bottom: 1px solid #e2e4e8; background: transparent; padding: 4px 4px 4px 18px; font-size: 12px; color: #111418; outline: none; font-family: 'Barlow', sans-serif; width: 220px; transition: border-color 0.15s; }
        .gp-search:focus { border-color: #00C8E0; }
        .gp-search::placeholder { color: #b0b7c0; }

        .gp-subline { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding-bottom: 18px; margin-bottom: 22px; border-bottom: 1px solid #eceef1; }
        .gp-tabs { display: flex; align-items: center; gap: 18px; }
        .gp-tab { background: none; border: none; padding: 4px 0; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b0b7c0; cursor: pointer; position: relative; transition: color 0.15s; }
        .gp-tab:hover { color: #374151; }
        .gp-tab.active { color: #111418; }
        .gp-tab.active::after { content: ""; position: absolute; left: 0; right: 0; bottom: -19px; height: 2px; background: #00C8E0; }
        .gp-right-controls { display: flex; align-items: center; gap: 16px; }
        .gp-sort-wrap { position: relative; }
        .gp-sort-btn { background: none; border: none; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 0; }
        .gp-sort-btn:hover { color: #111418; }
        .gp-sort-menu { position: absolute; right: 0; top: 100%; margin-top: 6px; background: #fff; border: 1px solid #e8eaed; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); overflow: hidden; z-index: 5; min-width: 120px; }
        .gp-sort-option { display: block; width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 12px; color: #374151; cursor: pointer; }
        .gp-sort-option:hover { background: #f4f5f7; }
        .gp-sort-option.active { color: #00C8E0; font-weight: 600; }

        .gp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 26px 22px; }
        .gp-tile { position: relative; }
        .gp-tile-checkbox { position: absolute; top: 8px; left: 8px; z-index: 2; width: 15px; height: 15px; accent-color: #00C8E0; opacity: 0; transition: opacity 0.15s; }
        .gp-tile:hover .gp-tile-checkbox, .gp-tile-checkbox:checked { opacity: 1; }
        .gp-tile-thumb { position: relative; aspect-ratio: 4 / 3; background: #111418; cursor: pointer; overflow: hidden; border-radius: 4px; }
        .gp-tile-thumb img, .gp-tile-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
        .gp-tile:hover .gp-tile-thumb img, .gp-tile:hover .gp-tile-thumb video { transform: scale(1.04); }
        .gp-type-badge { position: absolute; bottom: 8px; right: 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 6px; border-radius: 3px; background: rgba(17,20,24,0.65); color: #fff; }
        .gp-tile-caption { padding-top: 10px; }
        .gp-tile-filename { font-family: 'Barlow Condensed', sans-serif; font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: #111418; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gp-tile-submeta { font-size: 10.5px; color: #9ca3af; letter-spacing: 0.02em; }

        .gp-skeleton { aspect-ratio: 4 / 3; border-radius: 4px; background: linear-gradient(90deg, #f0f2f4 0%, #f8f9fb 50%, #f0f2f4 100%); background-size: 200% 100%; animation: gp-shimmer 1.4s ease-in-out infinite; }
        @keyframes gp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .gp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 72px 0; border: 1.5px dashed #d1d5db; border-radius: 6px; background: #fafbfc; text-align: center; }
        .gp-empty-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
        .gp-empty-hint { font-size: 11px; color: #9ca3af; margin: 0; max-width: 320px; line-height: 1.5; }
        .gp-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 12px; padding: 8px 12px; border-radius: 7px; margin-bottom: 14px; }
        .gp-detail-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; padding: 8px 0; border-bottom: 1px solid #f0f2f4; }
        .gp-detail-row:last-child { border-bottom: none; }
        .gp-detail-label { color: #9ca3af; flex-shrink: 0; }
        .gp-detail-value { color: #111418; text-align: right; }

        .btn-ghost { background: transparent; color: #374151; border: 1px solid #e2e4e8; border-radius: 7px; padding: 8px 14px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-ghost:hover { border-color: #00C8E0; color: #00C8E0; }
        .btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 7px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-danger:hover { background: #fee2e2; }
        .na-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #111418; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 999; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .na-preview-overlay { position: fixed; inset: 0; background: rgba(17,20,24,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 32px; }
        .na-preview-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
        .na-preview-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #f0f2f4; position: sticky; top: 0; background: #fff; z-index: 1; }
        .na-preview-modal-title { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; }
        .na-preview-close-btn { background: #f0f2f4; border: none; border-radius: 6px; width: 28px; height: 28px; font-size: 16px; cursor: pointer; color: #6b7280; }
        .na-preview-close-btn:hover { background: #e2e4e8; color: #111418; }
      `}</style>

      <div className="gp-root">
        <div className="gp-topline">
          <p className="gp-count">
            {loading ? "Loading…" : `${assets.length} Asset${assets.length !== 1 ? "s" : ""}`}
            <span className="gp-count-hint">from articles</span>
          </p>
          <div className="gp-search-wrap">
            <span className="gp-search-icon">⌕</span>
            <input
              type="text"
              className="gp-search"
              placeholder="Search assets"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="gp-error">{error}</div>}

        <div className="gp-subline">
          <div className="gp-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`gp-tab ${typeFilter === tab.key ? "active" : ""}`}
                onClick={() => setTypeFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="gp-right-controls">
            {selected.size > 0 && (
              <button className="btn-danger" onClick={handleBulkDelete}>Delete {selected.size} selected</button>
            )}
            <div className="gp-sort-wrap">
              <button className="gp-sort-btn" onClick={() => setSortMenuOpen(o => !o)}>
                {SORT_LABELS[sort]} ⌄
              </button>
              {sortMenuOpen && (
                <div className="gp-sort-menu" onMouseLeave={() => setSortMenuOpen(false)}>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map(key => (
                    <button
                      key={key}
                      className={`gp-sort-option ${sort === key ? "active" : ""}`}
                      onClick={() => { setSort(key); setSortMenuOpen(false); }}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="gp-grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="gp-skeleton" />)}
          </div>
        ) : assets.length === 0 ? (
          <div className="gp-empty">
            <p className="gp-empty-title">No media yet.</p>
            <p className="gp-empty-hint">
              Images and videos show up here automatically once they're attached as a cover
              photo or gallery item on an article — there's no separate upload on this page.
            </p>
          </div>
        ) : (
          <div className="gp-grid">
            {assets.map(asset => (
              <div key={asset.id} className="gp-tile">
                <input
                  type="checkbox"
                  className="gp-tile-checkbox"
                  checked={selected.has(asset.id)}
                  onChange={() => toggleSelected(asset.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="gp-tile-thumb" onClick={() => setActiveAsset(asset)}>
                  {asset.type === "video" ? (
                    <video src={asset.url} muted />
                  ) : (
                    <img src={asset.url} alt={asset.filename} loading="lazy" />
                  )}
                  <span className="gp-type-badge">{asset.type}</span>
                </div>
                <div className="gp-tile-caption">
                  <p className="gp-tile-filename" title={asset.filename}>{asset.filename}</p>
                  <div className="gp-tile-submeta">
                    {formatSize(asset.sizeKb)} · {asset.articles.length === 0 ? "Unused" : `Used in ${asset.articles.length}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset detail modal */}
      {activeAsset && (
        <div className="na-preview-overlay" onClick={() => setActiveAsset(null)}>
          <div className="na-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="na-preview-modal-header">
              <span className="na-preview-modal-title">{activeAsset.filename}</span>
              <button className="na-preview-close-btn" onClick={() => setActiveAsset(null)}>×</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ borderRadius: 8, overflow: "hidden", background: "#111418", marginBottom: 14 }}>
                {activeAsset.type === "video" ? (
                  <video src={activeAsset.url} controls style={{ width: "100%", display: "block" }} />
                ) : (
                  <img src={activeAsset.url} alt={activeAsset.filename} style={{ width: "100%", display: "block" }} />
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="gp-detail-row"><span className="gp-detail-label">Type</span><span className="gp-detail-value">{activeAsset.type}</span></div>
                <div className="gp-detail-row"><span className="gp-detail-label">Size</span><span className="gp-detail-value">{formatSize(activeAsset.sizeKb)}</span></div>
                <div className="gp-detail-row">
                  <span className="gp-detail-label">Uploaded</span>
                  <span className="gp-detail-value">
                    {formatDate(activeAsset.createdAt)}{activeAsset.uploadedBy ? ` by ${activeAsset.uploadedBy.name}` : ""}
                  </span>
                </div>
                <div className="gp-detail-row">
                  <span className="gp-detail-label">Used in</span>
                  <span className="gp-detail-value">
                    {activeAsset.articles.length === 0 ? "No articles" : activeAsset.articles.map(a => a.title).join(", ")}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn-ghost" onClick={() => copyUrl(activeAsset.url)}>Copy URL</button>
                <button className="btn-danger" onClick={() => handleDeleteAsset(activeAsset.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="na-toast">{toast}</div>}
    </>
  );
}