// src/lib/imagekitUpload.ts
import { auth } from "@/lib/firebase";

export type ImageKitScope = "question-bank" | "website";

type ImageKitAuthParams = {
  token: string;
  expire: number;
  signature: string;
};

function getIdToken(forceRefresh: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    // onAuthStateChanged ensures we wait for Firebase to initialize on app launch
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe(); // Prevent memory leaks and duplicate calls
      
      if (!user) {
        console.error("[getIdToken] User not logged in");
        return reject(new Error("Not logged in - please sign in first"));
      }
      
      try {
        // Defaults to cached token unless forceRefresh is explicitly true
        const token = await user.getIdToken(forceRefresh); 
        console.log(`[getIdToken] Token obtained (length: ${token.length})`);
        resolve(token);
      } catch (e: any) {
        console.error("[getIdToken] Failed to get token:", e?.message);
        reject(new Error(`Failed to get auth token: ${e?.message}`));
      }
    });
  });
}

export async function uploadToImageKit(
  file: Blob,
  fileName: string,
  folder = "/question-bank",
  scope: ImageKitScope = "question-bank"
) {
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string;
  if (!publicKey) throw new Error("Missing VITE_IMAGEKIT_PUBLIC_KEY");

  const idToken = await getIdToken();

  async function fetchAuthParams(authScope: ImageKitScope): Promise<ImageKitAuthParams> {
    const url = `/api/imagekit-auth?scope=${encodeURIComponent(authScope)}`;
    console.log(`[uploadToImageKit] Requesting auth from: ${url}`);

    const authRes = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${idToken}` },
    });

    const rawText = await authRes.text();
    console.log(`[uploadToImageKit] Auth response status (${authScope}): ${authRes.status}`);
    console.log(`[uploadToImageKit] Auth response headers (${authScope}):`, {
      contentType: authRes.headers.get("content-type"),
      contentLength: authRes.headers.get("content-length"),
    });

    if (!authRes.ok) {
      let parsedError = rawText;
      try {
        const json = JSON.parse(rawText);
        parsedError = String(json?.error || rawText);
      } catch {
        // Keep raw response text when it is not JSON.
      }

      const shortError = parsedError.length > 250 ? `${parsedError.substring(0, 250)}...` : parsedError;
      throw new Error(`ImageKit auth failed (${authScope}) [${authRes.status}]: ${shortError}`);
    }

    console.log(`[uploadToImageKit] Auth response (${authScope}, first 200 chars):`, rawText.substring(0, 200));
    let parsed: ImageKitAuthParams;
    try {
      parsed = JSON.parse(rawText) as ImageKitAuthParams;
    } catch (parseErr: any) {
      const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      throw new Error(`Invalid auth response format (${authScope}): ${parseMsg}`);
    }

    if (!parsed?.token || !parsed?.signature || typeof parsed?.expire !== "number") {
      throw new Error(`Invalid auth payload (${authScope}): missing token/signature/expire`);
    }

    console.log(`[uploadToImageKit] ✅ Auth params received successfully (${authScope})`);
    return parsed;
  }

  let authParams: ImageKitAuthParams;
  try {
    authParams = await fetchAuthParams(scope);
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    const shouldFallback =
      scope === "question-bank" &&
      (msg.includes("[403]") || msg.toLowerCase().includes("forbidden"));

    if (!shouldFallback) {
      throw err;
    }

    // Some educator paths may still call the default scope; retry with educator-allowed scope.
    console.warn("[uploadToImageKit] question-bank scope forbidden; retrying with website scope");
    authParams = await fetchAuthParams("website");
  }

  const { token, expire, signature } = authParams;

  const form = new FormData();
  form.append("file", file);
  form.append("fileName", fileName);
  form.append("publicKey", publicKey);
  form.append("signature", signature);
  form.append("expire", String(expire));
  form.append("token", token);
  form.append("folder", folder);
  form.append("useUniqueFileName", "true");

  console.log("[uploadToImageKit] Uploading to ImageKit...");
  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: form,
  });

  if (!uploadRes.ok) {
    const txt = await uploadRes.text().catch(() => "");
    console.error(`[uploadToImageKit] Upload failed (${uploadRes.status}):`, txt.substring(0, 300));
    throw new Error(`ImageKit upload failed: ${uploadRes.status}`);
  }

  const json = await uploadRes.json();
  console.log("[uploadToImageKit] ✅ Upload successful:", json.url);

  return {
    url: json.url as string,
    fileId: json.fileId as string,
    name: json.name as string,
  };
}
