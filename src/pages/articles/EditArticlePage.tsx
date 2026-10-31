/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/axios";
import ArticleEditor from "../../components/ArticleEditor";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/articles/${id}`);
        const a = res.data.data?.article ?? res.data.data;
        if (!a) throw new Error("Article not found");
        if (!cancelled) {
          setArticle(a);
          setError("");
        }
      } catch (err: any) {
        if (!cancelled) {
          setArticle(null);
          setError(err.response?.data?.message || "Could not load this article.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const update = async (payload: any) => {
    try {
      await api.put(`/articles/${id}`, payload);
    } catch (e: any) {
      // Fall back to PATCH if the API exposes updates that way
      if ([404, 405].includes(e.response?.status)) await api.patch(`/articles/${id}`, payload);
      else throw e;
    }
  };

  const remove = async () => {
    await api.delete(`/articles/${id}`);
    navigate("/dashboard/articles");
  };

  if (error || !article) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 14, color: "var(--c-muted, #6b7280)" }}>
        {error ? (
          <>
            <div style={{ color: "var(--c-danger, #dc2626)" }}>{error}</div>
            <button
              type="button"
              onClick={() => navigate("/dashboard/articles")}
              style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--c-border-strong, #e2e4e8)", background: "transparent", color: "inherit", cursor: "pointer" }}
            >
              ← Back to articles
            </button>
          </>
        ) : (
          "Loading article…"
        )}
      </div>
    );
  }

  // key forces a fresh editor if the route switches to another article
  return <ArticleEditor key={article.id ?? id} mode="edit" initial={article} onSubmit={update} onDelete={remove} />;
}