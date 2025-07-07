import { useState } from "react";
import { EXECUTE_API_UPLOAD_S3 } from "./utils";

type UploadResponse<T = any> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  upload: (file: File) => Promise<void>;
};

export function useImageUpload<T = any>(): UploadResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async (file: File) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Access token not found. Please log in.");
      }

      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch(EXECUTE_API_UPLOAD_S3, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, upload };
}
