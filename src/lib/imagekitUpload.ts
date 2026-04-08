// src/lib/imagekitUpload.ts
import { auth } from "@/lib/firebase";

export type ImageKitScope = "question-bank" | "website";

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

  // IMPORTANT: Fetch fresh auth params for every upload
  const url = `/api/imagekit-auth?scope=${encodeURIComponent(scope)}`;
  console.log(`[uploadToImageKit] Requesting auth from: ${url}`);
  
  const authRes = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  console.log(`[uploadToImageKit] Auth response status: ${authRes.status}`);
  console.log(`[uploadToImageKit] Auth response headers:`, {
    contentType: authRes.headers.get("content-type"),
    contentLength: authRes.headers.get("content-length"),
  });

  if (!authRes.ok) {
    let errorText = "";
    try {
      errorText = await authRes.text();
      console.error(`[uploadToImageKit] Auth error response text (${authRes.status}):`, errorText);
      
      // Try to parse as JSON first
      try {
        const json = JSON.parse(errorText);
        throw new Error(`ImageKit auth failed: ${json.error || errorText}`);
      } catch (jsonErr) {
        // If not JSON, throw the raw text
        if (errorText.length > 500) {
          throw new Error(`ImageKit auth failed: ${authRes.status} - ${errorText.substring(0, 200)}...`);
        } else {
          throw new Error(`ImageKit auth failed: ${authRes.status} - ${errorText}`);
        }
      }
    } catch (e: any) {
      // If we couldn't even read the response, give generic error
      throw new Error(`ImageKit auth failed: ${authRes.status} ${authRes.statusText} (check server logs)`);
    }
  }

  let authParams;
  try {
    const rawText = await authRes.text();
    console.log(`[uploadToImageKit] Auth response (first 200 chars):`, rawText.substring(0, 200));
    
    authParams = JSON.parse(rawText) as {
      token: string;
      expire: number;
      signature: string;
    };
    
    console.log(`[uploadToImageKit] ✅ Auth params received successfully`);
  } catch (parseErr: any) {
    const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error("[uploadToImageKit] Failed to parse auth response:", parseMsg);
    console.error("[uploadToImageKit] Response was:", await authRes.clone().text());
    throw new Error(`Invalid auth response format: ${parseMsg}`);
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
