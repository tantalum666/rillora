// Informational storage notice is versioned independently of the accepted
// registration/subscription bundle. Keep the c983dc26 source and receipts intact.
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { LegalDocumentPage as AcceptedLegalDocumentPage } from "./LegalDocumentPage.jsx";

const cookieSections = [
  {
    id: "cookie-necessary",
    title: "1. Strictly necessary technologies",
    content: <p>Rillora currently uses only storage that is necessary to provide a user-requested account or security function: an authentication-transaction cookie, an authenticated-session cookie, an anti-forgery cookie, tab-local draft recovery and deletion-reference values, and one local-storage value that remembers dismissal of the necessary-storage notice. Disabling or deleting the security cookies can prevent sign-in or private features from working. Deleting the notice value only causes the information notice to appear again.</p>,
  },
  {
    id: "cookie-details",
    title: "2. Current first-party storage details",
    content: (
      <ul>
        <li><strong>continuity_auth_tx:</strong> an HttpOnly authentication-transaction cookie used to bind a user-requested Auth0 redirect to its callback. The default maximum age is 10 minutes and it is cleared after callback or failure.</li>
        <li><strong>continuity_session:</strong> an HttpOnly authenticated-session cookie. When the trusted-session policy is available and your client and network can be verified, the maximum is 30 days, with expiry after 7 consecutive days without use. Earlier sessions and clients without that verification retain the shorter maximum of 8 hours and 30 minutes without use. Signing out or revocation ends access earlier. Unfamiliar networks require confirmation of the same account; ordinary IP changes within a previously confirmed network do not by themselves end the session.</li>
        <li><strong>continuity_csrf:</strong> an anti-forgery cookie available to the same-origin Rillora Web client so it can protect state-changing requests. It has the same current default browser maximum age as the session and is not sufficient by itself to authenticate a user.</li>
        <li><strong>rillora.matter-draft.v1:</strong> session storage scoped to a verified account, containing one unfinished matter form in the current browser tab. It is offered only after verifying the same account, expires after 24 hours and is cleared on save, explicit discard or sign out. Closing the tab or clearing browser storage removes the draft; some browsers may restore tab sessions.</li>
        <li><strong>rillora.deletion-reference.v1:</strong> session storage containing a random status-only reference for a deletion request. It cannot sign in or read a private map. Keep the downloadable reference to check later from another tab or device. The public status is available while deletion is pending and for 30 days after completion.</li>
        <li><strong>rillora.cookie-notice:</strong> local storage containing only the current notice-version identifier after the user selects “Got it”. It contains no account or private-map content and remains until cleared or superseded by a newer notice version.</li>
      </ul>
    ),
  },
  {
    id: "cookie-security",
    title: "3. Security attributes and scope",
    content: <p>Rillora cookies use the Secure attribute in production, SameSite=Lax, and a root path. Session and authentication-transaction cookies are HttpOnly. The anti-forgery cookie must be readable by the same-origin Web client for its security purpose. Cookie values are not written to product analytics or ordinary application logs. For trusted sessions, Rillora stores session-specific hashes of the client family and up to five confirmed country/network-provider combinations, not a raw IP address or browsing history. Sensitive actions still require recent identity confirmation. These necessary security checks do not create advertising profiles.</p>,
  },
  {
    id: "cookie-providers",
    title: "4. Provider technologies",
    content: <p>Auth0, Google, Apple, Stripe, or another user-selected provider may set its own cookies or device storage when its page opens for sign-in or payment. Its notice governs those technologies. Rillora does not use provider cookies for targeted advertising and does not load a provider sign-in or payment page merely because a visitor reads the public site.</p>,
  },
  {
    id: "cookie-analytics",
    title: "5. No advertising or behavioural analytics",
    content: <p>The current product has no advertising cookies, cross-site tracking, or third-party behavioural analytics SDK. Privacy-filtered first-party progress events are stored server-side under a fixed low-cardinality schema and do not contain private-map content. Rillora does not currently sell or share personal information for cross-context behavioural advertising.</p>,
  },
  {
    id: "cookie-choice",
    title: "6. Why the current notice is informational",
    content: <p>The current first-party technologies are limited to necessary security, authentication, session, user-requested draft recovery, deletion-status and notice-preference functions. The banner therefore says “Got it” rather than asking for consent that is not needed to provide those functions. It does not bundle consent to analytics or marketing. If Rillora later proposes optional analytics, advertising, or other non-essential storage, those technologies will remain disabled until a legally sufficient choice is available, including equally accessible rejection or withdrawal where required.</p>,
  },
  {
    id: "cookie-controls",
    title: "7. Browser controls and future changes",
    content: <p>You may clear cookies, session storage or local storage through your browser. Clearing draft storage removes unfinished text; clearing a deletion reference removes that device copy, so keep the downloadable reference if you need it. Clearing security cookies signs you out or interrupts authentication; clearing the notice value shows the notice again. Rillora will update this notice before introducing a new category or purpose, identify relevant third parties and durations, respect legally required opt-out preference signals, and obtain prior consent for non-essential storage where applicable.</p>,
  },
];

