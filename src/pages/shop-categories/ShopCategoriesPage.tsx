/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";
import { uploadMedia } from "../../lib/media";

interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  imagePublicId: string | null;
  order: number;
  isActive: boolean;
}

const emptyForm = {
  id: "",
  name: "",
  image: "" as string | null,
  imagePublicId: "" as string | null,
  order: 0,
  isActive: true,
};

export default function ShopCategoriesPage() {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/shop-categories");
      setCategories(res.data.data ?? []);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load shop categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: ShopCategory) => {
    setForm({
      id: c.id,
      name: c.name,
      image: c.image,
      imagePublicId: c.imagePublicId,
      order: c.order,
      isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }
    setUploading(true);
    try {
      const media = await uploadMedia(file);
      setForm(prev => ({ ...prev, image: media.url, imagePublicId: media.id }));
    } catch (err: any) {
      showToast(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showToast("Name is required");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        image: form.image,
        imagePublicId: form.imagePublicId,
        order: form.order,
        isActive: form.isActive,
      };
      if (form.id) {
        await api.put(`/shop-categories/${form.id}`, payload);
      } else {
        await api.post("/shop-categories", payload);
      }
      showToast("Saved!");
      setModalOpen(false);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shop category? Products in it will be uncategorized.")) return;
    try {
      await api.delete(`/shop-categories/${id}`);
      showToast("Deleted");
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete category");
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        .sc-page { padding: 24px; max-width: 1100px; }
        .sc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .sc-title { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 700; color: #111418; margin: 0; }
        .sc-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .sc-toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
        .sc-search { flex: 1; padding: 8px 12px; border: 1px solid #e2e4e8; border-radius: 7px; font-size: 13px; outline: none; }
        .sc-search:focus { border-color: #00C8E0; }
        .sc-table-wrap { background: #fff; border: 1px solid #e8eaed; border-radius: 10px; overflow: hidden; }
        table.sc-table { width: 100%; border-collapse: collapse; }
        .sc-table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 600; padding: 10px 14px; border-bottom: 1px solid #f0f2f4; background: #f8f9fb; }
        .sc-table td { padding: 10px 14px; font-size: 13px; color: #111418; border-bottom: 1px solid #f4f5f7; vertical-align: middle; }
        .sc-thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; background: #f0f2f4; display: block; }
        .sc-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
        .sc-badge.active { background: #dcfce7; color: #16a34a; }
        .sc-badge.inactive { background: #f3f4f6; color: #6b7280; }
        .sc-actions { display: flex; gap: 6px; }
        .sc-icon-btn { background: #f0f2f4; border: none; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 13px; }
        .sc-icon-btn:hover { background: #e2e4e8; }
        .sc-icon-btn.danger:hover { background: #fee2e2; }
        .btn-cyan { background: #00C8E0; color: #15202e; border: none; border-radius: 7px; padding: 9px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }
        .btn-cyan:hover { background: #00afc6; }
        .btn-ghost { background: transparent; color: #374151; border: 1px solid #e2e4e8; border-radius: 7px; padding: 8px 14px; font-size: 12px; font-weight: 500; cursor: pointer; }
        .btn-ghost:hover { border-color: #00C8E0; color: #00C8E0; }
        .sc-modal-overlay { position: fixed; inset: 0; background: rgba(17,20,24,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
        .sc-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; }
        .sc-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid #f0f2f4; }
        .sc-modal-title { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; color: #111418; }
        .sc-modal-close { background: #f0f2f4; border: none; border-radius: 6px; width: 28px; height: 28px; font-size: 16px; cursor: pointer; color: #6b7280; }
        .sc-modal-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
        .sc-field-label { font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; display: block; }
        .sc-input { width: 100%; padding: 8px 11px; border: 1px solid #e2e4e8; border-radius: 7px; font-size: 13px; outline: none; box-sizing: border-box; }
        .sc-input:focus { border-color: #00C8E0; }
        .sc-upload-zone { border: 1.5px dashed #d1d5db; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; text-align: center; }
        .sc-upload-zone:hover, .sc-upload-zone.drag { border-color: #00C8E0; background: #f0fcfe; }
        .sc-preview-wrap { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid #e2e4e8; }
        .sc-preview-img { width: 100%; height: 140px; object-fit: cover; display: block; }
        .sc-remove-btn { position: absolute; top: 8px; right: 8px; background: rgba(17,20,24,0.75); color: #fff; border: none; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; }
        .sc-toggle-row { display: flex; align-items: center; justify-content: space-between; }
        .sc-ttrack { position: relative; width: 32px; height: 18px; border-radius: 9px; background: #d1d5db; cursor: pointer; border: none; }
        .sc-ttrack.on { background: #00C8E0; }
        .sc-tknob { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
        .sc-ttrack.on .sc-tknob { transform: translateX(14px); }
        .sc-modal-footer { padding: 14px 18px; border-top: 1px solid #f0f2f4; display: flex; justify-content: flex-end; gap: 8px; }
        .sc-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #111418; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 1100; }
        .sc-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }
      `}</style>

      <div className="sc-page">
        <div className="sc-header">
          <div>
            <h1 className="sc-title">Shop Categories</h1>
            <div className="sc-sub">Categories shown in the "Shop with us" tile grid on the public site.</div>
          </div>
          <button className="btn-cyan" onClick={openCreate}>+ New Category</button>
        </div>

        <div className="sc-toolbar">
          <input className="sc-search" placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="sc-table-wrap">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    {c.image ? <img src={c.image} className="sc-thumb" /> : <div className="sc-thumb" />}
                  </td>
                  <td>{c.name}</td>
                  <td style={{ color: "#9ca3af" }}>{c.slug}</td>
                  <td>{c.order}</td>
                  <td><span className={`sc-badge ${c.isActive ? "active" : "inactive"}`}>{c.isActive ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div className="sc-actions">
                      <button className="sc-icon-btn" onClick={() => openEdit(c)}>✎</button>
                      <button className="sc-icon-btn danger" onClick={() => handleDelete(c.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="sc-empty">No shop categories yet — create one to get started.</div>}
        </div>
      </div>

      {modalOpen && (
        <div className="sc-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="sc-modal" onClick={e => e.stopPropagation()}>
            <div className="sc-modal-header">
              <span className="sc-modal-title">{form.id ? "Edit category" : "New category"}</span>
              <button className="sc-modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="sc-modal-body">
              <div>
                <label className="sc-field-label">Name *</label>
                <input className="sc-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electronics & Technology" />
              </div>

              <div>
                <label className="sc-field-label">Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
                {form.image ? (
                  <div className="sc-preview-wrap">
                    <img src={form.image} className="sc-preview-img" />
                    <button className="sc-remove-btn" onClick={() => setForm(f => ({ ...f, image: "", imagePublicId: "" }))}>×</button>
                  </div>
                ) : (
                  <div
                    className={`sc-upload-zone ${dragActive ? "drag" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{uploading ? "Uploading…" : "Drag & drop or click to upload"}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="sc-field-label">Display order</label>
                <input className="sc-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
              </div>

              <div className="sc-toggle-row">
                <span style={{ fontSize: 12, color: "#374151" }}>Active (visible on site)</span>
                <button className={`sc-ttrack ${form.isActive ? "on" : ""}`} onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                  <div className="sc-tknob" />
                </button>
              </div>
            </div>
            <div className="sc-modal-footer">
              <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-cyan" onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sc-toast">{toast}</div>}
    </>
  );
}