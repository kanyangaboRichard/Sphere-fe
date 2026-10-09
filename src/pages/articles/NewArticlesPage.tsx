/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";
import { uploadMedia } from "../../lib/media";

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
  { key: "BARLOW_CONDENSED", label: "Barlow Condensed" },
  { key: "OSWALD", label: "Oswald" },
  { key: "PLAYFAIR_DISPLAY", label: "Playfair Display" },
];

const TYPES = [
  { key: "ARTICLE", label: "Article" },
  { key: "VIDEO", label: "Video" },
  { key: "NEWS", label: "News" },
];

type BodyMediaItem = {
  id: string;
  type: "image" | "video";
  file: File;
  url: string;
  name: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function NewArticlePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [toast, setToast] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // ---- Category combobox state ----
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const categoryBoxRef = useRef<HTMLDivElement>(null);

  // ---- Media state ----
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [featuredDragActive, setFeaturedDragActive] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState<BodyMediaItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const galleryVideoInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState({
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
    // Theme
    themePreset: "TECH_DARK",
    themeHeroBg: "#0d1a2a",
    themeAccentColor: "#00C8E0",
    themeTitleFont: "BARLOW_CONDENSED",
    layout: "HERO_BOTTOM",
    themeDarkBody: false,
    themeShowPullQuote: true,
    themeGridOverlay: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, authRes] = await Promise.all([
          api.get("/categories"),
          api.get("/authors"),
        ]);
        setCategories(catRes.data.data || []);
        setAuthors(authRes.data.data?.authors || []);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    fetchData();
  }, []);

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (featuredImagePreview) URL.revokeObjectURL(featuredImagePreview);
      galleryMedia.forEach(m => URL.revokeObjectURL(m.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryBoxRef.current && !categoryBoxRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const setField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      title: value,
      slug: slugEdited ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setField("slug", slugify(value));
  };

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setForm(prev => ({
      ...prev,
      themePreset: preset.key,
      themeHeroBg: preset.bg,
      themeAccentColor: preset.accent,
    }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setField("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setField("tags", form.tags.filter(t => t !== tag));
  };

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
    if (featuredInputRef.current) featuredInputRef.current.value = "";
  };

  // ---- Gallery handlers ----
  const handleGalleryFile = (file: File | undefined | null, type: "image" | "video") => {
    if (!file) return;
    if (type === "image" && !file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      showToast("Please select a video file");
      return;
    }
    const id = `gal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const url = URL.createObjectURL(file);
    setGalleryMedia(prev => [...prev, { id, type, file, url, name: file.name }]);
  };

  const removeGalleryMedia = (id: string) => {
    setGalleryMedia(prev => {
      const item = prev.find(m => m.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(m => m.id !== id);
    });
  };

  const handleSave = async (status = form.status) => {
  if (!form.title.trim()) return showToast("Title is required");
  if (!form.categoryId) return showToast("Select or create a category from the list");
  if (!form.overview.trim()) return showToast("Overview is required");

  setSaving(true);
  try {
    // Upload media first (see note below)
    const coverMediaId = featuredImage ? (await uploadMedia(featuredImage)).id : null;
    const galleryMediaIds = await Promise.all(
      galleryMedia.map(m => uploadMedia(m.file).then(r => r.id))
    );

    const { overview, authorId, ...rest } = form;
    await api.post("/articles", {
      ...rest,
      status,
      excerpt: overview.trim(),     
      authorId: authorId || null,
      coverMediaId,
      galleryMediaIds,
    });

    showToast("Article saved!");
    setTimeout(() => navigate("/dashboard/articles"), 1000);
  } catch (err: any) {
    showToast(err.response?.data?.message || "Failed to save article");
  } finally {
    setSaving(false);
  }
};
  const preset = THEME_PRESETS.find(p => p.key === form.themePreset) || THEME_PRESETS[0];

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categoryQuery.toLowerCase())
  );
  const exactCategoryMatch = categories.some(
    c => c.name.toLowerCase() === categoryQuery.trim().toLowerCase()
  );

  return (
    <>
      <style>{`
        .na-root { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .na-topbar { background: #fff; border-bottom: 1px solid #e8eaed; height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .na-body { display: grid; grid-template-columns: 1fr 300px; flex: 1; min-height: 0; overflow: hidden; }
        .na-editor { padding: 24px; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: #f4f5f7; }
        .na-sidebar { border-left: 1px solid #e8eaed; background: #fff; min-height: 0; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .na-card { background: #fff; border: 1px solid #e8eaed; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
        .na-card-header { padding: 12px 14px; border-bottom: 1px solid #f0f2f4; background: #f8f9fb; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.06em; }
        .na-card-sub { padding: 8px 14px 0; font-size: 11px; color: #9ca3af; }
        .na-card-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
        .na-field-label { font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; display: block; }
        .na-input { width: 100%; padding: 8px 11px; border: 1px solid #e2e4e8; border-radius: 7px; font-size: 12px; color: #111418; outline: none; font-family: 'Barlow', sans-serif; transition: border-color 0.15s; box-sizing: border-box; }
        .na-input:focus { border-color: #00C8E0; }
        .na-select { width: 100%; padding: 8px 11px; border: 1px solid #e2e4e8; border-radius: 7px; font-size: 12px; color: #111418; outline: none; font-family: 'Barlow', sans-serif; background: #fff; box-sizing: border-box; }
        .na-textarea { width: 100%; padding: 10px 14px; border: 1px solid #e2e4e8; border-radius: 8px; font-size: 13px; color: #111418; outline: none; font-family: 'Barlow', sans-serif; resize: vertical; transition: border-color 0.15s; box-sizing: border-box; line-height: 1.6; }
        .na-textarea:focus { border-color: #00C8E0; }
        .na-title-input { width: 100%; padding: 12px 14px; border: 1px solid #e2e4e8; border-radius: 8px; font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; color: #111418; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .na-title-input:focus { border-color: #00C8E0; }
        .na-title-input::placeholder { color: #c8cfd8 !important; opacity: 1 !important; }
        .na-input::placeholder { color: #9ca3af !important; opacity: 1 !important; }
        .na-textarea::placeholder { color: #9ca3af !important; opacity: 1 !important; }
        .na-body-textarea::placeholder { color: #9ca3af !important; opacity: 1 !important; }
        .na-body-wrap { background: #fff; border: 1px solid #e2e4e8; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
        .na-toolbar { display: flex; gap: 2px; padding: 8px 10px; border-bottom: 1px solid #f0f2f4; background: #f8f9fb; flex-wrap: wrap; }
        .na-tool-btn { padding: 4px 8px; border-radius: 4px; border: none; background: none; cursor: pointer; font-size: 12px; font-weight: 600; color: #6b7280; transition: all 0.1s; }
        .na-tool-btn:hover { background: #e8eaed; color: #111418; }
        .na-body-textarea { width: 100%; min-height: 280px; padding: 14px 16px; border: none; outline: none; font-size: 13px; color: #374151; font-family: 'Barlow', sans-serif; line-height: 1.8; resize: none; box-sizing: border-box; }
        .na-toggle-row { display: flex; align-items: center; justify-content: space-between; }
        .na-toggle-label { font-size: 12px; color: #374151; }
        .na-ttrack { position: relative; width: 32px; height: 18px; border-radius: 9px; background: #d1d5db; cursor: pointer; display: inline-block; transition: background 0.2s; flex-shrink: 0; border: none; }
        .na-ttrack.on { background: #00C8E0; }
        .na-tknob { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
        .na-ttrack.on .na-tknob { transform: translateX(14px); }
        .theme-preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .theme-preset-card { border: 1.5px solid #e2e4e8; border-radius: 7px; overflow: hidden; cursor: pointer; transition: border-color 0.15s; }
        .theme-preset-card.sel { border-color: #00C8E0; }
        .theme-preset-swatch { height: 28px; display: flex; align-items: center; justify-content: center; }
        .theme-preset-name { font-size: 10px; font-weight: 500; color: #374151; padding: 4px 6px; text-align: center; }
        .tag-wrap { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }
        .tag-item { display: inline-flex; align-items: center; gap: 4px; background: #f0f2f4; border: 1px solid #e2e4e8; border-radius: 20px; padding: 2px 8px; font-size: 11px; color: #374151; }
        .tag-remove { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0; font-size: 13px; line-height: 1; }
        .tag-remove:hover { color: #dc2626; }
        .tag-input-row { display: flex; gap: 6px; }
        .btn-primary { background: #15202e; color: #fff; border: none; border-radius: 7px; padding: 8px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .btn-primary:hover { background: #1e3448; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #374151; border: 1px solid #e2e4e8; border-radius: 7px; padding: 8px 14px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-ghost:hover { border-color: #00C8E0; color: #00C8E0; }
        .btn-cyan { background: #00C8E0; color: #15202e; border: none; border-radius: 7px; padding: 8px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .btn-cyan:hover { background: #00afc6; }
        .na-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #111418; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 999; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .article-preview-hero { border-radius: 8px; overflow: hidden; margin-bottom: 0; position: relative; min-height: 80px; display: flex; align-items: flex-end; padding: 12px 14px; }
        .preview-grid { position: absolute; inset: 0; }
        .preview-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%); }

        /* --- Media upload styles --- */
        .na-upload-row { display: flex; gap: 10px; align-items: stretch; }
        .na-upload-zone { flex: 1; border: 1.5px dashed #d1d5db; border-radius: 10px; padding: 20px 14px; min-height: 60px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: all 0.15s; background: #fafbfc; text-align: center; }
        .na-upload-zone:hover { border-color: #00C8E0; background: #f0fcfe; }
        .na-upload-zone.drag { border-color: #00C8E0; background: #e6fbfd; }
        .na-browse-btn { background: #15202e; color: #fff; border: none; border-radius: 8px; padding: 0 18px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .na-browse-btn:hover { background: #1e3448; }
        .na-upload-icon { font-size: 20px; opacity: 0.5; }
        .na-upload-text { font-size: 12px; color: #6b7280; font-weight: 500; }
        .na-upload-hint { font-size: 10px; color: #9ca3af; }
        .na-featured-preview-wrap { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid #e2e4e8; width: 100%; max-width: 320px; background: #f4f5f7; flex-shrink: 0; }
        .na-featured-preview-img { width: 100%; max-height: 240px; object-fit: contain; display: block; }
        .na-featured-remove-btn { position: absolute; top: 8px; right: 8px; background: rgba(17,20,24,0.75); color: #fff; border: none; border-radius: 6px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; line-height: 1; }
        .na-featured-remove-btn:hover { background: rgba(220,38,38,0.85); }
        .na-featured-filename { font-size: 11px; padding: 6px 8px; color: #6b7280; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .na-featured-filename-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .na-remove-link { background: none; border: none; color: #dc2626; font-size: 11px; font-weight: 600; cursor: pointer; padding: 0; flex-shrink: 0; }

        /* --- Gallery grid --- */
        .na-gallery-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .na-gallery-add-tile { width: 96px; height: 96px; border-radius: 10px; border: 1.5px dashed #d1d5db; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: all 0.15s; background: #fafbfc; flex-shrink: 0; }
        .na-gallery-add-tile:hover { border-color: #00C8E0; background: #f0fcfe; }
        .na-gallery-add-icon { font-size: 20px; opacity: 0.6; }
        .na-gallery-add-label { font-size: 10px; font-weight: 600; color: #6b7280; text-align: center; }
        .na-gallery-tile { position: relative; width: 96px; height: 96px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e4e8; flex-shrink: 0; background: #111418; }
        .na-gallery-tile img, .na-gallery-tile video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .na-gallery-tile-badge { position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.6); border-radius: 4px; font-size: 11px; padding: 1px 4px; line-height: 1.3; }
        .na-gallery-tile-remove { position: absolute; top: 4px; right: 4px; background: rgba(17,20,24,0.75); color: #fff; border: none; border-radius: 5px; width: 20px; height: 20px; font-size: 13px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .na-gallery-tile:hover .na-gallery-tile-remove { opacity: 1; }

        /* --- Preview modal --- */
        .na-preview-overlay { position: fixed; inset: 0; background: rgba(17,20,24,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 32px; }
        .na-preview-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 640px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
        .na-preview-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #f0f2f4; position: sticky; top: 0; background: #fff; z-index: 1; }
        .na-preview-modal-title { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; }
        .na-preview-close-btn { background: #f0f2f4; border: none; border-radius: 6px; width: 28px; height: 28px; font-size: 16px; cursor: pointer; color: #6b7280; }
        .na-preview-close-btn:hover { background: #e2e4e8; color: #111418; }

        /* --- Category combobox --- */
        .na-combo { position: relative; }
        .na-combo-list { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e2e4e8; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); max-height: 200px; overflow-y: auto; z-index: 20; padding: 4px; }
        .na-combo-item { padding: 7px 10px; font-size: 12px; color: #111418; border-radius: 6px; cursor: pointer; }
        .na-combo-item:hover { background: #f0fcfe; }
        .na-combo-create { padding: 7px 10px; font-size: 12px; color: #00afc6; font-weight: 600; border-radius: 6px; cursor: pointer; border-top: 1px solid #f0f2f4; margin-top: 2px; }
        .na-combo-create:hover { background: #f0fcfe; }
        .na-combo-empty { padding: 7px 10px; font-size: 12px; color: #9ca3af; }
      `}</style>

      <div className="na-root">

        {/* Topbar */}
        <div className="na-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn-ghost" onClick={() => navigate("/dashboard/articles")} style={{ padding: "6px 12px", fontSize: 12 }}>
              ← Articles
            </button>
            <span style={{ color: "#d1d5db", fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>New article</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#f0f2f4", color: "#6b7280", fontWeight: 500 }}>
              {form.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => setShowPreview(true)} disabled={!form.title.trim()}>
              👁 Preview
            </button>
            <button className="btn-ghost" onClick={() => handleSave("DRAFT")} disabled={saving}>
              Save draft
            </button>
            <button className="btn-ghost" onClick={() => handleSave("SCHEDULED")} disabled={saving}>
              📅 Schedule
            </button>
            <button className="btn-cyan" onClick={() => handleSave("PUBLISHED")} disabled={saving}>
              {saving ? "Saving..." : "Publish →"}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="na-body">

          {/* Editor */}
          <div className="na-editor">

            {/* Cover photo */}
            <div className="na-card">
              <div className="na-card-header">Cover photo</div>
              <div className="na-card-sub">Upload a featured image for this article or browse uploaded assets later.</div>
              <div className="na-card-body">
                <input
                  ref={featuredInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => handleFeaturedFile(e.target.files?.[0])}
                />
                {featuredImagePreview ? (
                  <div className="na-featured-preview-wrap">
                    <img src={featuredImagePreview} alt="Cover" className="na-featured-preview-img" />
                    <div className="na-featured-filename">
                      <span className="na-featured-filename-text">{featuredImage?.name}</span>
                      <button className="na-remove-link" onClick={removeFeaturedImage}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <div className="na-upload-row">
                    <button className="na-browse-btn" onClick={() => featuredInputRef.current?.click()}>
                      📁 Browse uploaded assets
                    </button>
                    <div
                      className={`na-upload-zone ${featuredDragActive ? "drag" : ""}`}
                      onClick={() => featuredInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setFeaturedDragActive(true); }}
                      onDragLeave={() => setFeaturedDragActive(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setFeaturedDragActive(false);
                        handleFeaturedFile(e.dataTransfer.files?.[0]);
                      }}
                    >
                      <div className="na-upload-text">Drag &amp; drop here or <u>choose a file</u></div>
                      <div className="na-upload-hint">No file selected</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Article Information */}
            <div className="na-card">
              <div className="na-card-header">Article Information</div>
              <div className="na-card-body">
                <div>
                  <label className="na-field-label">Title *</label>
                  <input
                    className="na-title-input"
                    placeholder="Article title…"
                    value={form.title}
                    onChange={e => handleTitleChange(e.target.value)}
                  />
                </div>

                <div ref={categoryBoxRef} className="na-combo">
                  <label className="na-field-label">Category *</label>
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
                      {filteredCategories.length === 0 && !categoryQuery.trim() && (
                        <div className="na-combo-empty">No categories yet — type to create one</div>
                      )}
                      {categoryQuery.trim() && !exactCategoryMatch && (
                        <div
                          className="na-combo-create"
                          onClick={() => !creatingCategory && createCategory(categoryQuery.trim())}
                        >
                          {creatingCategory ? "Creating…" : `+ Create "${categoryQuery.trim()}"`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="na-field-label">Type *</label>
                  <select className="na-select" value={form.type} onChange={e => setField("type", e.target.value)}>
                    {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="na-field-label">Overview *</label>
                  <textarea
                    className="na-textarea"
                    placeholder="Short summary shown in article cards and search results…"
                    rows={3}
                    value={form.overview}
                    onChange={e => setField("overview", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="na-card">
              <div className="na-card-header">Article body</div>
              <div className="na-body-wrap" style={{ margin: "0 14px 14px" }}>
                <div className="na-toolbar">
                  {["B", "I", "H1", "H2", "H3", "—", "Link", "Quote"].map(t => (
                    <button key={t} className="na-tool-btn" style={{ fontStyle: t === "I" ? "italic" : "normal" }}>{t}</button>
                  ))}
                </div>
                <textarea
                  ref={bodyTextareaRef}
                  className="na-body-textarea"
                  placeholder="Write your article here…"
                  value={form.body}
                  onChange={e => setField("body", e.target.value)}
                />
              </div>
            </div>

            {/* Pull quote */}
            <div className="na-card">
              <div className="na-card-header">Pull quote</div>
              <div className="na-card-body">
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px", lineHeight: 1.5, wordBreak: "break-word" }}>
                  Optional. A short standout line pulled from the article and displayed in large styled text to break up the body — like a magazine callout.
                </p>
                <textarea
                  className="na-textarea"
                  placeholder='"A memorable quote from the article…"'
                  rows={2}
                  value={form.pullQuote}
                  onChange={e => setField("pullQuote", e.target.value)}
                />
              </div>
            </div>

            {/* Gallery */}
            <div className="na-card">
              <div className="na-card-header">Gallery</div>
              <div className="na-card-body">
                <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px" }}>
                  Images and videos attached here show as a gallery on the article, separate from anything inserted into the body.
                </p>
                <div className="na-gallery-grid">
                  <div className="na-gallery-add-tile" onClick={() => galleryImageInputRef.current?.click()}>
                    <span className="na-gallery-add-icon">🖼️</span>
                    <span className="na-gallery-add-label">Image</span>
                  </div>
                  <div className="na-gallery-add-tile" onClick={() => galleryVideoInputRef.current?.click()}>
                    <span className="na-gallery-add-icon">🎬</span>
                    <span className="na-gallery-add-label">Video</span>
                  </div>
                  <input
                    ref={galleryImageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => { handleGalleryFile(e.target.files?.[0], "image"); e.target.value = ""; }}
                  />
                  <input
                    ref={galleryVideoInputRef}
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={e => { handleGalleryFile(e.target.files?.[0], "video"); e.target.value = ""; }}
                  />
                  {galleryMedia.map(m => (
                    <div key={m.id} className="na-gallery-tile" title={m.name}>
                      {m.type === "image" ? (
                        <img src={m.url} alt={m.name} />
                      ) : (
                        <video src={m.url} muted />
                      )}
                      <span className="na-gallery-tile-badge">{m.type === "video" ? "🎬" : "🖼️"}</span>
                      <button className="na-gallery-tile-remove" onClick={() => removeGalleryMedia(m.id)} title="Remove">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="na-sidebar">

            {/* Publishing Details */}
            <div className="na-card">
              <div className="na-card-header">Publishing Details</div>
              <div className="na-card-body">
                <div>
                  <label className="na-field-label">Slug</label>
                  <input
                    className="na-input"
                    value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="article-slug"
                  />
                </div>

                <div>
                  <label className="na-field-label">Tags</label>
                  {form.tags.length > 0 && (
                    <div className="tag-wrap">
                      {form.tags.map(tag => (
                        <span key={tag} className="tag-item">
                          {tag}
                          <button className="tag-remove" onClick={() => removeTag(tag)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="tag-input-row">
                    <input
                      className="na-input"
                      placeholder="Add tag…"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                      style={{ flex: 1 }}
                    />
                    <button className="btn-ghost" onClick={addTag} style={{ padding: "8px 12px", fontSize: 11 }}>Add</button>
                  </div>
                </div>

                <div className="na-toggle-row">
                  <span className="na-toggle-label">Featured article</span>
                  <button className={`na-ttrack ${form.isFeatured ? "on" : ""}`} onClick={() => setField("isFeatured", !form.isFeatured)}>
                    <div className="na-tknob" />
                  </button>
                </div>

                <div style={{ borderTop: "1px solid #f0f2f4", margin: "2px 0" }} />

                <div>
                  <label className="na-field-label">Status</label>
                  <select className="na-select" value={form.status} onChange={e => setField("status", e.target.value)}>
                    <option value="DRAFT">Draft</option>
                    <option value="IN_REVIEW">In review</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>

                <div>
                  <label className="na-field-label">Author</label>
                  <select className="na-select" value={form.authorId} onChange={e => setField("authorId", e.target.value)}>
                    <option value="">Select author…</option>
                    {authors.map(a => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="na-field-label">Read time (minutes)</label>
                  <input className="na-input" type="number" min={1} max={60} value={form.readTime} onChange={e => setField("readTime", Number(e.target.value))} />
                </div>

                <div className="na-toggle-row">
                  <span className="na-toggle-label">Breaking news</span>
                  <button className={`na-ttrack ${form.isBreaking ? "on" : ""}`} onClick={() => setField("isBreaking", !form.isBreaking)}>
                    <div className="na-tknob" />
                  </button>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="na-card">
              <div className="na-card-header">Theme</div>
              <div className="na-card-body">
                <div>
                  <label className="na-field-label">Style preset</label>
                  <div className="theme-preset-grid">
                    {THEME_PRESETS.map(p => (
                      <div
                        key={p.key}
                        className={`theme-preset-card ${form.themePreset === p.key ? "sel" : ""}`}
                        onClick={() => applyPreset(p)}
                      >
                        <div className="theme-preset-swatch" style={{ background: p.bg }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, fontWeight: 700, color: p.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            {p.label.toUpperCase()}
                          </span>
                        </div>
                        <div className="theme-preset-name">{p.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="na-field-label">Hero background</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: form.themeHeroBg, border: "1px solid #e2e4e8", flexShrink: 0 }} />
                    <input className="na-input" value={form.themeHeroBg} onChange={e => setField("themeHeroBg", e.target.value)} style={{ flex: 1 }} />
                    <input type="color" value={form.themeHeroBg} onChange={e => setField("themeHeroBg", e.target.value)} style={{ width: 28, height: 28, border: "none", padding: 0, cursor: "pointer", borderRadius: 4 }} />
                  </div>
                </div>

                <div>
                  <label className="na-field-label">Accent colour</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: form.themeAccentColor, border: "1px solid #e2e4e8", flexShrink: 0 }} />
                    <input className="na-input" value={form.themeAccentColor} onChange={e => setField("themeAccentColor", e.target.value)} style={{ flex: 1 }} />
                    <input type="color" value={form.themeAccentColor} onChange={e => setField("themeAccentColor", e.target.value)} style={{ width: 28, height: 28, border: "none", padding: 0, cursor: "pointer", borderRadius: 4 }} />
                  </div>
                </div>

                <div>
                  <label className="na-field-label">Title font</label>
                  <select className="na-select" value={form.themeTitleFont} onChange={e => setField("themeTitleFont", e.target.value)}>
                    {FONTS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="na-field-label">Article layout</label>
                  <select className="na-select" value={form.layout} onChange={e => setField("layout", e.target.value)}>
                    {LAYOUTS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                  </select>
                </div>

                <div className="na-toggle-row">
                  <span className="na-toggle-label">Dark article body</span>
                  <button className={`na-ttrack ${form.themeDarkBody ? "on" : ""}`} onClick={() => setField("themeDarkBody", !form.themeDarkBody)}>
                    <div className="na-tknob" />
                  </button>
                </div>
                <div className="na-toggle-row">
                  <span className="na-toggle-label">Show pull quote</span>
                  <button className={`na-ttrack ${form.themeShowPullQuote ? "on" : ""}`} onClick={() => setField("themeShowPullQuote", !form.themeShowPullQuote)}>
                    <div className="na-tknob" />
                  </button>
                </div>
                <div className="na-toggle-row">
                  <span className="na-toggle-label">Grid overlay on hero</span>
                  <button className={`na-ttrack ${form.themeGridOverlay ? "on" : ""}`} onClick={() => setField("themeGridOverlay", !form.themeGridOverlay)}>
                    <div className="na-tknob" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="na-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="na-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="na-preview-modal-header">
              <span className="na-preview-modal-title">Article preview</span>
              <button className="na-preview-close-btn" onClick={() => setShowPreview(false)}>×</button>
            </div>
            <div style={{ padding: "16px" }}>
              <div
                className="article-preview-hero"
                style={{
                  background: featuredImagePreview ? undefined : form.themeHeroBg,
                  minHeight: 180,
                  backgroundImage: featuredImagePreview ? `url(${featuredImagePreview})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!featuredImagePreview && form.themeGridOverlay && (
                  <div className="preview-grid" style={{ backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(0,0,0,0.05) 15px),repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(0,0,0,0.05) 15px)` }} />
                )}
                <div className="preview-overlay" />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "inline-block", background: form.themeAccentColor, color: preset.accentText, fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 2, marginBottom: 8 }}>
                    {categories.find(c => c.id === form.categoryId)?.name || "Category"}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                    {form.title}
                  </div>
                </div>
              </div>
              {form.overview && (
                <p style={{ marginTop: 14, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{form.overview}</p>
              )}
              {form.pullQuote && form.themeShowPullQuote && (
                <div style={{ margin: "14px 0", padding: "10px 14px", borderLeft: `3px solid ${form.themeAccentColor}`, background: `${form.themeAccentColor}10`, fontSize: 13, fontStyle: "italic", color: "#374151", lineHeight: 1.5 }}>
                  {form.pullQuote}
                </div>
              )}
              {form.body && (
                <div style={{ marginTop: 14, fontSize: 13, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {form.body}
                </div>
              )}
              {galleryMedia.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 0 6px" }}>Gallery</div>
                  <div className="na-gallery-grid">
                    {galleryMedia.map(m => (
                      <div key={m.id} className="na-gallery-tile">
                        {m.type === "image" ? <img src={m.url} alt={m.name} /> : <video src={m.url} muted controls />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="na-toast">{toast}</div>}
    </>
  );
}