const cookieSectionsZH = [
  { id: "cookie-necessary", title: "1. 严格必要技术", content: <>
    <p>Rillora 目前只使用提供用户请求的账号／安全功能所必需的存储：认证事务 Cookie、已认证会话 Cookie、防伪 Cookie、当前标签页的草稿恢复与删除查询凭据，以及记住“必要存储提示已关闭”的本地存储值。禁用或删除安全 Cookie 可能阻止登录或私人功能；删除提示值只会让提示再次出现。</p>
  </> },
  { id: "cookie-details", title: "2. 当前第一方存储明细", content: <>
    <ul><li>continuity_auth_tx：HttpOnly认证事务 Cookie，把用户主动发起的 Auth0 跳转绑定到对应回调。默认最长10分钟，并在回调或失败后清除。</li><li>continuity_session：HttpOnly已认证会话 Cookie。可信会话策略已启用且客户端与网络可核验时，最长保持30天，连续7天未使用后失效。原有会话及无法完成该核验的客户端，仍采用最长8小时、连续30分钟未使用后失效的较短限制。退出或撤销会提前终止访问。使用陌生网络时需要确认同一账号；已确认网络内的普通IP变化不会单独导致退出。</li><li>continuity_csrf：同源 Rillora 网页客户端可读取的防请求伪造 Cookie，用于保护状态变更请求。当前默认浏览器时长与会话相同；它单独不能认证用户。</li><li>rillora.matter-draft.v1：会话存储，限定于已核验的同一账号，只包含当前浏览器标签页中一个未完成的事项表单。仅在确认同一账号后提供恢复，24小时后到期，并在保存、明确放弃或退出登录时清除。关闭标签页或清除浏览器存储会移除草稿；部分浏览器可能恢复之前的标签页会话。</li><li>rillora.deletion-reference.v1：会话存储，保存随机生成、仅用于查询删除请求进度的凭据。它不能登录或读取私人事项地图。请保留可下载的查询凭据，以便之后在其他标签页或设备上查询。删除进行期间及完成后30天内可以查询公开进度。</li><li>rillora.cookie-notice：本地存储，只保存用户点击“知道了”时对应的当前提示版本标识；不包含账号或私人事项地图内容，直到用户清除或新提示版本替代。</li></ul>
  </> },
  { id: "cookie-security", title: "3. 安全属性与范围", content: <>
    <p>生产环境的 Rillora Cookie 使用Secure、SameSite=Lax和根路径。会话与认证事务 Cookie 为HttpOnly。CSRF Cookie 因安全用途必须由同源网页客户端读取。Cookie 值不写入产品分析或普通应用日志。可信会话仅保存该会话专用的客户端类型哈希，以及最多五个已确认的国家／地区与网络运营商组合哈希，不保存原始IP地址或浏览历史。敏感操作仍需近期身份确认。这些必要安全检查不会建立广告画像。</p>
  </> },
  { id: "cookie-providers", title: "4. 服务提供商技术", content: <>
    <p>当你主动打开 Auth0、Google、Apple、Stripe 或其他服务提供商页面进行登录／付款时，该服务提供商可能设置自己的 Cookie 或设备存储，其提示管理这些技术。Rillora 不把服务提供商 Cookie 用于定向广告，也不会因为访客只阅读公开站就自动加载服务提供商登录／付款页面。</p>
  </> },
  { id: "cookie-analytics", title: "5. 无广告或行为分析", content: <>
    <p>当前产品没有广告 Cookie、跨站跟踪或第三方行为分析软件开发工具包。经过隐私过滤的第一方进度事件存储在服务端固定取值范围有限的数据结构中，不包含私人事项地图内容。Rillora 当前不出售或为跨场景行为广告共享个人信息。</p>
  </> },
  { id: "cookie-choice", title: "6. 为什么当前提示只提供信息", content: <>
    <p>当前第一方技术仅限必要的安全、认证、会话、用户主动请求的草稿恢复、删除进度及提示偏好功能，因此提示栏使用“知道了”，而不是请求并不适用于这些必要功能的同意。它不会把分析／营销同意捆绑进必要 Cookie。如果未来提出可选分析、广告或其他非必要存储，这些技术会保持关闭，直到提供法律要求的有效选择，包括在适用情况下同等易用的拒绝和撤回。</p>
  </> },
  { id: "cookie-controls", title: "7. 浏览器控制与未来变更", content: <>
    <p>你可通过浏览器清除 Cookie、会话存储或本地存储。清除草稿存储会删除尚未完成的文字；清除删除查询凭据会移除当前设备上的副本，如需之后查询，请保留下载的凭据。清除安全 Cookie 会退出登录或中断认证；清除提示值会再次显示提示。引入新类别／用途前，Rillora 将更新本提示，识别相关第三方和时长，尊重法律要求的退出偏好信号，并在适用时对非必要存储取得事前同意。</p>
  </> },
];

