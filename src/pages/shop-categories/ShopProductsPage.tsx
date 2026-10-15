/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";
import { uploadMedia } from "../../lib/media";

interface ShopCategory {
  id: string;
  name: string;
}

interface ShopProduct {
  id: string;
  name: string;
  image: string | null;
  imagePublicId: string | null;
  unit: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  isNewArrival: boolean;
  isDeal: boolean;
  order: number;
  isActive: boolean;
  link: string | null;
  categoryId: string | null;
  category: ShopCategory | null;
}

const emptyForm = {
  id: "",
  name: "",
  image: "" as string | null,
  imagePublicId: "" as string | null,
  unit: "",
  price: "" as string | number,
  originalPrice: "" as string | number,
  badge: "",
  isNewArrival: false,
  isDeal: false,
  order: 0,
  isActive: true,
  link: "",
  categoryId: "",
};

export default function ShopProductsPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
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
      const [prodRes, catRes] = await Promise.all([
        api.get("/shop-products"),
        api.get("/shop-categories"),
      ]);
      setProducts(prodRes.data.data ?? []);
      setCategories(catRes.data.data ?? []);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load shop products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: ShopProduct) => {
    setForm({
      id: p.id,
      name: p.name,
      image: p.image,
      imagePublicId: p.imagePublicId,
      unit: p.unit || "",
      price: p.price,
      originalPrice: p.originalPrice ?? "",
      badge: p.badge || "",
      isNewArrival: p.isNewArrival,
      isDeal: p.isDeal,
      order: p.order,
      isActive: p.isActive,
      link: p.link || "",
      categoryId: p.categoryId || "",
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
    if (form.price === "" || isNaN(Number(form.price))) return showToast("Price is required");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        image: form.image,
        imagePublicId: form.imagePublicId,
        unit: form.unit.trim() || null,
        price: Number(form.price),
        originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
        badge: form.badge.trim() || null,
        isNewArrival: form.isNewArrival,
        isDeal: form.isDeal,
        order: form.order,
        isActive: form.isActive,
        link: form.link.trim() || null,
        categoryId: form.categoryId || null,
      };
      if (form.id) {
        await api.put(`/shop-products/${form.id}`, payload);
      } else {
        await api.post("/shop-products", payload);
      }
      showToast("Saved!");
      setModalOpen(false);
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/shop-products/${id}`);
      showToast("Deleted");
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete product");
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        .sp-page { padding: 24px; max-width: 1200px; }
        .sp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .sp-title { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 700; color: #111418; margin: 0; }
        .sp-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .sp-toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
        .sp-search { flex: 1; padding: 8px 12px; border: 1px solid #e2e4e8; border-radius: 7px; font-size: 13px; outline: none; }
        .sp-search:focus { border-color: #00C8E0; }
        .sp-table-wrap { background: #fff; border: 1px solid #e8eaed; border-radius: 10px; overflow: hidden; overflow-x: auto; }
        table.sp-table { width: 100%; border-collapse: collapse; }
        .sp-table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 600; padding: 10px 14px; border-bottom: 1px solid #f0f2f4; background: #f8f9fb; white-space: nowrap; }
        .sp-table td { padding: 10px 14px; font-size: 13px; color: #111418; border-bottom: 1px solid #f4f5f7; vertical-align: middle; white-space: nowrap; }
        .sp-thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; background: #f0f2f4; display: block; }
        .sp-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
        .sp-badge.active { background: #dcfce7; color: #16a34a; }
        .sp-badge.inactive { background: #f3f4f6; color: #6b7280; }
        .sp-tag { font-size: 10px; padding: 2px 7px; border-radius: 10px; background: #fef3c7; color: #b45309; font-weight: 600; }
        .sp-price-orig { text-decoration: line-through; color: #9ca3af; font-size: 11px; margin-left: 6px; }
        .sp-actions { display: flex; gap: 6px; }
        .sp-icon-btn { background: #f0f2f4; border: none; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 13px; }
        .sp-icon-btn:hover { background: #e2e4e8; }
        .sp-icon-btn.danger:hover { background: #fee2e2; }
        .btn-cyan { background: #00C8E0; color: #15202e; border: none; border-radius: 7px; padding: 9px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }
        .btn-cyan:hover { background: #00afc6; }
        .btn-ghost { background: transparent; color: #374151; border: 1px solid #e2e4e8; border-radius: 7px; padding: 8px 14px; font-size: 12px; font-weight: 500; cursor: pointer; }
        .btn-ghost:hover { border-color: #00C8E0; color: #00C8E0; }
        .sp-modal-overlay { position: fixed; inset: 0; background: rgba(17,20,24,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
        .sp-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
        .sp-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid #f0f2f4; }
        .sp-modal-title { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; color: #111418; }
        .sp-modal-close { background: #f0f2f4; border: none; border-radius: 6px; width: 28px; height: 28px; font-size: 16px; cursor: pointer; color: #6b7280; }
        .sp-modal-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
        .sp-field-label { font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; display: block; }
        .sp-input, .sp-select { width: 100%; padding: 8px 11px; border: 1px solid #e2e4e8; border-radius: 7px; font-size: 13px; outline: none; box-sizing: border-box; background: #fff; }
        .sp-input:focus, .sp-select:focus { border-color: #00C8E0; }
        .sp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sp-upload-zone { border: 1.5px dashed #d1d5db; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; text-align: center; }
        .sp-upload-zone:hover, .sp-upload-zone.drag { border-color: #00C8E0; background: #f0fcfe; }
        .sp-preview-wrap { position: relative; border-radius: 10px; overflow: hidden; border: 1px solid #e2e4e8; }
        .sp-preview-img { width: 100%; height: 140px; object-fit: cover; display: block; }
        .sp-remove-btn { position: absolute; top: 8px; right: 8px; background: rgba(17,20,24,0.75); color: #fff; border: none; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; }
        .sp-toggle-row { display: flex; align-items: center; justify-content: space-between; }
        .sp-ttrack { position: relative; width: 32px; height: 18px; border-radius: 9px; background: #d1d5db; cursor: pointer; border: none; }
        .sp-ttrack.on { background: #00C8E0; }
        .sp-tknob { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
        .sp-ttrack.on .sp-tknob { transform: translateX(14px); }
        .sp-modal-footer { padding: 14px 18px; border-top: 1px solid #f0f2f4; display: flex; justify-content: flex-end; gap: 8px; }
        .sp-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #111418; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; z-index: 1100; }
        .sp-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }
      `}</style>

      <div className="sp-page">
        <div className="sp-header">
          <div>
            <h1 className="sp-title">Shop Products</h1>
            <div className="sp-sub">Products shown in the "Shop with us" page — New Arrivals, Offers & Deals.</div>
          </div>
          <button className="btn-cyan" onClick={openCreate}>+ New Product</button>
        </div>

        <div className="sp-toolbar">
          <input className="sp-search" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Badge</th>
                <th>Flags</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>{p.image ? <img src={p.image} className="sp-thumb" /> : <div className="sp-thumb" />}</td>
                  <td>{p.name}</td>
                  <td style={{ color: "#6b7280" }}>{p.category?.name || "—"}</td>
                  <td>
                    ${p.price.toFixed(2)}
                    {p.originalPrice && <span className="sp-price-orig">${p.originalPrice.toFixed(2)}</span>}
                  </td>
                  <td>{p.badge ? <span className="sp-tag">{p.badge}</span> : "—"}</td>
                  <td style={{ fontSize: 11, color: "#6b7280" }}>
                    {[p.isNewArrival && "New", p.isDeal && "Deal"].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td><span className={`sp-badge ${p.isActive ? "active" : "inactive"}`}>{p.isActive ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div className="sp-actions">
                      <button className="sp-icon-btn" onClick={() => openEdit(p)}>✎</button>
                      <button className="sp-icon-btn danger" onClick={() => handleDelete(p.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="sp-empty">No shop products yet — create one to get started.</div>}
        </div>
      </div>

      {modalOpen && (
        <div className="sp-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <div className="sp-modal-header">
              <span className="sp-modal-title">{form.id ? "Edit product" : "New product"}</span>
              <button className="sp-modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="sp-modal-body">
              <div>
                <label className="sp-field-label">Name *</label>
                <input className="sp-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Organic Avocado" />
              </div>

              <div>
                <label className="sp-field-label">Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
                {form.image ? (
                  <div className="sp-preview-wrap">
                    <img src={form.image} className="sp-preview-img" />
                    <button className="sp-remove-btn" onClick={() => setForm(f => ({ ...f, image: "", imagePublicId: "" }))}>×</button>
                  </div>
                ) : (
                  <div
                    className={`sp-upload-zone ${dragActive ? "drag" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
                  >
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{uploading ? "Uploading…" : "Drag & drop or click to upload"}</div>
                  </div>
                )}
              </div>

              <div className="sp-row2">
                <div>
                  <label className="sp-field-label">Price *</label>
                  <input className="sp-input" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="24.00" />
                </div>
                <div>
                  <label className="sp-field-label">Original price</label>
                  <input className="sp-input" type="number" step="0.01" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="Optional — for strikethrough" />
                </div>
              </div>

              <div className="sp-row2">
                <div>
                  <label className="sp-field-label">Unit</label>
                  <input className="sp-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. 1000gm, 4pc" />
                </div>
                <div>
                  <label className="sp-field-label">Badge</label>
                  <input className="sp-input" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. Best Sale, 20% OFF" />
                </div>
              </div>

              <div>
                <label className="sp-field-label">Category</label>
                <select className="sp-select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="sp-field-label">External link</label>
                <input className="sp-input" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="Where the tile sends visitors (optional)" />
              </div>

              <div>
                <label className="sp-field-label">Display order</label>
                <input className="sp-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
              </div>

              <div className="sp-toggle-row">
                <span style={{ fontSize: 12, color: "#374151" }}>Show in "New Arrivals"</span>
                <button className={`sp-ttrack ${form.isNewArrival ? "on" : ""}`} onClick={() => setForm(f => ({ ...f, isNewArrival: !f.isNewArrival }))}>
                  <div className="sp-tknob" />
                </button>
              </div>
              <div className="sp-toggle-row">
                <span style={{ fontSize: 12, color: "#374151" }}>Show in "Offers & Deals"</span>
                <button className={`sp-ttrack ${form.isDeal ? "on" : ""}`} onClick={() => setForm(f => ({ ...f, isDeal: !f.isDeal }))}>
                  <div className="sp-tknob" />
                </button>
              </div>
              <div className="sp-toggle-row">
                <span style={{ fontSize: 12, color: "#374151" }}>Active (visible on site)</span>
                <button className={`sp-ttrack ${form.isActive ? "on" : ""}`} onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                  <div className="sp-tknob" />
                </button>
              </div>
            </div>
            <div className="sp-modal-footer">
              <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-cyan" onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sp-toast">{toast}</div>}
    </>
  );
}