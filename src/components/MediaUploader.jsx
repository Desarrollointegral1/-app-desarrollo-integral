import { useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { S } from "../utils/theme.js";

// ── MEDIA UPLOADER ────────────────────────────────────────────────────
function MediaUploader({ media, onMedia }) {
  const fileRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      window.alert("Max 8MB. Para videos largos usá YouTube.");
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => onMedia(ev.target.result);
    r.readAsDataURL(f);
  };
  return (
    <div>
      {" "}
      <div
        onClick={() => fileRef.current.click()}
        style={{
          background: S.card2,
          border: "2px dashed " + S.border,
          borderRadius: 8,
          padding: 14,
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 6,
        }}
      >
        {" "}
        {media ? (
          media.startsWith("data:video") ? (
            <video src={media} style={{ maxWidth: "100%", maxHeight: 120, borderRadius: 6 }} controls />
          ) : (
            <img
              src={media}
              alt=""
              style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 6 }}
            />
          )
        ) : (
          <div style={{ color: S.lgray, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Paperclip size={13} />Foto o video corto (max 8MB)</div>
        )}{" "}
      </div>{" "}
      <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />{" "}
      {media && (
        <button
          onClick={() => onMedia("")}
          style={{
            background: "transparent",
            color: S.red,
            border: "1px solid " + S.red,
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><X size={13} />Quitar</span>
        </button>
      )}{" "}
    </div>
  );
}
