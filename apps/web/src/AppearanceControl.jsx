import { useEffect, useRef, useState, useId, useSyncExternalStore } from "react";
import { Moon, Sun, Desktop } from "@phosphor-icons/react";
import "./websiteAppearance.js";
import "./appearance-control.css";
import { withAppearance } from "./appearanceLink.js";

export function AppearanceLink({ href, ...props }) {
  const { preference } = useWebsiteAppearance();
  return <a {...props} href={withAppearance(href, preference)} />;
}

export function useWebsiteAppearance() {
  const store = window.rilloraWebsiteAppearance;
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
export function ThemePicture({ light, dark, className, ...imageProps }) {
  const { resolved } = useWebsiteAppearance();
  return (
    <picture className={className}>
      <source media={resolved === "dark" ? "all" : "not all"} srcSet={dark} />
      <img src={light} {...imageProps} />
    </picture>
  );
}
const options = [
  { value: "system", label: "System", Icon: Desktop },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];
export function AppearanceControl({ open, onOpenChange, informationURL = "/legal#appearance" }) {
  const id = useId();
  const { preference, resolved, persistenceAvailable } = useWebsiteAppearance();
  const root = useRef(null),
    trigger = useRef(null);
  const Icon = resolved === "dark" ? Moon : Sun;
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!root.current?.contains(event.target)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    root.current?.querySelector("input:checked")?.focus();
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open, onOpenChange]);
  return (
    <div
      className="lp-appearance"
      ref={root}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          onOpenChange(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          onOpenChange(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="lp-appearance-trigger"
        type="button"
        aria-label={`Appearance: ${preference}`}
        aria-expanded={open}
        aria-controls={id}
        title="Change appearance"
        onClick={() => onOpenChange(!open)}
      >
        <Icon size={22} aria-hidden="true" />
        <span>Appearance</span>
      </button>
      {open && (
        <div className="lp-appearance-options" id={id}>
          <fieldset>
            <legend>Appearance</legend>
            {options.map(({ value, label, Icon: OptionIcon }) => (
              <label key={value}>
                <input
                  type="radio"
                  name={id}
                  value={value}
                  checked={preference === value}
                  onChange={() =>
                    window.rilloraWebsiteAppearance.setPreference(value)
                  }
                />
                <OptionIcon size={19} aria-hidden="true" />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <p>
            {persistenceAvailable
              ? "Light or Dark is saved on this device. System clears that choice."
              : "Changed for this page. Browser storage is unavailable."}
          </p>
          <a href={informationURL}>About this setting</a>
        </div>
      )}
    </div>
  );
}

export function AppAppearanceControl() {
  const [open, setOpen] = useState(false);
  return <div className="app-appearance"><AppearanceControl open={open} onOpenChange={setOpen} informationURL="https://www.rillora.xyz/legal#appearance" /></div>;
}
