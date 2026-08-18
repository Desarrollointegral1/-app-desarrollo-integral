// Movido textualmente desde EstudioBio.jsx (refactor 2026-08-18): mismo código,
// solo cambió de archivo. EstudioBio.jsx conserva EstudioBioSeccion (la sección completa).
import { S } from "../../utils/theme.js";
import { useSignedUrl } from "../../utils/useSignedUrl.js";
import { BIO_BUCKET } from "./helpers.js";

// Foto de un estudio: archivo_url guarda el PATH del objeto (bucket privado),
// se resuelve a signed URL on-demand. Datos viejos (http/data) pasan tal cual.
export function BioFoto({ bio }) {
  const url = useSignedUrl(BIO_BUCKET, bio.archivo_url);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 10 }}>
      {/* 2026-08-12 — Lucas: "las fotos que subi de bioimpedancia anterior
          quedo mal". No era la subida ni la rotación: los estudios son
          imágenes VERTICALES (los dos que hay son de 1024×1536) y acá se
          mostraban con objectFit:"cover" dentro de una franja de 220px de
          alto — o sea, un recorte de la mitad del medio, sin el título, sin
          la fecha y sin los números. Con "contain" se ve el estudio entero;
          el alto sube a 420 para que los números se lean sin abrir nada. */}
      <img
        src={url}
        alt={bio.nombre_archivo || "foto estudio"}
        style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 8, background: S.card2 }}
        onError={(e) => { e.target.outerHTML = `<div style="color:#8a8a8a;font-size:11px">${bio.nombre_archivo || "archivo adjunto"}</div>`; }}
      />
      <div style={{ color: S.gray, fontSize: 10, textAlign: "center", marginTop: 4 }}>Tocá la foto para verla en grande</div>
    </a>
  );
}
