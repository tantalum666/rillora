export function WebsiteAppearanceDisclosure({ compact = false }) {
  return (
    <section
      id={compact ? undefined : "appearance"}
      tabIndex={compact ? undefined : -1}
      className={compact ? "legal-appearance-update" : "lp-appearance-note"}
      aria-label="Website appearance preference"
    >
      {compact ? (
        <strong>29 September 2026 · Website appearance update</strong>
      ) : (
        <h2>Website appearance</h2>
      )}
      <p>
        On the Rillora website and web app, choosing Light or Dark saves only that choice in
        this browser under <span>rillora.website.appearance.v1</span>. It is
        used only to display your chosen appearance, contains no account or
        private-map information, and is not used for advertising or analytics.
      </p>
      <p>
        The choice remains until you select System or clear browser storage.
        Links from the website carry only this display choice to the web app. Each site keeps its own local preference; nothing is linked to your account. System removes the saved choice and follows your device. If browser
        storage is unavailable, the control still works for the current page.
      </p>
      {compact && (
        <p>
          This update supplements the storage descriptions below for this
          website setting only.{" "}
          <a href="https://www.rillora.xyz/legal#appearance">
            View the website setting details
          </a>
          .
        </p>
      )}
    </section>
  );
}
