"use client";
import Image from "next/image";
import { useState } from "react";
import { createCatalogUploadTarget } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { validateCatalogMedia } from "@/lib/catalog-media";

export function SiteAssetUpload({ label, value, preview, onChange }: { label: string; value: string; preview: boolean; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  return <div><label>{label}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={preview || uploading} onChange={async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const error = validateCatalogMedia("image", file.type, file.size);
    if (error) { setMessage(error); return; }
    setUploading(true); setMessage("");
    try {
      const target = await createCatalogUploadTarget({ kind: "image", mimeType: file.type, size: file.size });
      if (!target.ok) throw new Error(target.error);
      const result = await createClient().storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
      if (result.error) throw new Error("The image upload failed. Try again.");
      onChange(target.publicUrl); setMessage("Image uploaded. Save website settings to apply it.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Upload was not confirmed."); }
    finally { setUploading(false); }
  }} /></label>{preview ? <p className="pi-admin-help">Uploads are disabled in this isolated preview. You can try an existing image path above.</p> : null}{uploading ? <p role="status">Uploading…</p> : null}{message ? <p role="status">{message}</p> : null}{value ? <Image src={value} alt={`${label} preview`} width={180} height={80} unoptimized style={{ width: "auto", height: 80, maxWidth: "100%", objectFit: "contain" }} /> : null}</div>;
}
