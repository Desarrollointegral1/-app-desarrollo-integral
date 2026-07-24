import { useState, useEffect } from "react";
import { getSignedUrl } from "../../services/supabase.js";

// Resuelve on-demand un PATH de Storage (bucket privado) a signed URL.
// Si `value` ya es renderizable tal cual — URL externa/YouTube (http) o foto
// embebida (data:) — lo devuelve sin tocar la red. Las signed URLs expiran, por
// eso se resuelven acá en runtime y nunca se persisten en la base.
export function useSignedUrl(bucket, value) {
  const listo = !value || /^(https?:|data:)/i.test(value);
  const [url, setUrl] = useState(listo ? value || null : null);
  useEffect(() => {
    let vivo = true;
    if (!value || /^(https?:|data:)/i.test(value)) { setUrl(value || null); return; }
    getSignedUrl(bucket, value).then((u) => { if (vivo) setUrl(u); });
    return () => { vivo = false; };
  }, [bucket, value]);
  return url;
}