export function LegalDocumentPage(props) {
  return props.documentKey === "cookies" ? <CurrentCookieNotice onBack={props.onBack} /> : <AcceptedLegalDocumentPage {...props} />;
}

export function CurrentCookieNotice({ onBack }) {
  const { locale } = useI18n();
  const chinese = locale === "zh-CN";
  const document = {
    eyebrow: chinese ? "法律信息" : "Legal",
    title: chinese ? "浏览器存储声明" : "Cookie Notice",
    summary: chinese ? "必要存储技术与当前的跟踪边界。" : "Strictly necessary storage and current tracking boundaries.",
    version: "cookies-2026-11-06-1",
    updated: chinese ? "2026 年 11 月 6 日" : "6 November 2026",
    sections: chinese ? cookieSectionsZH : cookieSections,
  };
  return (
    <main className="legal-page" aria-labelledby="legal-title">
      <button className="legal-back" type="button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" />{chinese ? "返回 Rillora" : "Back to Rillora"}
      </button>

      <header className="legal-hero">
        <p className="legal-eyebrow">{document.eyebrow}</p>
        <h1 id="legal-title" style={{ textWrap: 'balance' }}>{document.title}</h1>
        <p className="legal-summary">{document.summary}</p>
        <dl className="legal-meta">
          <div><dt>{chinese ? "状态" : "Status"}</dt><dd>{chinese ? "已生效" : "Effective"}</dd></div>
          <div><dt>{chinese ? "版本" : "Version"}</dt><dd>{document.version}</dd></div>
          <div><dt>{chinese ? "最近更新" : "Last updated"}</dt><dd>{document.updated}</dd></div>
        </dl>
        <button className="legal-print" type="button" onClick={() => window.print()}>
          {chinese ? "打印或保存副本" : "Print or save a copy"}
        </button>
      </header>

      <div className="legal-layout">
        <nav className="legal-contents" aria-label={chinese ? `${document.title}目录` : `${document.title} contents`}>
          <p>{chinese ? "本页目录" : "On this page"}</p>
          {document.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title.replace(/^\d+\.\s*/, "")}</a>)}
        </nav>

        <article className="legal-document">
          {document.sections.map((section) => (
            <section id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.content}
            </section>
          ))}
          <a className="legal-end-link" href="#legal-title">{chinese ? "返回顶部" : "Return to top"}<ArrowUpRight size={16} aria-hidden="true" /></a>
        </article>
      </div>
    </main>
  );
}
