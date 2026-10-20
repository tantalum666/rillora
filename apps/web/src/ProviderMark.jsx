import { useState } from "react";
import { BookOpen, DeviceMobile, ClockCounterClockwise, FolderUser, Cloud, Envelope, Users, Image, IdentificationCard, Chats, CreditCard, CurrencyBtc, Bank, Code, Key, PaintBrush, Play, GameController } from "@phosphor-icons/react";
import { providerFallback } from "./providerMarkModel.js";
import github from "./assets/official-brands/github-invertocat-white.svg";
import x from "./assets/official-brands/x-logo-white.png";
import instagram from "./assets/official-brands/instagram-glyph-white.svg";
import facebook from "./assets/official-brands/facebook-primary.png";
import dropbox from "./assets/official-brands/dropbox-glyph.svg";
import coinbase from "./assets/official-brands/coinbase-logo-white.svg";

const officialMarks = { github, x, instagram, meta: facebook, dropbox, coinbase };
const symbols = { device: DeviceMobile, clock: ClockCounterClockwise, folder: FolderUser, cloud: Cloud, mail: Envelope, people: Users, photo: Image, profile: IdentificationCard, chat: Chats, card: CreditCard, coin: CurrencyBtc, bank: Bank, code: Code, key: Key, paint: PaintBrush, play: Play, game: GameController, book: BookOpen };
export function ProviderMark({ providerKey }) {
  const asset = Object.hasOwn(officialMarks, providerKey) ? officialMarks[providerKey] : null;
  const [failedAsset, setFailedAsset] = useState(null);
  const showAsset = Boolean(asset && failedAsset !== asset);
  const fallback = providerFallback(providerKey), Symbol = symbols[fallback.symbol];
  return <span className={`provider-mark${showAsset ? " is-official" : " is-fallback"}${providerKey === "dropbox" ? " is-dropbox" : ""}${providerKey === "meta" ? " is-facebook" : ""}${providerKey === "coinbase" ? " is-coinbase" : ""}`} aria-hidden="true" data-provider-key={providerKey} data-mark-kind={showAsset ? "official" : "fallback"}>
    {showAsset ? <img src={asset} alt="" onError={() => setFailedAsset(asset)}/> : <><Symbol size={19}/><span className="provider-mark-initials">{fallback.initials}</span></>}
  </span>;
}
