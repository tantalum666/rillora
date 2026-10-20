import { useI18n } from "./i18n/I18nProvider.jsx";
import { publicPath } from "./publicSeo.js";

export function PublicLink({ href, ...props }) {
  const { locale } = useI18n();
  return <a {...props} href={publicPath(href, locale)} />;
}
