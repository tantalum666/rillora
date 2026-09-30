import logo from "./assets/brand/lockup-reversed.svg";
import lightLogo from "./assets/brand/lockup-primary.svg";
import fontLicenses from "./assets/font-licenses.txt?url";
import "./brand.css";

export function RilloraBrand({ compact = false, decorative = false }) {
  return <span className="rillora-brand-pair">
    <img
    className={`rillora-brand rillora-brand-dark${compact ? " rillora-brand--compact" : ""}`}
    src={logo}
    width="870"
    height="208"
    alt={decorative ? "" : "Rillora"}
    aria-hidden={decorative || undefined}
    data-font-license={fontLicenses}
    draggable="false"
  />
    <img className={`rillora-brand rillora-brand-light${compact ? " rillora-brand--compact" : ""}`}
      src={lightLogo} width="870" height="208" alt={decorative ? "" : "Rillora"}
      aria-hidden={decorative || undefined} data-font-license={fontLicenses} draggable="false" />
  </span>;
}
