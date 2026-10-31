/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { uploadMedia } from "../lib/media";
import RichTextEditor from "./RichTextEditor";

const THEME_PRESETS = [
  { key: "TECH_DARK", label: "Tech dark", bg: "#0d1a2a", accent: "#00C8E0", accentText: "#0d1a2a" },
  { key: "EDITORIAL", label: "Editorial", bg: "#1a1a1a", accent: "#e8d44d", accentText: "#1a1a1a" },
  { key: "BREAKING", label: "Breaking", bg: "#8b0000", accent: "#ff4444", accentText: "#fff" },
  { key: "CYBER", label: "Cyber", bg: "#0a0f1a", accent: "#39ff14", accentText: "#0a0f1a" },
];

const LAYOUTS = [
  { key: "HERO_BOTTOM", label: "Hero — title over image" },
  { key: "SPLIT", label: "Split — image left, title right" },
  { key: "MINIMAL", label: "Minimal — no hero image" },
];

const FONTS = [
  { key: "BARLOW_CONDENSED", label: "Barlow Condensed", css: "'Barlow Condensed', sans-serif" },
  { key: "OSWALD", label: "Oswald", css: "'Oswald', sans-serif" },
  { key: "PLAYFAIR_DISPLAY", label: "Playfair Display", css: "'Playfair Display', serif" },
];

const TYPES = [
  { key: "ARTICLE", label: "Article" },
  { key: "VIDEO", label: "Video" },
  { key: "NEWS", label: "News" },
];

