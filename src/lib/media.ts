import api from "./axios";

export type MediaType = "image" | "video";

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  type: MediaType;
  sizeKb: number;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
  articles: { id: string; title: string }[];
}

export type SortOption = "newest" | "oldest" | "largest" | "smallest";
export type TypeFilter = "all" | "image" | "video";

export async function fetchMedia(params: {
  search?: string;
  type?: TypeFilter;
  sort?: SortOption;
}): Promise<MediaAsset[]> {
  const res = await api.get("/media", {
    params: {
      search: params.search || undefined,
      type: params.type && params.type !== "all" ? params.type : undefined,
      sort: params.sort,
    },
  });
  return res.data.data ?? res.data;
}

export async function deleteMedia(id: string): Promise<void> {
  await api.delete(`/media/${id}`);
}

export async function deleteMediaBulk(ids: string[]): Promise<void> {
  await api.delete(`/media/bulk`, { data: { ids } });
}

export async function uploadMedia(file: File): Promise<MediaAsset> {
  const sizeKb = Math.round(file.size / 1024);

  const presignRes = await api.post("/media/presign", {
    filename: file.name,
    contentType: file.type,
    sizeKb,
  });
  const { uploadUrl, key } = presignRes.data.data ?? presignRes.data;

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload to storage failed (${putRes.status})`);
  }

  const confirmRes = await api.post("/media", {
    key,
    filename: file.name,
    contentType: file.type,
    sizeKb,
  });
  return confirmRes.data.data ?? confirmRes.data;
}