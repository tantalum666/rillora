import { useEffect, useState } from "react";
import { useI18n } from "./i18n/I18nProvider.jsx";

export function InvitationQr({ value }) {
  const { t } = useI18n();
  const [image, setImage] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true; setImage(""); setFailed(false);
    import("qrcode").then((module) => module.default.toDataURL(value, { width: 280, margin: 2, errorCorrectionLevel: "M" }))
      .then((url) => { if (active) setImage(url); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [value]);
  return <div className="invitation-qr">{image ? <img src={image} width="280" height="280" alt={t("sharing.qr.alt")} /> : <span role="status">{failed ? t("sharing.qr.fallback") : t("sharing.qr.preparing")}</span>}</div>;
}