const STATUSES = [
  { key: "DRAFT", label: "Draft" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "PUBLISHED", label: "Published" },
  { key: "SCHEDULED", label: "Scheduled" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

function Card({ title, sub, meta, children }: { title: string; sub?: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="na-card">
      <header className="na-card-header">
        <div>
          <h2 className="na-card-title">{title}</h2>
          {sub && <p className="na-card-sub">{sub}</p>}
        </div>
        {meta && <span className="na-card-meta">{meta}</span>}
      </header>
      {children}
    </section>
  );
}

function CheckCard({ checked, onChange, title, hint }: { checked: boolean; onChange: () => void; title: string; hint: string }) {
  return (
    <label className="na-checkcard">
      <div>
        <div className="na-checkcard-title">{title}</div>
        <div className="na-checkcard-hint">{hint}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <div className="na-toggle-row">
      <span className="na-toggle-label">{label}</span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className={`na-ttrack ${on ? "on" : ""}`} onClick={onChange}>
        <span className="na-tknob" />
      </button>
    </div>
  );
}

const DEFAULT_FORM = {
  title: "",
  slug: "",
  type: "ARTICLE",
  overview: "",
  body: "",
  pullQuote: "",
  categoryId: "",
  authorId: "",
  status: "DRAFT",
  readTime: 5,
  isFeatured: false,
  isBreaking: false,
  tags: [] as string[],
  themePreset: "TECH_DARK",
  themeHeroBg: "#0d1a2a",
  themeAccentColor: "#00C8E0",
  themeTitleFont: "BARLOW_CONDENSED",
  layout: "HERO_BOTTOM",
  themeDarkBody: false,
  themeShowPullQuote: true,
  themeGridOverlay: true,
};

/** Maps an article returned by the API onto the editor's form shape. */
function articleToForm(a: any) {
  const d = DEFAULT_FORM;
  return {
    ...d,
    title: a.title ?? "",
    slug: a.slug ?? "",
    type: a.type ?? d.type,
    overview: a.excerpt ?? a.overview ?? "",
    body: a.body ?? "",
    pullQuote: a.pullQuote ?? "",
    categoryId: a.categoryId ?? a.category?.id ?? "",
    authorId: a.authorId ?? a.author?.id ?? "",
    status: a.status ?? d.status,
    readTime: a.readTime ?? d.readTime,
    isFeatured: !!a.isFeatured,
    isBreaking: !!a.isBreaking,
    tags: Array.isArray(a.tags) ? a.tags : [],
    themePreset: a.themePreset ?? d.themePreset,
    themeHeroBg: a.themeHeroBg ?? d.themeHeroBg,
    themeAccentColor: a.themeAccentColor ?? d.themeAccentColor,
    themeTitleFont: a.themeTitleFont ?? d.themeTitleFont,
    layout: a.layout ?? d.layout,
    themeDarkBody: a.themeDarkBody ?? d.themeDarkBody,
    themeShowPullQuote: a.themeShowPullQuote ?? d.themeShowPullQuote,
    themeGridOverlay: a.themeGridOverlay ?? d.themeGridOverlay,
  };
}

type Props = {
  mode: "create" | "edit";
  /** The article as returned by the API (edit mode). Must be loaded before the editor mounts. */
  initial?: any;
  /** Called with the API payload; throw to show an error toast. */
  onSubmit: (payload: any) => Promise<void>;
  /** Edit mode only. */
  onDelete?: () => Promise<void>;
};

export default function ArticleEditor({ mode, initial, onSubmit, onDelete }: Props) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [existingCover, setExistingCover] = useState<{ id: string; url: string } | null>(
    initial?.coverMedia?.url ? { id: initial.coverMedia.id ?? initial.coverMediaId, url: initial.coverMedia.url } : null
  );
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [toast, setToast] = useState("");
  // In edit mode keep the published URL stable: never regenerate the slug from the title
  const [slugEdited, setSlugEdited] = useState(!!initial);
  const [tab, setTab] = useState<"main" | "appearance">("main");
  const [saveMenu, setSaveMenu] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  // ---- Category combobox state ----
  const [categoryQuery, setCategoryQuery] = useState<string>(initial?.category?.name ?? "");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categoryBoxRef = useRef<HTMLDivElement>(null);

  // ---- Media state ----
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [featuredDragActive, setFeaturedDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const featuredInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(() => (initial ? articleToForm(initial) : DEFAULT_FORM));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, authRes] = await Promise.all([api.get("/categories"), api.get("/authors")]);
        const cats = catRes.data.data || [];
        setCategories(cats);
        setAuthors(authRes.data.data?.authors || []);
        if (initial) {
          const cid = initial.categoryId ?? initial.category?.id;
          const name = cats.find((c: any) => c.id === cid)?.name;
          if (name) setCategoryQuery(name);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (featuredImagePreview) URL.revokeObjectURL(featuredImagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (categoryBoxRef.current && !categoryBoxRef.current.contains(t)) setCategoryOpen(false);
      if (saveMenuRef.current && !saveMenuRef.current.contains(t)) setSaveMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape closes preview / menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreview(false);
        setSaveMenu(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleTitleChange = (value: string) => {
    setForm(prev => ({ ...prev, title: value, slug: slugEdited ? prev.slug : slugify(value) }));
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setField("slug", slugify(value));
  };

  const applyPreset = (p: (typeof THEME_PRESETS)[0]) => {
    setForm(prev => ({ ...prev, themePreset: p.key, themeHeroBg: p.bg, themeAccentColor: p.accent }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setField("tags", [...form.tags, t]);
    setTagInput("");
  };
  const removeTag = (tag: string) => setField("tags", form.tags.filter((t: string) => t !== tag));

  // ---- Category combobox handlers ----
  const selectCategory = (cat: any) => {
    setField("categoryId", cat.id);
    setCategoryQuery(cat.name);
    setCategoryOpen(false);
  };

  const createCategory = async (name: string) => {
    setCreatingCategory(true);
    try {
      const res = await api.post("/categories", { name });
      const newCategory = res.data.data;
      setCategories(prev => [...prev, newCategory]);
      setField("categoryId", newCategory.id);
      setCategoryQuery(newCategory.name);
      setCategoryOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  // ---- Featured image handlers ----
  const handleFeaturedFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Cover photo must be an image file");
      return;
    }
    if (featuredImagePreview) URL.revokeObjectURL(featuredImagePreview);
    setFeaturedImage(file);
    setFeaturedImagePreview(URL.createObjectURL(file));
  };

  const removeFeaturedImage = () => {
    if (featuredImagePreview) URL.revokeObjectURL(featuredImagePreview);
    setFeaturedImage(null);
    setFeaturedImagePreview(null);
    setExistingCover(null);
    if (featuredInputRef.current) featuredInputRef.current.value = "";
  };

  const handleSave = async (status = form.status) => {
    setSaveMenu(false);
    if (!form.title.trim()) return showToast("Title is required");
    if (!form.categoryId) return showToast("Select or create a category from the list");
    if (!form.overview.trim()) return showToast("Overview is required");

    setSaving(true);
    try {
      let coverMediaId: string | null = existingCover?.id ?? null;
      if (featuredImage) coverMediaId = (await uploadMedia(featuredImage)).id;

      const { overview, authorId, ...rest } = form;
      const payload = {
        ...rest,
        status,
        excerpt: overview.trim(),
        authorId: authorId || null,
        coverMediaId,
      };

      await onSubmit(payload);

      showToast(isEdit ? "Changes saved!" : "Article saved!");
      setTimeout(() => navigate("/dashboard/articles"), 1000);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm("Delete this article permanently? This can't be undone.")) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete article");
      setDeleting(false);
    }
  };

  const coverSrc = featuredImagePreview ?? existingCover?.url ?? null;

  const preset = THEME_PRESETS.find(p => p.key === form.themePreset) || THEME_PRESETS[0];
  const titleFont = FONTS.find(f => f.key === form.themeTitleFont)?.css || FONTS[0].css;
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()));
  const exactCategoryMatch = categories.some(c => c.name.toLowerCase() === categoryQuery.trim().toLowerCase());
  const categoryName = categories.find(c => c.id === form.categoryId)?.name;

  const wordCount = useMemo(() => {
    const text = form.body.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    return text ? text.split(/\s+/).length : 0;
  }, [form.body]);

  const statusLabel = STATUSES.find(s => s.key === form.status)?.label || form.status;

  return (
    <>
      <style>{`
        .na-root { min-height: 100vh; background: var(--c-bg, #f4f5f7); color: var(--c-text, #111418); font-family: 'Barlow', system-ui, sans-serif; }
        .na-root *, .na-root *::before, .na-root *::after { box-sizing: border-box; }
        .na-wrap { max-width: 1040px; margin: 0 auto; padding: 36px 28px 96px; }

        /* Heading */
        .na-eyebrow { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--c-faint, #9ca3af); margin-bottom: 8px; }
        .na-eyebrow button { background: none; border: none; color: var(--c-muted, #6b7280); cursor: pointer; padding: 0; font: inherit; }
        .na-eyebrow button:hover { color: var(--c-text, #111418); text-decoration: underline; }
        .na-pill { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; background: var(--c-hover-strong, #e8eaed); color: var(--c-muted, #6b7280); }
        .na-h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 32px; line-height: 1.2; font-weight: 700; margin: 0; color: var(--c-text, #111418); word-break: break-word; }
        .na-h1.empty { color: var(--c-faint, #9ca3af); }

        /* Tabs + actions */
        .na-bar { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-top: 22px; border-bottom: 1px solid var(--c-border-strong, #e2e4e8); flex-wrap: wrap; }
        .na-tabs { display: flex; gap: 22px; }
        .na-tab { background: none; border: none; padding: 8px 0 12px; font-size: 13px; font-weight: 600; color: var(--c-muted, #6b7280); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .na-tab:hover { color: var(--c-text, #111418); }
        .na-tab.active { color: var(--c-text, #111418); border-bottom-color: var(--c-text, #111418); }
        .na-actions { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; }

        /* Buttons */
        .na-btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--c-border-strong, #e2e4e8); background: var(--c-surface, #ffffff); color: var(--c-text-2, #374151); font-family: inherit; transition: all .15s; white-space: nowrap; }
        .na-btn:hover:not(:disabled) { background: var(--c-hover, #f3f4f6); color: var(--c-text, #111418); }
        .na-btn:disabled { opacity: .5; cursor: not-allowed; }
        .na-btn.warm { background: var(--c-warn-bg, #fef3c7); color: var(--c-warn, #b45309); border-color: transparent; }
        .na-btn.warm:hover:not(:disabled) { filter: brightness(.97); background: var(--c-warn-bg, #fef3c7); color: var(--c-warn, #b45309); }
        .na-btn.danger { background: var(--c-danger-bg, #fff1f1); color: var(--c-danger, #dc2626); border-color: var(--c-danger-border, #fecaca); }
        .na-btn.danger:hover:not(:disabled) { filter: brightness(.96); background: var(--c-danger-bg, #fff1f1); color: var(--c-danger, #dc2626); }
        .na-btn.dark { background: var(--c-primary, #15202e); color: var(--c-primary-text, #ffffff); border-color: var(--c-primary, #15202e); }
        .na-btn.dark:hover:not(:disabled) { background: var(--c-primary-hover, #1e3448); color: var(--c-primary-text, #ffffff); }
        .na-split { position: relative; display: inline-flex; }
        .na-split .na-btn.main { border-radius: 9px 0 0 9px; min-width: 110px; justify-content: center; }
        .na-split .na-btn.chev { border-radius: 0 9px 9px 0; padding: 0 10px; border-left: 1px solid rgba(255,255,255,.25); }
        .na-menu { position: absolute; right: 0; top: calc(100% + 6px); min-width: 190px; background: var(--c-surface, #ffffff); border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 12px; padding: 5px; box-shadow: 0 14px 34px rgba(0,0,0,.28); z-index: 40; }
        .na-menu button { display: block; width: 100%; text-align: left; background: none; border: none; padding: 9px 11px; border-radius: 8px; font-size: 13px; color: var(--c-text, #111418); cursor: pointer; font-family: inherit; }
        .na-menu button:hover { background: var(--c-hover, #f3f4f6); }
        .na-menu small { display: block; font-size: 11px; color: var(--c-faint, #9ca3af); margin-top: 1px; }
        .na-root button:focus-visible, .na-root input:focus-visible, .na-root select:focus-visible, .na-root textarea:focus-visible { outline: 2px solid #00C8E0; outline-offset: 1px; }

        /* Grid */
        .na-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; margin-top: 24px; align-items: start; }
        .na-col { display: flex; flex-direction: column; gap: 22px; min-width: 0; }

        /* Cards */
        .na-card { background: var(--c-surface, #ffffff); border: 1px solid var(--c-border, #e8eaed); border-radius: 12px; overflow: hidden; }
        .na-card-header { padding: 16px 18px 14px; border-bottom: 1px solid var(--c-border, #e8eaed); display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .na-card-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--c-text, #111418); }
        .na-card-sub { margin: 4px 0 0; font-size: 11.5px; color: var(--c-faint, #9ca3af); }
        .na-card-meta { font-size: 11.5px; color: var(--c-faint, #9ca3af); }
        .na-card-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 16px; }
        .na-help { font-size: 12px; color: var(--c-faint, #9ca3af); line-height: 1.55; margin: 0; }

        /* Fields */
        .na-field-label { font-size: 12px; font-weight: 600; color: var(--c-text-2, #374151); margin-bottom: 6px; display: block; }
        .na-req { color: var(--c-danger, #dc2626); }
        .na-input, .na-select, .na-textarea { width: 100%; padding: 9px 12px; border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 9px; font-size: 13px; color: var(--c-text, #111418); background: var(--c-surface, #ffffff); outline: none; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
        .na-input, .na-select { height: 38px; }
        .na-input:focus, .na-select:focus, .na-textarea:focus { border-color: #00C8E0; box-shadow: 0 0 0 3px rgba(0,200,224,.15); }
        .na-textarea { resize: vertical; line-height: 1.55; min-height: 84px; }
        .na-input::placeholder, .na-textarea::placeholder { color: var(--c-faint, #9ca3af) !important; opacity: 1 !important; }
        .na-select option { background: var(--c-surface, #ffffff); color: var(--c-text, #111418); }
        .na-select.narrow { max-width: 260px; }

        /* Cover */
        .na-upload-row { display: flex; gap: 10px; align-items: stretch; }
        .na-browse { background: var(--c-primary, #15202e); color: var(--c-primary-text, #ffffff); border: none; border-radius: 9px; padding: 0 16px; height: 40px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; font-family: inherit; }
        .na-browse:hover { background: var(--c-primary-hover, #1e3448); }
        .na-drop { flex: 1; min-height: 40px; border: 1.5px dashed var(--c-border-strong, #e2e4e8); border-radius: 9px; padding: 0 14px; display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--c-muted, #6b7280); cursor: pointer; transition: all .15s; background: var(--c-surface-2, #f8f9fb); }
        .na-drop:hover, .na-drop.drag { border-color: #00C8E0; background: var(--c-accent-tint, #e6fbfd); }
        .na-drop u { color: var(--c-accent-ink, #007f8f); font-weight: 600; text-decoration: underline; }
        .na-drop .none { margin-left: auto; color: var(--c-faint, #9ca3af); font-size: 12px; }
        .na-thumb { width: 220px; max-width: 100%; border: 1px solid var(--c-border, #e8eaed); border-radius: 10px; overflow: hidden; background: var(--c-surface, #ffffff); }
        .na-thumb img { width: 100%; height: 124px; object-fit: cover; display: block; }
        .na-thumb-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; font-size: 11.5px; color: var(--c-muted, #6b7280); }
        .na-thumb-foot span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .na-thumb-foot button { background: var(--c-surface, #ffffff); border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 7px; padding: 4px 10px; font-size: 11.5px; font-weight: 600; color: var(--c-text-2, #374151); cursor: pointer; flex-shrink: 0; font-family: inherit; }
        .na-thumb-foot button:hover { color: var(--c-danger, #dc2626); border-color: var(--c-danger-border, #fecaca); background: var(--c-danger-bg, #fff1f1); }

        /* Tags */
        .na-tagbox { border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 10px; padding: 10px; background: var(--c-surface-2, #f8f9fb); display: flex; flex-direction: column; gap: 10px; }
        .na-tag-list { min-height: 38px; border-radius: 8px; background: var(--c-surface, #ffffff); border: 1px solid var(--c-border, #e8eaed); padding: 8px 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 12px; color: var(--c-faint, #9ca3af); }
        .tag-item { display: inline-flex; align-items: center; gap: 5px; background: var(--c-accent-tint, #e6fbfd); border-radius: 999px; padding: 3px 6px 3px 10px; font-size: 12px; color: var(--c-accent-ink, #007f8f); font-weight: 500; }
        .tag-remove { background: none; border: none; cursor: pointer; color: var(--c-faint, #9ca3af); padding: 0 3px; font-size: 14px; line-height: 1; }
        .tag-remove:hover { color: var(--c-danger, #dc2626); }
        .na-tag-row { display: flex; gap: 6px; }
        .na-tag-row .na-btn { height: 38px; }

        /* Check cards */
        .na-checkcard { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 10px; padding: 12px 14px; background: var(--c-surface-2, #f8f9fb); cursor: pointer; }
        .na-checkcard-title { font-size: 13px; font-weight: 700; color: var(--c-text, #111418); }
        .na-checkcard-hint { font-size: 11.5px; color: var(--c-faint, #9ca3af); margin-top: 3px; line-height: 1.5; }
        .na-checkcard input { width: 16px; height: 16px; margin-top: 2px; accent-color: #00C8E0; flex-shrink: 0; cursor: pointer; }

        /* Switches */
        .na-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .na-toggle-label { font-size: 13px; color: var(--c-text-2, #374151); font-weight: 500; }
        .na-ttrack { position: relative; width: 38px; height: 22px; border-radius: 11px; background: var(--c-hover-strong, #e8eaed); cursor: pointer; flex-shrink: 0; border: 1px solid var(--c-border-strong, #e2e4e8); padding: 0; transition: background .2s; }
        .na-ttrack.on { background: #00C8E0; border-color: #00C8E0; }
        .na-tknob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
        .na-ttrack.on .na-tknob { transform: translateX(16px); }

        /* Combobox */
        .na-combo { position: relative; }
        .na-combo-list { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--c-surface, #ffffff); border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.28); max-height: 220px; overflow-y: auto; z-index: 30; padding: 5px; }
        .na-combo-item { padding: 8px 11px; font-size: 13px; color: var(--c-text, #111418); border-radius: 8px; cursor: pointer; }
        .na-combo-item:hover { background: var(--c-hover, #f3f4f6); }
        .na-combo-create { padding: 8px 11px; font-size: 13px; color: var(--c-accent-ink, #007f8f); font-weight: 600; border-radius: 8px; cursor: pointer; border-top: 1px solid var(--c-divider, #f0f2f4); margin-top: 3px; }
        .na-combo-create:hover { background: var(--c-accent-tint, #e6fbfd); }
        .na-combo-empty { padding: 8px 11px; font-size: 12.5px; color: var(--c-faint, #9ca3af); }

        /* Appearance */
        .na-live { border-radius: 12px; overflow: hidden; position: relative; min-height: 200px; display: flex; align-items: flex-end; padding: 20px; border: 1px solid var(--c-border, #e8eaed); }
        .na-live-grid { position: absolute; inset: 0; }
        .na-live-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 65%); }
        .na-live-badge { display: inline-block; font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; margin-bottom: 8px; }
        .na-live-title { color: #fff; font-size: 28px; line-height: 1.15; font-weight: 700; word-break: break-word; }
        .theme-preset-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .theme-preset-card { border: 1.5px solid var(--c-border-strong, #e2e4e8); border-radius: 11px; overflow: hidden; cursor: pointer; background: var(--c-surface-2, #f8f9fb); padding: 0; text-align: left; transition: all .15s; }
        .theme-preset-card:hover { border-color: var(--c-faint, #9ca3af); }
        .theme-preset-card.sel { border-color: #00C8E0; box-shadow: 0 0 0 3px rgba(0,200,224,.18); }
        .theme-preset-swatch { height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .theme-preset-dot { width: 9px; height: 9px; border-radius: 50%; }
        .theme-preset-name { font-size: 12px; font-weight: 600; color: var(--c-text-2, #374151); padding: 7px 10px; }
        .na-color-row { display: flex; align-items: center; gap: 8px; }
        .na-color-swatch { width: 38px; height: 38px; border-radius: 9px; border: 1px solid var(--c-border-strong, #e2e4e8); flex-shrink: 0; }
        .na-color-pick { width: 38px; height: 38px; border: 1px solid var(--c-border-strong, #e2e4e8); padding: 3px; cursor: pointer; border-radius: 9px; background: var(--c-surface, #ffffff); flex-shrink: 0; }

        /* Rich text editor (component: RichTextEditor) */
        .na-body-wrap { background: var(--c-surface, #ffffff); border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 10px; overflow: hidden; margin: 16px 18px 18px; }
        .na-toolbar { display: flex; gap: 2px; padding: 8px 10px; border-bottom: 1px solid var(--c-divider, #f0f2f4); background: var(--c-surface-2, #f8f9fb); flex-wrap: wrap; align-items: center; }
        .na-tool-btn { padding: 5px 9px; border-radius: 7px; border: none; background: none; cursor: pointer; font-size: 12.5px; font-weight: 600; color: var(--c-muted, #6b7280); transition: all .12s; font-family: inherit; }
        .na-tool-btn:hover { background: var(--c-hover-strong, #e8eaed); color: var(--c-text, #111418); }
        .na-tool-btn.active { background: var(--c-accent-tint, #e6fbfd); color: var(--c-accent-ink, #007f8f); }
        .na-tool-font-select { font-size: 12px; border: 1px solid var(--c-border-strong, #e2e4e8); border-radius: 7px; padding: 4px 8px; background: var(--c-surface, #ffffff); color: var(--c-text-2, #374151); outline: none; }
        .na-tool-font-select option { background: var(--c-surface, #ffffff); color: var(--c-text, #111418); }
        .na-body-editor { font-size: 14px; color: var(--c-text-2, #374151); line-height: 1.8; }
        .na-body-wrap .na-body-editor { min-height: 320px; padding: 16px 18px; outline: none; }
        .na-body-editor p { margin: 0 0 12px; }
        .na-body-editor h1, .na-body-editor h2, .na-body-editor h3 { font-family: 'Barlow Condensed', sans-serif; color: var(--c-text, #111418); line-height: 1.2; margin: 18px 0 8px; }
        .na-body-editor h1 { font-size: 28px; } .na-body-editor h2 { font-size: 23px; } .na-body-editor h3 { font-size: 19px; }
        .na-body-editor hr { border: none; border-top: 1px solid var(--c-border-strong, #e2e4e8); margin: 18px 0; }
        .na-body-editor ul, .na-body-editor ol { padding-left: 22px; margin: 0 0 12px; }
        .na-body-editor img { max-width: 100%; border-radius: 10px; margin: 12px 0; display: block; }
        .na-body-editor img.ProseMirror-selectednode { outline: 2px solid #00C8E0; }
        .na-body-editor a { color: var(--c-accent-ink, #007f8f); text-decoration: underline; }
        .na-body-editor blockquote { border-left: 3px solid #00C8E0; margin: 12px 0; padding-left: 14px; color: var(--c-muted, #6b7280); font-style: italic; }
        .na-body-editor code { background: var(--c-hover-strong, #e8eaed); padding: 1px 5px; border-radius: 4px; font-size: .9em; }

        /* Toast */
        .na-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--c-toast-bg, #111418); color: var(--c-toast-text, #ffffff); padding: 11px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 999; white-space: nowrap; box-shadow: 0 8px 28px rgba(0,0,0,.3); }

        /* Preview modal */
        .na-preview-overlay { position: fixed; inset: 0; background: var(--c-overlay, rgba(10, 20, 32, 0.55)); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 32px; backdrop-filter: blur(3px); }
        .na-preview-modal { background: var(--c-surface, #ffffff); border: 1px solid var(--c-border, #e8eaed); border-radius: 16px; width: 100%; max-width: 680px; max-height: 88vh; overflow-y: auto; box-shadow: 0 24px 70px rgba(0,0,0,.45); }
        .na-preview-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--c-divider, #f0f2f4); position: sticky; top: 0; background: var(--c-surface, #ffffff); z-index: 1; }
        .na-preview-modal-title { font-size: 14px; font-weight: 700; color: var(--c-text-2, #374151); }
        .na-preview-close-btn { background: var(--c-hover, #f3f4f6); border: none; border-radius: 8px; width: 30px; height: 30px; font-size: 18px; cursor: pointer; color: var(--c-muted, #6b7280); }
        .na-preview-close-btn:hover { background: var(--c-hover-strong, #e8eaed); color: var(--c-text, #111418); }
        .article-preview-hero { border-radius: 12px; overflow: hidden; position: relative; display: flex; align-items: flex-end; padding: 18px; }
        .preview-grid { position: absolute; inset: 0; }
        .preview-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 60%); }

        @media (max-width: 980px) {
          .na-grid { grid-template-columns: minmax(0, 1fr); }
          .theme-preset-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .na-wrap { padding: 24px 16px 80px; }
          .na-h1 { font-size: 26px; }
          .na-upload-row { flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) { .na-root * { transition: none !important; } }
      `}</style>

      <div className="na-root">
        <div className="na-wrap">
          {/* Heading */}
          <div className="na-eyebrow">
            <button type="button" onClick={() => navigate("/dashboard/articles")}>← Articles</button>
            <span>/</span>
            <span>{isEdit ? "Edit article" : "New article"}</span>
            <span className="na-pill">{statusLabel}</span>
          </div>
          <h1 className={`na-h1 ${form.title.trim() ? "" : "empty"}`}>{form.title.trim() || "Untitled article"}</h1>

          {/* Tabs + actions */}
          <div className="na-bar">
            <div className="na-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "main"} className={`na-tab ${tab === "main" ? "active" : ""}`} onClick={() => setTab("main")}>
                Main
              </button>
              <button type="button" role="tab" aria-selected={tab === "appearance"} className={`na-tab ${tab === "appearance" ? "active" : ""}`} onClick={() => setTab("appearance")}>
                Appearance
              </button>
            </div>
            <div className="na-actions">
              {isEdit && onDelete && (
                <button type="button" className="na-btn danger" onClick={handleDelete} disabled={deleting || saving}>
                  🗑 {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
              <button type="button" className="na-btn warm" onClick={() => setShowPreview(true)} disabled={!form.title.trim()}>
                👁 Preview
              </button>
              <div className="na-split" ref={saveMenuRef}>
                <button type="button" className="na-btn dark main" onClick={() => handleSave()} disabled={saving}>
                  {saving ? "Saving…" : isEdit ? "Save changes" : "Save"}
                </button>
                <button type="button" className="na-btn dark chev" onClick={() => setSaveMenu(o => !o)} disabled={saving} aria-label="More save options" aria-haspopup="menu" aria-expanded={saveMenu}>
                  ▾
                </button>
                {saveMenu && (
                  <div className="na-menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => handleSave("DRAFT")}>
                      {isEdit && form.status === "PUBLISHED" ? "Unpublish (move to draft)" : "Save as draft"}
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleSave("SCHEDULED")}>
                      Schedule
                    </button>
                    <button type="button" role="menuitem" onClick={() => handleSave("PUBLISHED")}>
                      {isEdit ? "Save & publish" : "Publish now"}
                      <small>Goes live on the website</small>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- MAIN ---------------- */}
          {tab === "main" && (
            <div className="na-grid">
              <div className="na-col">
                <Card title="Cover photo" sub="Upload a featured image for this article or browse uploaded assets later.">
                  <div className="na-card-body">
                    <input ref={featuredInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFeaturedFile(e.target.files?.[0])} />
                    <div className="na-upload-row">
                      <button type="button" className="na-browse" onClick={() => featuredInputRef.current?.click()}>
                        📁 Browse uploaded assets
                      </button>
                      <div
                        className={`na-drop ${featuredDragActive ? "drag" : ""}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => featuredInputRef.current?.click()}
                        onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), featuredInputRef.current?.click())}
                        onDragOver={e => {
                          e.preventDefault();
                          setFeaturedDragActive(true);
                        }}
                        onDragLeave={() => setFeaturedDragActive(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setFeaturedDragActive(false);
                          handleFeaturedFile(e.dataTransfer.files?.[0]);
                        }}
                      >
                        <span>⬆</span>
                        <span>
                          Drag &amp; drop here or <u>choose a file</u>.
                        </span>
                        <span className="none">{featuredImage ? "1 file selected" : coverSrc ? "Using current cover" : "No file selected"}</span>
                      </div>
                    </div>
                    {coverSrc && (
                      <div className="na-thumb">
                        <img src={coverSrc} alt="Cover preview" />
                        <div className="na-thumb-foot">
                          <span>{featuredImage?.name ?? "Current cover"}</span>
                          <button type="button" onClick={removeFeaturedImage}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="Article Information">
                  <div className="na-card-body">
                    <div>
                      <label className="na-field-label">
                        Title <span className="na-req">*</span>
                      </label>
                      <input className="na-input" placeholder="Article title…" value={form.title} onChange={e => handleTitleChange(e.target.value)} />
                    </div>

                    <div ref={categoryBoxRef} className="na-combo">
                      <label className="na-field-label">
                        Category <span className="na-req">*</span>
                      </label>
                      <input
                        className="na-input"
                        placeholder="Search or create category…"
                        value={categoryQuery}
                        onChange={e => {
                          setCategoryQuery(e.target.value);
                          setField("categoryId", "");
                          setCategoryOpen(true);
                        }}
                        onFocus={() => setCategoryOpen(true)}
                      />
                      {categoryOpen && (
                        <div className="na-combo-list">
                          {filteredCategories.map(c => (
                            <div key={c.id} className="na-combo-item" onClick={() => selectCategory(c)}>
                              {c.name}
                            </div>
                          ))}
                          {filteredCategories.length === 0 && !categoryQuery.trim() && <div className="na-combo-empty">No categories yet — type to create one</div>}
                          {categoryQuery.trim() && !exactCategoryMatch && (
                            <div className="na-combo-create" onClick={() => !creatingCategory && createCategory(categoryQuery.trim())}>
                              {creatingCategory ? "Creating…" : `+ Create "${categoryQuery.trim()}"`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="na-field-label">
                        Type <span className="na-req">*</span>
                      </label>
                      <select className="na-select narrow" value={form.type} onChange={e => setField("type", e.target.value)}>
                        {TYPES.map(t => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="na-field-label">
                        Overview <span className="na-req">*</span>
                      </label>
                      <textarea className="na-textarea" placeholder="Short summary shown in article cards and search results…" rows={3} value={form.overview} onChange={e => setField("overview", e.target.value)} />
                    </div>
                  </div>
                </Card>

                <Card title="Article body" meta={`${wordCount} ${wordCount === 1 ? "word" : "words"}`}>
                  <RichTextEditor value={form.body} onChange={html => setField("body", html)} />
                </Card>

                <Card title="Pull quote">
                  <div className="na-card-body">
                    <p className="na-help">Optional. A short standout line pulled from the article and displayed in large styled text to break up the body — like a magazine callout.</p>
                    <textarea className="na-textarea" placeholder='"A memorable quote from the article…"' rows={2} value={form.pullQuote} onChange={e => setField("pullQuote", e.target.value)} />
                  </div>
                </Card>
              </div>

              {/* Right column */}
              <div className="na-col">
                <Card title="Publishing Details">
                  <div className="na-card-body">
                    <div>
                      <label className="na-field-label">Status</label>
                      <select className="na-select" value={form.status} onChange={e => setField("status", e.target.value)}>
                        {STATUSES.map(s => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="na-field-label">Author</label>
                      <select className="na-select" value={form.authorId} onChange={e => setField("authorId", e.target.value)}>
                        <option value="">Select author…</option>
                        {authors.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.firstName} {a.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="na-field-label">Slug</label>
                      <input className="na-input" value={form.slug} onChange={e => handleSlugChange(e.target.value)} placeholder="article-slug" />
                      {isEdit && form.status === "PUBLISHED" && <p className="na-help" style={{ marginTop: 6 }}>Changing the slug changes this article's public URL.</p>}
                    </div>
                    <div>
                      <label className="na-field-label">Read time (minutes)</label>
                      <input className="na-input" type="number" min={1} max={60} value={form.readTime} onChange={e => setField("readTime", Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="na-field-label">Tags</label>
                      <div className="na-tagbox">
                        <div className="na-tag-row">
                          <input
                            className="na-input"
                            placeholder="Add tag…"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                          />
                          <button type="button" className="na-btn" onClick={addTag}>
                            Add
                          </button>
                        </div>
                        <div className="na-tag-list">
                          {form.tags.length === 0
                            ? "No tags selected yet."
                            : form.tags.map((tag: string) => (
                                <span key={tag} className="tag-item">
                                  {tag}
                                  <button type="button" className="tag-remove" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                                    ×
                                  </button>
                                </span>
                              ))}
                        </div>
                      </div>
                    </div>
                    <CheckCard checked={form.isFeatured} onChange={() => setField("isFeatured", !form.isFeatured)} title="Featured article" hint="Mark this article for featured sections on the public website." />
                    <CheckCard checked={form.isBreaking} onChange={() => setField("isBreaking", !form.isBreaking)} title="Breaking news" hint="Show this article in the breaking news banner." />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ---------------- APPEARANCE ---------------- */}
          {tab === "appearance" && (
            <div className="na-grid">
              <div className="na-col">
                <Card title="Live preview" sub="Updates as you change the title, category and theme.">
                  <div className="na-card-body">
                    <div
                      className="na-live"
                      style={{
                        background: coverSrc && form.layout !== "MINIMAL" ? undefined : form.themeHeroBg,
                        backgroundImage: coverSrc && form.layout !== "MINIMAL" ? `url(${coverSrc})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {!coverSrc && form.themeGridOverlay && (
                        <div
                          className="na-live-grid"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(255,255,255,0.05) 15px),repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(255,255,255,0.05) 15px)",
                          }}
                        />
                      )}
                      <div className="na-live-shade" />
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <span className="na-live-badge" style={{ background: form.themeAccentColor, color: preset.accentText }}>
                          {categoryName || "Category"}
                        </span>
                        <div className="na-live-title" style={{ fontFamily: titleFont }}>
                          {form.title.trim() || "Your headline goes here"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Style preset">
                  <div className="na-card-body">
                    <div className="theme-preset-grid">
                      {THEME_PRESETS.map(p => (
                        <button type="button" key={p.key} className={`theme-preset-card ${form.themePreset === p.key ? "sel" : ""}`} onClick={() => applyPreset(p)} aria-pressed={form.themePreset === p.key}>
                          <div className="theme-preset-swatch" style={{ background: p.bg }}>
                            <span className="theme-preset-dot" style={{ background: p.accent }} />
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: p.accent, letterSpacing: "0.1em" }}>Aa</span>
                          </div>
                          <div className="theme-preset-name">{p.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="na-col">
                <Card title="Colours & type">
                  <div className="na-card-body">
                    <div>
                      <label className="na-field-label">Hero background</label>
                      <div className="na-color-row">
                        <div className="na-color-swatch" style={{ background: form.themeHeroBg }} />
                        <input className="na-input" value={form.themeHeroBg} onChange={e => setField("themeHeroBg", e.target.value)} />
                        <input type="color" className="na-color-pick" aria-label="Pick hero background" value={form.themeHeroBg} onChange={e => setField("themeHeroBg", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="na-field-label">Accent colour</label>
                      <div className="na-color-row">
                        <div className="na-color-swatch" style={{ background: form.themeAccentColor }} />
                        <input className="na-input" value={form.themeAccentColor} onChange={e => setField("themeAccentColor", e.target.value)} />
                        <input type="color" className="na-color-pick" aria-label="Pick accent colour" value={form.themeAccentColor} onChange={e => setField("themeAccentColor", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="na-field-label">Title font</label>
                      <select className="na-select" value={form.themeTitleFont} onChange={e => setField("themeTitleFont", e.target.value)}>
                        {FONTS.map(f => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="na-field-label">Article layout</label>
                      <select className="na-select" value={form.layout} onChange={e => setField("layout", e.target.value)}>
                        {LAYOUTS.map(l => (
                          <option key={l.key} value={l.key}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Switch on={form.themeDarkBody} onChange={() => setField("themeDarkBody", !form.themeDarkBody)} label="Dark article body" />
                    <Switch on={form.themeShowPullQuote} onChange={() => setField("themeShowPullQuote", !form.themeShowPullQuote)} label="Show pull quote" />
                    <Switch on={form.themeGridOverlay} onChange={() => setField("themeGridOverlay", !form.themeGridOverlay)} label="Grid overlay on hero" />
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="na-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="na-preview-modal" role="dialog" aria-modal="true" aria-label="Article preview" onClick={e => e.stopPropagation()}>
            <div className="na-preview-modal-header">
              <span className="na-preview-modal-title">Article preview</span>
              <button type="button" className="na-preview-close-btn" onClick={() => setShowPreview(false)} aria-label="Close preview">
                ×
              </button>
            </div>
            <div style={{ padding: 18 }}>
              <div
                className="article-preview-hero"
                style={{
                  background: coverSrc ? undefined : form.themeHeroBg,
                  minHeight: 200,
                  backgroundImage: coverSrc ? `url(${coverSrc})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!coverSrc && form.themeGridOverlay && (
                  <div
                    className="preview-grid"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(0,0,0,0.05) 15px),repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(0,0,0,0.05) 15px)",
                    }}
                  />
                )}
                <div className="preview-overlay" />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      display: "inline-block",
                      background: form.themeAccentColor,
                      color: preset.accentText,
                      fontSize: 10,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: 2,
                      marginBottom: 8,
                    }}
                  >
                    {categoryName || "Category"}
                  </div>
                  <div style={{ fontFamily: titleFont, fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{form.title}</div>
                </div>
              </div>
              {form.overview && <p style={{ marginTop: 16, fontSize: 14, color: "var(--c-muted, #6b7280)", lineHeight: 1.6 }}>{form.overview}</p>}
              {form.pullQuote && form.themeShowPullQuote && (
                <div style={{ margin: "16px 0", padding: "12px 16px", borderLeft: `3px solid ${form.themeAccentColor}`, background: `${form.themeAccentColor}18`, fontSize: 14, fontStyle: "italic", color: "var(--c-text-2, #374151)", lineHeight: 1.5 }}>
                  {form.pullQuote}
                </div>
              )}
              {form.body && <div className="na-body-editor" style={{ marginTop: 16 }} dangerouslySetInnerHTML={{ __html: form.body }} />}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="na-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}