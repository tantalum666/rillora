import { useId } from "react";
import { Translate } from "@phosphor-icons/react";
import { useI18n } from "./I18nProvider.jsx";
import "./i18n.css";

export function LanguageControl({ className = "", compact = false, showPersistenceStatus = true }) {
  const id = useId();
  const { locale, setLocale, t, persistenceAvailable } = useI18n();
  return <div className={`language-control ${className}${compact ? " language-control-compact" : ""}`}>
    <label htmlFor={id} className="sr-only">{t("common.language.label")}</label>
    <Translate size={19} aria-hidden="true" />
    {compact && <span className="language-control-current" aria-hidden="true">{locale === "zh-CN" ? "中" : "EN"}</span>}
    <select id={id} value={locale} onChange={(event) => setLocale(event.target.value)}
      aria-describedby={persistenceAvailable || !showPersistenceStatus ? undefined : `${id}-status`}>
      <option value="en">{t("common.language.english")}</option>
      <option value="zh-CN">{t("common.language.chinese")}</option>
    </select>
    {!persistenceAvailable && showPersistenceStatus && <span id={`${id}-status`} className="sr-only" role="status">{t("common.language.temporary")}</span>}
  </div>;
}
