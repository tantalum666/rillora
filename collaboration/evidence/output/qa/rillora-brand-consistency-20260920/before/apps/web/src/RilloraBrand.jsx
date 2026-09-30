import logo from "./assets/brand/lockup-reversed.svg";
import smallLogo from "./assets/brand/lockup-small-reversed.svg";
import fontLicenses from "./assets/font-licenses.txt?url";
import "./brand.css";

export function RilloraBrand({ compact = false, decorative = false }) {
  return <img
    className={`rillora-brand${compact ? " rillora-brand--compact" : ""}`}
    src={compact ? smallLogo : logo}
    width="870"
    height="208"
    alt={decorative ? "" : "Rillora"}
    aria-hidden={decorative || undefined}
    data-font-license={fontLicenses}
    draggable="false"
  />;
}
