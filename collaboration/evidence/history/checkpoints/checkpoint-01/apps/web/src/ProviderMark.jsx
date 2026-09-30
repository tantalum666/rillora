import { BookOpen } from "@phosphor-icons/react";
import github from "./assets/official-brands/github-invertocat-white.svg";
import x from "./assets/official-brands/x-logo-white.png";
import instagram from "./assets/official-brands/instagram-glyph-white.svg";
import facebook from "./assets/official-brands/facebook-primary.png";
import dropbox from "./assets/official-brands/dropbox-glyph.svg";
import coinbase from "./assets/official-brands/coinbase-logo-white.svg";

const officialMarks = { github, x, instagram, meta: facebook, dropbox, coinbase };
export function ProviderMark({ providerKey }) {
  const asset = officialMarks[providerKey];
  return <span className={`provider-mark${asset ? " is-official" : ""}${providerKey === "dropbox" ? " is-dropbox" : ""}${providerKey === "meta" ? " is-facebook" : ""}${providerKey === "coinbase" ? " is-coinbase" : ""}`} aria-hidden="true">
    {asset ? <img src={asset} alt=""/> : <BookOpen size={19}/>}
  </span>;
}
