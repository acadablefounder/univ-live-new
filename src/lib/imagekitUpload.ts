// src/lib/imagekitUpload.ts
import { auth } from "@/lib/firebase";

async function getIdToken(): Promise<string | null> {
  try {
    const u = auth.currentUser;
    if (!u) return null;
    return await u.getIdToken();
  } catch {
    return null;
  }
}

// Cache auth params to avoid calling /api/imagekit-auth for every single upload (bulk ZIP imports)
let cachedAuth: { token: string; expire: number; signature: string } | null = null;

export async function uploadToImageKit(file: Blob, fileName: string, folder = "/question-bank") {
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string;

  if (!publicKey) throw new Error("Missing VITE_IMAGEKIT_PUBLIC_KEY");

  // 1) get signature from backend (protected by Firebase auth)
  const nowSec = Math.floor(Date.now() / 1000);
  const auth =
    cachedAuth && cachedAuth.expire - nowSec > 30
      ? cachedAuth
      : await (async () => {
          const token = await getIdToken();
          const authRes = await fetch("/api/imagekit-auth", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!authRes.ok) throw new Error("Failed to get ImageKit auth");
          const fresh = (await authRes.json()) as { token: string; expire: number; signature: string };
          cachedAuth = fresh;
          return fresh;
        })();

  // 2) upload to ImageKit
  const form = new FormData();
  form.append("file", file);
  form.append("fileName", fileName);
  form.append("publicKey", publicKey);
  form.append("signature", auth.signature);
  form.append("expire", String(auth.expire));
  form.append("token", auth.token);
  form.append("folder", folder);
  form.append("useUniqueFileName", "true");

  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: form,
  });

  if (!uploadRes.ok) {
    const txt = await uploadRes.text().catch(() => "");
    throw new Error(`ImageKit upload failed: ${uploadRes.status} ${txt}`);
  }

  const json = await uploadRes.json();

  return {
    url: json.url as string,
    fileId: json.fileId as string,
    name: json.name as string,
  };
}
