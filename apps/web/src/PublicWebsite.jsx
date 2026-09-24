import { RilloraBrand } from './RilloraBrand.jsx';
import { useEffect } from 'react';
import { PublicHome } from './PublicHome.jsx';
import { PublicPlatformGuides } from './PlatformGuides.jsx';
import './public-experience.css';
import './interaction-refinement.css';
import './public-website.css';

const legal = 'https://legal.rillora.xyz';

/** Public information only: no API client, account form, cookies or user storage. */
export function PublicWebsite() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const guides = path === '/guides';
  const support = path === '/support';
  useEffect(() => {
    document.title = guides ? 'Account inheritance — Rillora'
      : support ? 'Help & support — Rillora' : 'Rillora — Make the important things clear';
  }, [guides, support]);
  return <div className="public-shell public-website">
    <header className="public-header">
      <a className="public-wordmark" href="/" aria-label="Rillora home"><RilloraBrand decorative /></a>
      <nav aria-label="Public navigation">
        <a href="/guides" aria-current={guides ? 'page' : undefined}>Guides</a>
        <a href="/support" aria-current={support ? 'page' : undefined}>Support</a>
      </nav>
    </header>
    {!guides && !support && <>
      <p className="public-launch-status">Product preview · Accounts are not open yet</p>
      <PublicHome />
    </>}
    {guides && <PublicPlatformGuides />}
    {support && <main className="public-platform-guides public-support">
      <h1>Help & support</h1>
      <a className="secondary-button" href="mailto:support@rillora.xyz">Contact support <span aria-hidden="true">↗</span></a>
      <details className="task-details"><summary>What should I keep in Rillora?</summary><p>Account names, document locations and clear directions. Keep passwords, seed phrases, private keys and complete recovery codes out of your map.</p></details>
      <details className="task-details"><summary>Does a guide transfer an account?</summary><p>No. Each provider decides access, closure or transfer through its own process. Our guides link to those official routes and explain what to prepare.</p></details>
      <details className="task-details"><summary>Can I create an account now?</summary><p>Accounts and subscriptions are not open yet. You can explore the product and read all account inheritance guides without signing in.</p></details>
      <div className="task-policy-links"><a href="mailto:privacy@rillora.xyz">Privacy request</a><a href="mailto:security@rillora.xyz">Report a security issue</a></div>
      <p>Do not include passwords or private account details in your first message.</p>
    </main>}
    <footer className="public-footer">
      <RilloraBrand />
      <p>Digital legacy and estate continuity. Directions, not passwords.</p>
      <nav aria-label="Information and legal links">
        <a href="/support">Support</a><a href={`${legal}/privacy`}>Privacy</a>
        <a href={`${legal}/terms`}>Terms</a><a href={`${legal}/legal`}>Legal</a>
        <a href={`${legal}/cookies`}>Cookies</a>
      </nav>
    </footer>
  </div>;
}
