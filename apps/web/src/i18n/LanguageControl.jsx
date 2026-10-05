import { useId } from "react";
import { Translate } from "@phosphor-icons/react";
import { useI18n } from "./I18nProvider.jsx";
import "./i18n.css";

export function LanguageControl({ className = "" }) {
  const id = useId();
  const { locale, setLocale, t, persistenceAvailable } = useI18n();
  return <div className={`language-control ${className}`}>
    <label htmlFor={id} className="sr-only">{t("common.language.label")}</label>
    <Translate size={19} aria-hidden="true" />
    <select id={id} value={locale} onChange={(event) => setLocale(event.target.value)}
      aria-describedby={persistenceAvailable ? undefined : `${id}-status`}>
      <option value="en" lang="en">English</option>
      <option value="zh-CN" lang="zh-CN">简体中文</option>
    </select>
    {!persistenceAvailable && <span id={`${id}-status`} className="sr-only" role="status">{t("common.language.temporary")}</span>}
  </div>;
}
