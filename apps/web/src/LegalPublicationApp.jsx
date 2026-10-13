import { RilloraBrand } from "./RilloraBrand.jsx";
import { useEffect } from "react";
import { LegalDocumentPage } from "./LegalDocumentPage.jsx";
import { publicRoutes, resolvePublicView } from "./publicRoutes.js";
import "./public-experience.css";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { LanguageControl } from "./i18n/LanguageControl.jsx";
import { withLocalePath } from "./i18n/localeStore.js";

const publicHomeUrl = import.meta.env.VITE_PUBLIC_HOME_URL?.trim()
  || "https://rillora.xyz/";

const legalLinks = Object.freeze([
  ["Terms", "服务条款", publicRoutes.terms],
  ["Privacy", "隐私政策", publicRoutes.privacy],
  ["Subscriptions", "订阅条款", publicRoutes.subscriptions],
  ["Refunds", "退款与取消", publicRoutes.refunds],
  ["Acceptable Use", "可接受使用政策", publicRoutes.acceptableUse],
  ["Cookies", "浏览器存储声明", publicRoutes.cookies],
  ["Legal Notice", "法律声明", publicRoutes.legalNotice],
]);

const legalViews = new Set([
  "privacy",
  "terms",
  "subscriptions",
  "refunds",
  "acceptableUse",
  "cookies",
  "legalNotice",
]);

const titles = Object.freeze({
  privacy: "Privacy Policy — Rillora",
  terms: "Terms of Service — Rillora",
  subscriptions: "Subscription Terms — Rillora",
  refunds: "Refund & Cancellation — Rillora",
  acceptableUse: "Acceptable Use — Rillora",
  cookies: "Cookie Notice — Rillora",
  legalNotice: "Legal Notice — Rillora",
});

function resolveLegalView(pathname) {
  const view = resolvePublicView(pathname);
  return legalViews.has(view) ? view : "terms";
}

export function LegalPublicationApp() {
  const { locale } = useI18n();
  const chinese = locale === "zh-CN";
  const documentKey = resolveLegalView(window.location.pathname);
  const link = path => withLocalePath(path, locale, locale);
  const home = new URL(publicHomeUrl);
  home.searchParams.set("lang", locale);

  useEffect(() => {
    document.title = chinese ? `${legalLinks.find(([, , path]) => path === publicRoutes[documentKey])?.[1] ?? "法律文件"} — Rillora` : titles[documentKey];
    document.documentElement.lang = locale;
  }, [documentKey, chinese, locale]);

  return (
    <div className="public-shell public-shell-legal-publication">
      <header className="public-header">
        <a className="public-wordmark" href={home.href} aria-label={chinese ? "Rillora 首页" : "Rillora home"}><RilloraBrand decorative /></a>
        <nav aria-label={chinese ? "主要法律页面" : "Primary legal pages"}>
          <a aria-current={documentKey === "terms" ? "page" : undefined} href={link(publicRoutes.terms)}>{chinese ? "服务条款" : "Terms"}</a>
          <a aria-current={documentKey === "privacy" ? "page" : undefined} href={link(publicRoutes.privacy)}>{chinese ? "隐私政策" : "Privacy"}</a>
          <a aria-current={documentKey === "legalNotice" ? "page" : undefined} href={link(publicRoutes.legalNotice)}>{chinese ? "法律声明" : "Legal"}</a>
        </nav>
        <LanguageControl compact showPersistenceStatus={false} />
      </header>

      <LegalDocumentPage
        documentKey={documentKey}
        onBack={() => window.location.assign(home.href)}
      />

      <footer className="public-footer">
        <span><RilloraBrand /></span>
        <p>{chinese ? "Rillora 法律文件" : "Rillora legal documents"}</p>
        <nav aria-label={chinese ? "全部法律文件" : "All legal documents"}>
          <a href={`https://www.rillora.xyz/legal/licenses?lang=${locale}`}>{chinese ? "第三方许可声明" : "Third-party notices"}</a>
          {legalLinks.map(([english, chineseLabel, href]) => (
            <a aria-current={window.location.pathname === href ? "page" : undefined} href={link(href)} key={href}>{chinese ? chineseLabel : english}</a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
