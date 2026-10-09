import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import { LEGAL_CONTRACT } from "./legalContract.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { withLocalePath } from "./i18n/localeStore.js";

function LegalPolicyLink({ to, children }) {
  const { locale } = useI18n();
  return <a href={withLocalePath(to, locale, locale)}>{children}</a>;
}

const legalOperator = Object.freeze({
  name: import.meta.env.VITE_LEGAL_OPERATOR_NAME?.trim()
    || "[operator legal name — required in publication configuration]",
  country: import.meta.env.VITE_LEGAL_OPERATOR_COUNTRY?.trim()
    || "[operator country or region — required in publication configuration]",
  address: import.meta.env.VITE_LEGAL_SERVICE_ADDRESS?.trim()
    || "[service address — required in publication configuration]",
  supportEmail: import.meta.env.VITE_LEGAL_SUPPORT_EMAIL?.trim()
    || "support@rillora.xyz",
  privacyEmail: import.meta.env.VITE_LEGAL_PRIVACY_EMAIL?.trim()
    || "privacy@rillora.xyz",
  securityEmail: import.meta.env.VITE_LEGAL_SECURITY_EMAIL?.trim()
    || "security@rillora.xyz",
});

const privacySections = [
  {
    id: "scope",
    title: "1. Scope and current status",
    content: (
      <>
        <p>This Privacy Policy explains how {legalOperator.name}, operating the product Rillora as an individual based in {legalOperator.country}, handles personal information when you visit, create an account, or use our digital legacy and estate-continuity planning service. Rillora is a product and brand, not a separate company.</p>
        <p>Legal notices may be sent to {legalOperator.address}; privacy requests to {legalOperator.privacyEmail}. This Policy applies to the Global Rillora service. Any separately operated mainland-China service will use its own operator, data-location and legal notices.</p>
      </>
    ),
  },
  {
    id: "information",
    title: "2. Information we handle",
    content: (
      <>
        <h3>Account and identity information</h3>
        <p>When you sign in, our identity provider may give Rillora basic account information such as your name, email address, locale, identity-provider name, and a unique account identifier. Rillora stores the identity issuer and subject needed to connect that identity to your Rillora account.</p>
        <h3>Your private map</h3>
        <p>You may add matter titles, categories, institution or platform names, masked account hints, record locations, value bands, importance, directions, desired outcomes, and the names, roles, relationships, or contact locators of people you choose to record.</p>
        <h3>Security, device, and service information</h3>
        <p>We process authentication times and methods, hashed session and anti-forgery values, session expiry and revocation state, request and security logs, client type, timestamps, and technical information normally transmitted with a network request. Infrastructure providers may process IP addresses and related request metadata to deliver and protect the service.</p>
        <h3>Privacy-filtered progress events</h3>
        <p>Rillora can create a small set of server-generated progress events after a successful product action. These events use fixed names and low-cardinality properties. They are designed not to contain matter titles, institution names, account hints, locations, values, currencies, contact identities, free text, ciphertext, or identity-provider identifiers. Rillora does not use a third-party advertising or behavioural-analytics SDK.</p>
        <h3>Required and optional information</h3>
        <p>A verified identity, current legal acceptance and necessary security data are required to create and use a private Rillora account. If they are not provided, Rillora cannot create the account or session. Private-map content is generally optional, but a feature cannot work without the information it specifically requests.</p>
      </>
    ),
  },
  {
    id: "do-not-add",
    title: "3. Information you must not add",
    content: (
      <>
        <p>Rillora is a map, not a password vault. Do not add bank, brokerage, or payment passwords; complete recovery codes; private keys; cryptocurrency seed phrases; payment-card credentials; or any other secret that alone permits account access or asset transfer.</p>
        <p>Do not add information about another person unless it is necessary for your planning and you have a lawful and fair reason to do so. Avoid unnecessary health, identity-document, or highly sensitive information.</p>
      </>
    ),
  },
  {
    id: "uses",
    title: "4. Why we use information",
    content: (
      <>
        <p>We use personal information to provide and maintain your account and private map; authenticate users and protect sessions; save, organize, export, and retrieve planning information; prevent misuse and investigate security or reliability problems; understand whether core planning actions work; respond to lawful requests; and comply with legal obligations.</p>
        <p>Depending on where you live, our legal bases may include performing a contract with you, taking steps you request before entering a contract, our legitimate interests in operating and securing a privacy-sensitive service, compliance with law, and consent where a feature specifically asks for it. We do not use your plan content for targeted advertising.</p>
      </>
    ),
  },
  {
    id: "google",
    title: "5. Google, Apple, and authentication data",
    content: (
      <>
        <p>If you choose Google or Apple to sign in, that provider processes your authentication under its own terms and privacy policy. Rillora currently requests only the basic identity information needed for sign-in. It does not request access to your Gmail, Google Drive, Google Contacts, iCloud content, or Apple Health data.</p>
        <p>Rillora does not persist Google or Apple access or refresh tokens in its product database. We do not sell authentication data, use it for advertising, or transfer it to data brokers or credit-scoring services.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "6. When information is shared",
    content: (
      <>
        <p>We disclose information only as needed to operate the service, follow your authorized instructions, protect users and the service, complete a business transfer with appropriate confidentiality and data-protection safeguards, or comply with law. Service providers include Auth0 for identity and authentication; Google or Apple when you select them for sign-in; Amazon Web Services for application infrastructure; and Stripe or Apple when you choose an applicable paid channel.</p>
        <p>Rillora does not sell personal information or share it for cross-context behavioural advertising. Recording a trusted contact, executor, or recipient does not itself send that person your information or give them access, authority, or ownership. Unless Rillora expressly confirms that an invitation or post-event disclosure feature is active, the record remains planning information only.</p>
        <p>Rillora does not currently use personal information for direct marketing. A future direct-marketing use will require the notice, choice and consent or opt-out required by applicable law before activation.</p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "7. International processing",
    content: (
      <p>Rillora and its service providers may process information outside your country. The primary application and identity infrastructure is configured in the European Economic Area, while authentication, support, payment, security or network providers may process limited information in other locations. Where applicable law requires a transfer mechanism, Rillora will use an available adequacy basis, contractual protection or other lawful safeguard and will take reasonable steps to require service providers to protect and retain personal information consistently with this Policy.</p>
    ),
  },
  {
    id: "retention",
    title: "8. Retention and deletion",
    content: (
      <>
        <p>Digital continuity is inherently long-term. Account and private-map information is retained for the life of an active Rillora account and may be kept for many years or decades while the user continues the continuity purpose. Browser-session expiry, a missed sign-in or review, device inactivity, subscription cancellation, payment failure, or downgrade to Free does not by itself delete the private map or prove that its purpose has ended.</p>
        <p>Users may review, correct, export or request deletion at any time. Rillora may request periodic confirmation that the account and contact routes remain current, but failure to answer a reminder does not automatically establish death, abandonment or permission to erase or disclose the plan.</p>
        <p>Privacy-filtered progress events are ordinarily scheduled for deletion within 90 days. Routine application and infrastructure logs are ordinarily retained for 30 days; security, fraud-prevention or incident records may be retained for up to 12 months where reasonably necessary.</p>
        <p>After a verified voluntary account-deletion request or another confirmed end of the continuity purpose, Rillora ordinarily removes private-map content from active systems within 30 days and allows protected backup copies to expire within 90 days. Legal acceptance, contract, invoice, refund, dispute and tax records may be retained in minimized form for up to seven years or longer where law, an unresolved dispute, fraud prevention or enforcement requires it.</p>
        <p>Copies saved, printed, shared, decrypted or backed up outside Rillora cannot be remotely erased by Rillora. A legal hold or another mandatory retention duty may delay deletion of the minimum required record.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "9. Security",
    content: (
      <>
        <p>Rillora uses measures such as encrypted network transport, hashed session values, anti-forgery protections, least-privilege service roles, tenant isolation, and restricted data fields. Some export formats can be encrypted on your device before upload, while a plaintext export is deliberately not encrypted.</p>
        <p>No system is perfectly secure. Rillora does not currently claim that every stored field is end-to-end encrypted, that the service has completed an independent production security audit, or that a file saved outside Rillora can be remotely revoked.</p>
      </>
    ),
  },
  {
    id: "rights",
    title: "10. Your privacy rights",
    content: (
      <>
        <p>Depending on your location, you may have rights to access, correct, delete, restrict, object to, or receive a portable copy of personal information; withdraw consent without affecting earlier lawful processing; opt out of certain sales or sharing; and complain to a privacy regulator. Rillora does not currently make decisions that produce legal or similarly significant effects using solely automated processing.</p>
        <p>These rights may have legal exceptions. Use My data to export your private map or request account deletion, or submit a request to {legalOperator.privacyEmail}. Rillora may request information reasonably necessary to verify identity and authority before acting. If you are recorded in another user’s plan, you may also have privacy rights, although access can be limited where disclosure would adversely affect another person’s rights or a legal duty.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "11. Cookies and similar storage",
    content: (
      <p>The current service uses only strictly necessary browser storage and cookies for authentication, session continuity, request protection, recovery of an unfinished user-requested matter draft, checking a deletion request, and remembering that the necessary-storage notice was dismissed. The public notice is informational, not consent to future optional storage. Auth0, Google, Apple, Stripe, or another user-selected provider may use its own technologies when its page opens. Rillora does not currently use advertising cookies or third-party behavioural analytics. If that changes, optional technologies will remain off until any consent or opt-out controls required by law are available.</p>
    ),
  },
  {
    id: "age",
    title: "12. Age and children",
    content: (
      <p>Rillora is intended only for adults who are at least 18 and have reached the age of legal majority where they live. We do not knowingly offer the service to children or knowingly collect a child’s personal information. A parent or guardian who believes a child has provided information should contact {legalOperator.privacyEmail}.</p>
    ),
  },
  {
    id: "life-events",
    title: "13. Life events and deceased persons",
    content: (
      <p>Death, incapacity, and being unreachable are separate processes. Silence, missed sign-ins, subscription status, device inactivity, or a contact’s statement does not automatically release private information. Laws governing deceased persons’ data vary, and a claimant’s identity, evidence, legal authority, and permitted Rillora disclosure scope must be assessed separately. Rillora does not provide operational post-event release unless the service expressly identifies that feature as available and its separate verification requirements have been satisfied.</p>
    ),
  },
  {
    id: "changes",
    title: "14. Changes and contact",
    content: (
      <>
        <p>We will use a new version when this policy changes and provide additional notice or renewed acknowledgement where a change materially affects users or the law requires it.</p>
        <p>Privacy questions and rights requests may be sent to {legalOperator.privacyEmail}; security reports to {legalOperator.securityEmail}; general support to {legalOperator.supportEmail}.</p>
        <p>Legal notices may be sent to {legalOperator.address}. General support is available at {legalOperator.supportEmail}.</p>
      </>
    ),
  },
];

const termsSections = [
  {
    id: "agreement",
    title: "1. Agreement and eligibility",
    content: (
      <>
        <p>These Terms form a contract governing Rillora. By actively checking the agreement box and continuing, you agree to these Terms, acknowledge the Privacy Policy, and consent to receive electronically the Terms, policies, subscription disclosures, receipts, account notices and other contractual records relating to Rillora.</p>
        <p>Before consenting, you confirm that you can access, read, save and print these records using a current browser or device, an internet connection, an active email address and sufficient storage or printing capability. If those requirements materially change, Rillora will provide notice and obtain renewed electronic consent where required.</p>
        <p>You may update your electronic contact information or withdraw consent to future electronic records by contacting {legalOperator.supportEmail}. Withdrawal does not affect records already provided or obligations already incurred. If Rillora cannot lawfully or practically provide the service without electronic records, withdrawal may require account closure after a reasonable export opportunity. Electronic and printable copies are available without charge. You may request an available paper copy through support; any permitted delivery or reproduction charge will be disclosed before it is incurred.</p>
        <p>You must be at least 18 and have reached the age of legal majority where you live. If you use Rillora for an organisation, you must have authority to bind that organisation.</p>
        <p>Rillora is operated by {legalOperator.name}, an individual based in {legalOperator.country}, with legal notices at {legalOperator.address}. Rillora is a product and brand, not a separate corporation.</p>
      </>
    ),
  },
  {
    id: "service",
    title: "2. What Rillora provides",
    content: (
      <p>Rillora helps you map important accounts, records, obligations, devices, and other matters; record directions; identify people who may help; locate official next steps; and prepare bounded exports. Rillora is an organisational and coordination service. Features described as planned, simulated, rehearsal-only, or unavailable are not part of the live service.</p>
    ),
  },
  {
    id: "not-legal-service",
    title: "3. What Rillora does not provide",
    content: (
      <>
        <p>Rillora is not a law firm, lawyer, court, registry, executor, administrator, trustee, fiduciary, guardian, bank, broker, insurer, tax adviser, investment adviser, password manager, emergency service, or substitute for a qualified professional. No attorney-client, fiduciary, custodial, bailment, agency, beneficiary or professional relationship is created.</p>
        <p>It does not create a legally valid will merely because you record a direction. It does not determine death, incapacity, inheritance, ownership, transfer an asset, grant account access, appoint an executor, or guarantee that a provider, authority or court will follow a direction.</p>
        <p>Legal requirements differ by residence, nationality, asset location, provider contract, document type, and life event. Obtain advice from a qualified professional where needed.</p>
      </>
    ),
  },
  {
    id: "account",
    title: "4. Your account",
    content: (
      <p>You must provide accurate account information, keep your authentication methods secure, and notify us promptly of suspected unauthorised access. You are responsible for activity under your account unless applicable law says otherwise. A trusted contact is not automatically an account-recovery person and may not reset your account solely because you recorded them in a plan.</p>
    ),
  },
  {
    id: "content",
    title: "5. Your content and responsibilities",
    content: (
      <>
        <p>You retain ownership of content you add. You give Rillora a limited, worldwide, non-exclusive licence to host, process, reproduce, and transmit that content only as needed to provide, secure, maintain, and improve the service and comply with law. This licence ends when the content is deleted from our active systems, subject to reasonable backup, security, dispute, and legal-retention periods.</p>
        <p>You are responsible for the accuracy and legality of your content, reviewing it over time, and having an appropriate basis for recording information about other people. Do not impersonate another person, misrepresent authority, upload unlawful material, or use Rillora to obtain access or ownership you do not have.</p>
      </>
    ),
  },
  {
    id: "secrets",
    title: "6. Prohibited secrets and misuse",
    content: (
      <>
        <p>Do not store passwords, complete recovery codes, private keys, seed phrases, payment-card credentials, or another secret that alone enables account access or asset transfer. Do not probe, disrupt, reverse engineer where prohibited by law, bypass security or access controls, introduce malicious code, scrape private information, or use the service for fraud, harassment, surveillance, or unlawful discrimination.</p>
        <p>We may restrict or remove unsafe content and suspend activity that threatens users, third parties, or the service.</p>
        <p>The <LegalPolicyLink to="/acceptable-use">Acceptable Use Policy</LegalPolicyLink> is incorporated into these Terms.</p>
      </>
    ),
  },
  {
    id: "roles",
    title: "7. Contacts, roles, and authority",
    content: (
      <p>Labels such as trusted contact, executor, or recipient are planning records only. They do not verify a person’s identity, confirm consent, create legal authority, appoint a fiduciary, establish inheritance rights, transfer ownership, or grant account access. A person’s authority must come from applicable law, a valid legal instrument, a provider’s rules, or another recognised source outside the label itself.</p>
    ),
  },
  {
    id: "events",
    title: "8. Death, incapacity, and being unreachable",
    content: (
      <>
        <p>These are separate events with different evidence, authority, notice, appeal, and disclosure requirements. Rillora will not treat missed sign-ins, device silence, subscription status, a wearable signal, an obituary, or one person’s statement as sufficient by itself to release private information.</p>
        <p>Rillora does not provide a live claim, document-verification, or post-event disclosure service unless the service expressly identifies that feature as available. A rehearsal or simulation is non-operative and does not contact another person, validate evidence, create authority, or release information.</p>
      </>
    ),
  },
  {
    id: "providers",
    title: "9. Third-party services",
    content: (
      <p>Rillora may link to identity providers, platforms, registries, professional services, or official procedures. Their terms, decisions, availability, and privacy practices control their services. Rillora cannot guarantee that a third party will preserve, close, delete, memorialise, disclose, or transfer an account or asset.</p>
    ),
  },
  {
    id: "exports",
    title: "10. Exports and copies outside Rillora",
    content: (
      <p>You are responsible for files you download, print, share, or store outside Rillora. A plaintext export is not encrypted. An encrypted export may become permanently unreadable if the required recovery material is lost. Once a copy leaves systems we control, we cannot guarantee its security, deletion, recall, or revocation.</p>
    ),
  },
  {
    id: "fees",
    title: "11. Fees and paid services",
    content: (
      <p>Paid services, when enabled, are governed by the <LegalPolicyLink to="/subscription-terms">Subscription Terms</LegalPolicyLink> and <LegalPolicyLink to="/refund-policy">Refund &amp; Cancellation Policy</LegalPolicyLink> incorporated into these Terms and shown before purchase. Registration acceptance does not authorize a recurring charge: the price, billing period, renewal, taxes, cancellation method, refund or withdrawal rights and included features must receive a separate express purchase action. Payment failure or cancellation never proves death, incapacity or being unreachable and never triggers disclosure.</p>
    ),
  },
  {
    id: "availability",
    title: "12. Service changes, suspension, and termination",
    content: (
      <>
        <p>We may update, add, limit, or discontinue features to improve safety, comply with law, or operate the service. We will provide reasonable notice and an appropriate retrieval path before a material discontinuation where practical and legally required. Urgent security, legal or abuse-prevention action may occur without advance notice.</p>
        <p>You may stop using Rillora at any time. We may suspend or terminate access for material breach, fraud, security risk, legal requirement, or harm to others. Account closure and content retention remain subject to the Privacy Policy and applicable law.</p>
        <p>Ordinary inactivity, missed reviews, payment failure or a move from Family to Free does not automatically close the account or delete the private map. If Rillora ever ends the service or an account for operational reasons, it will provide reasonable advance notice and a practical export opportunity where possible and legally required.</p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "13. Disclaimers",
    content: (
      <>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, RILLORA IS PROVIDED “AS IS” AND “AS AVAILABLE”. THE OPERATOR DISCLAIMS IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, AVAILABILITY, SECURITY AND LEGAL EFFECT.</p>
        <p>We do not promise uninterrupted availability; that information is complete or current; that any direction is legally effective; that an export remains readable; that information is never lost or accessed unlawfully; that a third party will act; or that the service satisfies estate, probate, tax, succession, consumer or privacy requirements in a particular jurisdiction.</p>
        <p>Nothing excludes a warranty, remedy, consumer right or responsibility that cannot lawfully be excluded.</p>
      </>
    ),
  },
  {
    id: "liability",
    title: "14. Responsibility and liability",
    content: (
      <>
        <p>You remain responsible for professional advice, valid legal documents, secure handling of access credentials, independent copies, recipients and compliance with third-party rules.</p>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE OPERATOR WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE OR CONSEQUENTIAL LOSS; LOST PROFITS, REVENUE, OPPORTUNITY, GOODWILL OR DATA; LOSS CAUSED BY A THIRD PARTY; OR LOSS ARISING FROM RELIANCE ON A RECORD AS LEGAL, FINANCIAL OR PROFESSIONAL ADVICE, WHETHER THE CLAIM IS BASED IN CONTRACT, TORT, STATUTE OR ANOTHER LEGAL THEORY.</p>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE OPERATOR’S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO RILLORA WILL NOT EXCEED THE GREATER OF (A) US$100 AND (B) THE AMOUNT YOU PAID TO RILLORA DURING THE 12 MONTHS BEFORE THE FIRST EVENT GIVING RISE TO THE CLAIMS. MULTIPLE CLAIMS OR EVENTS DO NOT INCREASE THIS CAP.</p>
        <p>The disclaimers, exclusions and cap allocate risk between the parties and apply to the maximum lawful extent even if a limited remedy does not fully compensate a loss.</p>
        <p>The exclusions and cap do not apply to fraud, wilful misconduct, gross negligence where it cannot be limited, death or personal injury caused by negligence where applicable, violation of rights or duties that law does not permit to be limited, or another non-excludable liability.</p>
      </>
    ),
  },
  {
    id: "law",
    title: "15. Governing law and disputes",
    content: (
      <>
        <p>Before filing a claim, each party should send written notice describing the dispute and allow 30 days for good-faith informal resolution, unless urgent relief, a limitation period or applicable law requires otherwise.</p>
        <p>These Terms and non-contractual disputes relating to Rillora are governed by the law of Hong Kong. Courts having jurisdiction in Hong Kong have non-exclusive jurisdiction. Mandatory consumer protections and rights in the place where you live remain available where they cannot be waived. Either party may seek urgent interim or injunctive relief from any court with competent jurisdiction.</p>
        <p>To the extent permitted by law, a claim must be brought within one year after it arose. A longer non-waivable limitation period continues to apply where required.</p>
      </>
    ),
  },
  {
    id: "changes-contact",
    title: "16. Changes, consent, and contact",
    content: (
      <>
        <p>We may update these Terms. A material change receives a new version and reasonable notice and may require a fresh affirmative acceptance before private use continues. Changes do not retroactively remove accrued rights or obligations unless law and an express agreement permit it.</p>
        <p>Support: {legalOperator.supportEmail}. Privacy: {legalOperator.privacyEmail}. Security: {legalOperator.securityEmail}. Legal notices: {legalOperator.address}.</p>
        <p>Notices from Rillora may be delivered to the current email address associated with your account or displayed in the service. Keep that address current.</p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "17. Rillora rights and feedback",
    content: (
      <p>The service, software, design, documentation and Rillora marks are owned by the operator or licensors. Subject to these Terms, you receive a limited, personal, non-exclusive, non-transferable right to use the service for its intended purpose; that right may be suspended or ended only as these Terms and applicable law permit. Voluntary feedback may be used without restriction or compensation, but this does not transfer ownership of your private-map content or override the Privacy Policy.</p>
    ),
  },
  {
    id: "force-majeure",
    title: "18. Events outside reasonable control",
    content: (
      <p>To the extent permitted by law, the operator is not responsible for delay or failure caused by events outside reasonable control, including provider, network, cloud, device, power, labour, governmental, legal, natural-disaster, war, epidemic or cyber incidents, provided reasonable mitigation is used where practical.</p>
    ),
  },
  {
    id: "indemnity",
    title: "19. Responsibility for misuse and indemnity",
    content: (
      <p>To the extent permitted by law, you will defend, indemnify and hold the operator harmless from third-party claims, losses and reasonable costs arising directly from your unlawful content, intentional misuse, infringement of another person’s rights, unauthorised disclosure, false representation of authority, or material breach of these Terms. The operator will give reasonably prompt notice of a covered claim and reasonable cooperation. You may control the defence with qualified counsel, but may not settle a claim in a way that admits fault by or imposes a non-monetary obligation on the operator without written consent. This clause applies only to the extent caused by your conduct and does not require indemnification for the operator’s own fault or where consumer law prohibits it.</p>
    ),
  },
  {
    id: "general",
    title: "20. General terms",
    content: (
      <>
        <p>If part of these Terms is unenforceable, it will be limited or removed only to the minimum extent necessary and the remainder continues. Failure to enforce a term is not a waiver. You may not assign this agreement without consent; the operator may assign it with the business or service subject to notice and applicable law. These Terms and incorporated policies are the entire agreement for Rillora unless a separate written agreement applies. Headings are for convenience and do not change meaning.</p>
        <p>Mandatory local-language or interpretation rules continue to apply where they cannot be waived.</p>
      </>
    ),
  },
];

const subscriptionSections = [
  {
    id: "subscription-scope",
    title: "1. Scope and incorporated terms",
    content: <p>These Subscription Terms apply when Rillora Family or another recurring paid capability is offered. They supplement the Terms of Service. A storefront’s mandatory terms control only to the extent required for that transaction.</p>,
  },
  {
    id: "subscription-offer",
    title: "2. Price, billing period, and renewal",
    content: (
      <>
        <p>Before purchase, Rillora will clearly show the capability, full price, currency, taxes or tax treatment when known, billing period, renewal frequency and cancellation method. No pre-checked box or silence creates a subscription.</p>
        <p>Monthly and annual subscriptions automatically renew for the same billing period until cancelled unless the purchase screen expressly says otherwise. The payment provider may charge the stored method at the start of each renewal period.</p>
      </>
    ),
  },
  {
    id: "subscription-consent",
    title: "3. Separate purchase consent",
    content: <p>Creating an account does not authorize a recurring charge. Immediately before purchase, the user must separately and affirmatively accept the displayed recurring price, renewal and cancellation terms. Rillora retains the offer version and transaction reference as evidence.</p>,
  },
  {
    id: "subscription-providers",
    title: "4. Stripe, Apple, and authoritative status",
    content: <p>Web subscriptions may be processed by Stripe. App Store subscriptions are sold and billed by Apple. Each provider controls payment credentials and provider-side billing or refunds under its terms. Rillora grants product capability only after authoritative provider reconciliation; a client result or callback alone does not grant access.</p>,
  },
  {
    id: "subscription-cancel",
    title: "5. Cancellation",
    content: <p>You may cancel a direct-Web subscription through Rillora’s online subscription-management route and an App Store subscription through Apple’s subscription settings or another provider route shown at purchase. Cancellation stops the next renewal and normally leaves access through the current paid period. Rillora will not require a cancellation process materially more burdensome than enrollment, except for proportionate identity or account-security checks. Deleting the app, losing a device, stopping use or closing a browser does not cancel a subscription.</p>,
  },
  {
    id: "subscription-failure",
    title: "6. Failed payment, grace, and access",
    content: <p>A failed payment may produce retry, grace, past-due, suspension or expiration states. Access follows authoritative provider status and applicable law. Payment state never starts a death, incapacity, unreachable or disclosure process. Free baseline access may remain after Family expires.</p>,
  },
  {
    id: "subscription-change",
    title: "7. Price changes, trials, and promotions",
    content: <p>Prospective price or material subscription changes will receive advance disclosure and any provider or user consent required by law. Rillora offers no trial unless the purchase screen expressly states one. A trial or promotion must state its duration, post-trial price, renewal and cancellation deadline before enrollment.</p>,
  },
];

const refundSections = [
  {
    id: "refund-cancellation",
    title: "1. Cancellation is not a retroactive refund",
    content: <p>Cancellation prevents future renewal and ordinarily does not refund time already purchased. Access normally continues to the end of the paid period unless a refund, dispute, legal requirement or provider decision ends it earlier.</p>,
  },
  {
    id: "refund-web",
    title: "2. Direct Web purchases",
    content: (
      <>
        <p>Except where law requires otherwise or Rillora expressly agrees in writing, charges are non-refundable and no partial or prorated refund is provided for unused time, forgotten cancellation, loss of device, dissatisfaction with a third-party provider, or failure to use the service.</p>
        <p>For a duplicate, unauthorized or materially defective direct-Web charge, contact {legalOperator.supportEmail} promptly with the transaction reference. Rillora may investigate, correct an error or issue a discretionary refund without creating an obligation in other cases.</p>
      </>
    ),
  },
  {
    id: "refund-apple",
    title: "3. App Store purchases",
    content: <p>Apple controls App Store billing and refund decisions. Requests must ordinarily use Apple’s refund process. Rillora may provide factual subscription information but cannot promise, issue or reverse an Apple refund unless Apple’s systems permit it.</p>,
  },
  {
    id: "refund-rights",
    title: "4. Mandatory rights and chargebacks",
    content: <p>Nothing limits a refund, withdrawal, charge-correction or consumer remedy that cannot lawfully be excluded. A chargeback may temporarily restrict paid access while the provider resolves it. Fraudulent chargebacks, repeated abuse or false claims may lead to suspension, evidence preservation and recovery of lawful costs.</p>,
  },
];

const acceptableUseSections = [
  {
    id: "aup-lawful",
    title: "1. Lawful planning only",
    content: <p>Use Rillora only for your own lawful planning or for an organization you are authorized to represent. Respect privacy, confidentiality, intellectual-property, computer-misuse, fraud, sanctions, export-control and consumer laws that apply to you.</p>,
  },
  {
    id: "aup-prohibited",
    title: "2. Prohibited conduct",
    content: <p>Do not impersonate, submit false life-event claims, claim a Rillora label proves authority, obtain unauthorized access, evade authentication, share sessions, attack or scan systems, introduce malware, automate abusive traffic, scrape private data, harass, discriminate, stalk, threaten, facilitate fraud, launder money, evade sanctions or use Rillora to plan unlawful transfer or concealment.</p>,
  },
  {
    id: "aup-secrets",
    title: "3. Prohibited secrets and high-risk content",
    content: <p>Do not store passwords, complete recovery codes, private keys, seed phrases, payment credentials or direct-transfer secrets. Do not hide them inside notes, labels, files or ciphertext submitted through a field intended for other data.</p>,
  },
  {
    id: "aup-enforcement",
    title: "4. Enforcement",
    content: <p>Rillora may remove or restrict content, limit functionality, preserve evidence, suspend an account or report conduct where reasonably necessary to protect users, the service or legal rights. Measures will be proportionate where circumstances permit. To the maximum extent permitted by law, Rillora is not liable for a good-faith, proportionate enforcement action, without limiting any mandatory refund or consumer remedy.</p>,
  },
];

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
        <li><strong>continuity_session:</strong> an HttpOnly authenticated-session cookie. The current default browser maximum age is 8 hours, while the server separately applies a 30-minute idle limit and revocation checks.</li>
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
    content: <p>Rillora cookies use the Secure attribute in production, SameSite=Lax, and a root path. Session and authentication-transaction cookies are HttpOnly. The anti-forgery cookie must be readable by the same-origin Web client for its security purpose. Cookie values are not written to product analytics or ordinary application logs.</p>,
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

const legalNoticeSections = [
  {
    id: "notice-operator",
    title: "1. Operator",
    content: <p>Product: Rillora. Legal operator: {legalOperator.name}, an individual based in {legalOperator.country}. Service and legal-notice address: {legalOperator.address}. Rillora is a brand, not a separate company.</p>,
  },
  {
    id: "notice-contacts",
    title: "2. Contacts",
    content: <p>Support: {legalOperator.supportEmail}. Privacy: {legalOperator.privacyEmail}. Security: {legalOperator.securityEmail}.</p>,
  },
  {
    id: "notice-boundary",
    title: "3. Service boundary",
    content: <p>Rillora provides digital legacy and estate-continuity organization. It is not a legal, fiduciary, financial, insurance, emergency or government service and does not create authority, transfer property or guarantee third-party action.</p>,
  },
  {
    id: "notice-policies",
    title: "4. Related policies",
    content: (
      <p>Review the <LegalPolicyLink to="/terms">Terms of Service</LegalPolicyLink>, <LegalPolicyLink to="/privacy">Privacy Policy</LegalPolicyLink>, <LegalPolicyLink to="/subscription-terms">Subscription Terms</LegalPolicyLink>, <LegalPolicyLink to="/refund-policy">Refund &amp; Cancellation Policy</LegalPolicyLink>, <LegalPolicyLink to="/acceptable-use">Acceptable Use Policy</LegalPolicyLink>, and <LegalPolicyLink to="/cookies">Cookie Notice</LegalPolicyLink>.</p>
    ),
  },
];

const legalOperatorCountryZH = /^(?:Hong Kong|HK|Hong Kong SAR)$/i.test(legalOperator.country) ? "香港" : legalOperator.country;

const privacySectionsZH = [
  { id: "scope", title: "1. 适用范围与当前状态", content: <>
    <p>本隐私政策说明：由{legalOperator.name}以个人身份、在{legalOperatorCountryZH}运营的 Rillora，在你访问网站、创建账号或使用数字遗产与事项交接规划服务时，如何处理个人信息。Rillora 是产品和品牌，不是独立公司。</p>
    <p>法律通知可发送至{legalOperator.address}；隐私请求发送至{legalOperator.privacyEmail}。本版本适用于全球版 Rillora 服务；未来另行运营的中国大陆服务使用独立运营者、数据位置和法律通知。</p>
  </> },
  { id: "information", title: "2. 我们处理的信息", content: <>
    <h3>账号和身份信息</h3>
    <p>你登录时，身份提供商可能向 Rillora 提供姓名、电子邮箱、语言／地区设置、身份提供商名称和唯一账号标识。Rillora 保存把外部身份连接到 Rillora 账号所需的身份签发方和唯一身份标识。</p>
    <h3>私人事项地图</h3>
    <p>你可以添加事项标题、类别、机构／平台名称、遮罩账号提示、资料位置、价值区间、重要性、处理方向、期望结果，以及你主动记录的人员姓名、角色、关系和联系定位信息。</p>
    <h3>安全、设备和服务信息</h3>
    <p>我们处理认证时间与方式、哈希后的会话和防伪值、会话过期／撤销状态、请求与安全日志、客户端类型、时间戳，以及网络请求通常包含的技术信息。基础设施提供商可能处理IP地址和相关请求元数据，以交付和保护服务。</p>
    <h3>经过隐私过滤的进度事件</h3>
    <p>当前应用可在成功完成产品动作后，由服务端生成少量固定进度事件。事件使用固定名称和取值范围有限的属性，不应包含事项标题、机构名、账号提示、位置、价值、币种、联系人身份、自由文本、密文或身份提供商标识。当前产品没有第三方广告或行为分析软件开发工具包。</p>
    <h3>必需和可选信息</h3>
    <p>经过验证的身份、当前法律同意和必要安全数据，是创建和使用私人账号所必需的；如不提供，Rillora 无法创建账号或会话。私人事项地图内容通常由你自愿提供，但某项功能缺少其明确要求的数据时可能无法运行。</p>
  </> },
  { id: "do-not-add", title: "3. 禁止添加的信息", content: <>
    <p>Rillora 是事项地图，不是密码保险箱。不得添加银行、券商或支付密码；完整恢复码；私钥；加密货币助记词；支付卡凭据；或任何仅凭该秘密即可直接登录账号或转移资产的信息。</p>
    <p>除非确有规划必要并具有合法、公平的处理理由，不要添加其他人的个人信息。避免添加不必要的健康信息、身份证明文件或高度敏感资料。</p>
  </> },
  { id: "uses", title: "4. 使用信息的目的", content: <>
    <p>我们使用个人信息，以提供和维护账号与私人事项地图；验证身份并保护会话；保存、组织、导出和取回规划资料；防止滥用并调查安全／可靠性问题；判断核心规划功能是否正常；回应合法请求；以及履行法律义务。</p>
    <p>视所在地法律而定，处理基础可能包括履行与你的合同、在订立合同前按你的请求采取措施、运营和保护隐私敏感服务的合法利益、遵守法律，以及在具体功能要求时取得同意。我们不使用你的计划内容做定向广告。</p>
  </> },
  { id: "google", title: "5. Google、Apple 与身份认证数据", content: <>
    <p>如果你选择 Google 或 Apple 登录，该提供商会依据自己的条款和隐私政策处理认证。Rillora 目前只请求登录所需的基本身份信息，不请求Gmail、Google Drive、Google Contacts、iCloud内容或 Apple Health数据。</p>
    <p>Rillora 不会在产品数据库长期保存 Google 或 Apple 的访问令牌或刷新令牌，不出售认证数据，不将其用于广告，也不转交数据经纪人或信用评分服务。</p>
  </> },
  { id: "sharing", title: "6. 信息共享", content: <>
    <p>我们仅在以下必要范围内披露信息：运营服务；执行你经过授权的指示；保护用户和服务；在具备保密与数据保障的业务转移中完成必要转移；或遵守法律。服务提供商包括：Auth0 用于身份认证；你主动选择 Google 或 Apple 时由其参与认证；Amazon Web Services 用于应用基础设施；以及你选择适用付费渠道时的 Stripe 或 Apple。</p>
    <p>Rillora 不出售个人信息，也不为跨场景行为广告而共享个人信息。记录可信联系人、执行人或接收人，不会自动向该人发送资料，也不会授予访问、权限或所有权。除非 Rillora 明确表示邀请或身后披露功能已经启用，该记录仍只是规划信息。</p>
    <p>Rillora 当前不使用个人信息进行直接营销。未来如需直接营销，将在启用前提供适用法律要求的通知、选择、同意或退出机制。</p>
  </> },
  { id: "transfers", title: "7. 国际处理", content: <>
    <p>Rillora 及其服务提供商可能在你所在国家／地区之外处理信息。主要应用和身份基础设施配置在欧洲经济区；认证、支持、支付、安全或网络服务提供商可能在其他地区处理有限资料。在适用法律要求传输机制时，Rillora 将使用可用的充分性依据、合同保障或其他合法机制，并采取合理步骤要求服务提供商按照本政策保护和保留个人信息。</p>
  </> },
  { id: "retention", title: "8. 保留与删除", content: <>
    <p>数字遗产的后续衔接具有长期性质。账号和私人事项地图信息可在 Rillora 账号保持有效且连续性目的继续存在期间保留，可能持续多年或数十年。浏览器会话过期、漏登录／漏复核、设备无活动、取消订阅、付款失败或降级到免费版，不会自动删除私人事项地图，也不证明规划目的已经结束。</p>
    <p>用户可随时查看、更正、导出或请求删除。Rillora 可以定期提醒用户确认账号和联系途径是否仍然有效，但未回应提醒不会自动证明死亡、放弃，也不会授权删除或披露。</p>
    <p>经过隐私过滤的进度事件通常安排在90天内删除。普通应用和基础设施日志通常保留30天；在合理必要时，安全、反欺诈或事故记录可保留不超过12个月。</p>
    <p>在核验后的主动账号删除请求或其他经确认的连续性目的终止后，Rillora 通常在30天内从使用中的系统移除私人事项地图内容，并让受保护备份在90天内到期。法律接受、合同、发票、退款、争议和税务记录可采用最小化形式保留不超过7年，或在法律、未解决争议、反欺诈或执法需要时保留更久。</p>
    <p>已保存、打印、分享、解密或在 Rillora 之外备份的副本，Rillora 无法远程删除。法律保全或强制保留义务可能延迟删除最低必要记录。</p>
  </> },
  { id: "security", title: "9. 安全", content: <>
    <p>Rillora 采用加密网络传输、哈希会话值、防请求伪造、最小权限服务角色、租户隔离和受限字段等措施。部分导出可在设备端加密后再上传；明文导出则明确不是加密文件。</p>
    <p>任何系统都无法保证绝对安全。Rillora 目前不声称所有字段均实现端到端加密，不声称已完成独立生产安全审计，也不声称保存到 Rillora 之外的文件可以远程撤回。</p>
  </> },
  { id: "rights", title: "10. 隐私权利", content: <>
    <p>根据所在地法律，你可能有权访问、更正、删除、限制处理、反对处理、获得可携带副本、撤回同意而不影响此前合法处理、退出某些出售／共享，以及向隐私监管机构投诉。Rillora 目前不使用完全自动化处理作出产生法律或类似重大影响的决定。</p>
    <p>权利可能受法律例外约束。你可在“我的数据”导出私人事项地图或申请删除账号，也可通过{legalOperator.privacyEmail}提交请求；Rillora 可在处理前要求合理必要的身份和权限核验。如果你的资料被其他用户记录在其计划中，你也可能享有隐私权；但若披露会损害他人权利或违反法律义务，访问范围可能受限。</p>
  </> },
  { id: "cookies", title: "11. Cookie 与类似存储", content: <>
    <p>当前服务仅使用认证、会话连续性、防请求伪造、恢复你主动编辑但尚未完成的事项草稿、查询删除请求进度，以及记住“必要存储提示已关闭”所必需的 Cookie 和浏览器存储。该公开提示只提供信息，不代表同意未来的可选分析或营销存储。你主动打开 Auth0、Google、Apple、Stripe 或其他服务提供商页面时，该服务提供商可能使用自己的存储技术。Rillora 当前没有广告 Cookie 或第三方行为分析。如果未来改变，在适用法律要求的同意／退出机制准备好前，可选技术保持关闭。</p>
  </> },
  { id: "age", title: "12. 年龄和儿童", content: <>
    <p>Rillora 仅面向至少18岁且已经达到所在地法定成年年龄的人。我们不明知向儿童提供服务，也不明知收集儿童个人信息。家长或监护人若认为儿童提供了信息，可联系{legalOperator.privacyEmail}。</p>
  </> },
  { id: "life-events", title: "13. 人生事件和死者资料", content: <>
    <p>死亡、失能和失联是不同流程。沉默、漏登录、订阅状态、设备无活动或某一联系人的陈述，不会自动释放私人信息。死者资料法律因地区而异；申请人身份、证据、合法权限和 Rillora 允许披露的范围必须分别评估。除非服务明确标识该功能已启用且其独立核验要求已经满足，Rillora 不提供操作性身后披露。</p>
  </> },
  { id: "changes", title: "14. 变更与联系", content: <>
    <p>本政策变更时使用新版本；如变更对用户有重大影响或法律要求，将提供额外通知或重新确认。</p>
    <p>隐私问题和权利请求：{legalOperator.privacyEmail}；安全报告：{legalOperator.securityEmail}；一般支持：{legalOperator.supportEmail}。</p>
    <p>法律通知可发送至{legalOperator.address}；一般支持由{legalOperator.supportEmail}提供。</p>
  </> },
];

const termsSectionsZH = [
  { id: "agreement", title: "1. 协议成立与使用资格", content: <>
    <p>本条款构成管理 Rillora 使用的合同。你主动勾选同意框并继续，即表示同意本条款、确认已阅读隐私政策，并同意以电子方式接收 Rillora 的条款、政策、订阅披露、收据、账号通知及其他合同记录。</p>
    <p>同意前，你确认可使用当前浏览器／设备、互联网连接、有效电子邮箱以及足够的存储／打印能力来访问、阅读、保存和打印这些记录。如果相关技术要求发生重大变化，Rillora 会提供通知并在法律要求时重新取得电子同意。</p>
    <p>你可联系{legalOperator.supportEmail}更新电子联系资料或撤回未来电子记录同意；撤回不影响此前记录或已经产生的义务。如果 Rillora 无法在法律或实际操作上脱离电子记录提供服务，撤回可能在给予合理导出机会后导致账号关闭。电子及可打印副本不收费；如可提供纸本，任何法律允许的递送／复制费用会在产生前披露。</p>
    <p>你必须至少18岁且达到所在地法定成年年龄。如果你代表组织使用 Rillora，必须有权约束该组织。</p>
    <p>Rillora 由{legalOperator.name}以个人身份、在{legalOperatorCountryZH}运营；法律通知地址为{legalOperator.address}。Rillora 是产品和品牌，不是独立公司。</p>
  </> },
  { id: "service", title: "2. Rillora 提供的服务", content: <>
    <p>Rillora 帮助你整理重要账号、记录、义务、设备及其他事项；记录处理方向；识别可能协助的人；找到官方下一步；以及准备有边界的导出。Rillora 是组织与协调服务。标为计划提供、模拟、仅供演练或尚不可用的功能，不属于当前正式服务能力。</p>
  </> },
  { id: "not-legal-service", title: "3. Rillora 不提供的服务", content: <>
    <p>Rillora 不是律师事务所、律师、法院、登记机关、遗嘱执行人、遗产管理人、受托人、监护人、银行、券商、保险人、税务／投资顾问、密码管理器、应急服务或合资格专业人士的替代品。使用 Rillora 不会建立律师客户、信义、托管、保管、代理、受益人或其他专业关系。</p>
    <p>在 Rillora 记录处理方向，不会自动创建有效遗嘱；Rillora 不判定死亡、失能、继承或所有权，不自动转移资产，不授予账号访问权，不任命执行人，也不保证服务提供商、机关或法院会执行某项指示。</p>
    <p>法律要求会因居住地、国籍、资产所在地、服务提供商合同、文件类型和人生事件而不同。必要时应取得合资格专业意见。</p>
  </> },
  { id: "account", title: "4. 账号", content: <>
    <p>你必须提供准确的账号资料，保护认证方式，并及时通知疑似未授权访问。除适用法律另有规定，你对账号活动负责。可信联系人不自动成为账号恢复人，不能只因为被记录在计划里就重置你的账号。</p>
  </> },
  { id: "content", title: "5. 你的内容与责任", content: <>
    <p>你保留所添加内容的所有权。你授予 Rillora 有限、全球、非独占许可，仅在提供、保护、维护和改进服务以及遵守法律所需范围内托管、处理、复制和传输该内容。内容从使用中的系统删除后，该许可终止，但合理的备份、安全、争议和法律保留期除外。</p>
    <p>你负责内容的准确性和合法性、持续复核，以及记录他人信息的适当依据。不得冒充、虚假陈述权限、上传违法资料或利用 Rillora 取得并不拥有的访问权／所有权。</p>
  </> },
  { id: "secrets", title: "6. 禁止秘密与滥用", content: <>
    <p>不得存储密码、完整恢复码、私钥、助记词、支付卡凭据或单独即可实现账号访问／资产转移的秘密。不得探测、破坏、在法律禁止时逆向工程、绕过访问控制、引入恶意代码、抓取私人资料，或用于欺诈、骚扰、监控和非法歧视。</p>
    <p>必要时 Rillora 可限制／删除不安全内容，并暂停威胁用户、第三方或服务的活动。<LegalPolicyLink to="/acceptable-use">《可接受使用政策》</LegalPolicyLink>并入本条款。</p>
  </> },
  { id: "roles", title: "7. 联系人、角色与权限", content: <>
    <p>可信联系人、执行人或接收人等标签只是规划记录。它们不核验身份、不证明同意、不产生法律授权、不任命信义义务人、不建立继承权、不转移所有权，也不授予账号访问。有效权限必须来自适用法律、有效法律文件、服务提供商规则或其他公认来源。</p>
  </> },
  { id: "events", title: "8. 死亡、失能与失联", content: <>
    <p>三者是不同事件，具有不同证据、权限、通知、申诉和披露要求。漏登录、设备沉默、订阅状态、可穿戴信号、讣告或单方陈述，不足以单独释放私人资料。</p>
    <p>除非服务明确标识该功能已启用，Rillora 不提供正式申领、文件核验或身后披露服务。演练／模拟均无操作效力，不联系他人、不核验证据、不产生权限、不释放资料。</p>
  </> },
  { id: "providers", title: "9. 第三方服务", content: <>
    <p>Rillora 可能链接到身份提供商、平台、登记机关、专业服务或官方流程。其条款、决定、可用性和隐私实践由第三方控制。Rillora 不保证第三方会保存、关闭、删除、纪念化、披露或转移账号／资产。</p>
  </> },
  { id: "exports", title: "10. 导出和外部副本", content: <>
    <p>你对下载、打印、分享或在 Rillora 之外存储的文件负责。明文导出不是加密文件。加密导出如丢失恢复材料，可能永久无法读取。一旦副本离开 Rillora 控制的系统，我们不能保证其安全、删除、召回或撤销。</p>
  </> },
  { id: "fees", title: "11. 费用和付费服务", content: <>
    <p>付费服务启用后，由并入本条款的<LegalPolicyLink to="/subscription-terms">《订阅条款》</LegalPolicyLink>和<LegalPolicyLink to="/refund-policy">《退款与取消政策》</LegalPolicyLink>管理，并在购买前展示。注册同意不授权周期扣款；价格、账期、续费、税费、取消方式、退款／撤回权和具体功能必须通过单独明确购买动作确认。付款失败或取消永远不证明死亡、失能或失联，也不触发披露。</p>
  </> },
  { id: "availability", title: "12. 服务变更、暂停和终止", content: <>
    <p>我们可为提高安全、遵守法律或运营服务而更新、新增、限制或停止功能。重大停止前，在可行且法律要求时提供合理通知和适当取回路径。紧急安全、法律或防滥用行动可不经提前通知。</p>
    <p>你可随时停止使用。发生重大违约、欺诈、安全风险、法律要求或损害他人时，我们可暂停或终止访问。账号关闭和内容保留继续受隐私政策及适用法律约束。</p>
    <p>普通无活动、漏复核、付款失败或家庭版降级到免费版，不会自动关闭账号或删除私人事项地图。若 Rillora 因运营原因停止服务／账号，将在可能且法律要求时提供合理提前通知和实际可行的导出机会。</p>
  </> },
  { id: "disclaimers", title: "13. 免责声明", content: <>
    <p><strong>在法律允许的最大范围内，Rillora 按“现状”和“现有可用状态”提供。运营者不作适销性、特定用途适用性、权属、不侵权、准确性、可用性、安全性或法律效力等默示保证。</strong></p>
    <p>我们不保证服务不中断；信息完整／最新；任何指示具有法律效力；导出永久可读；信息永不丢失／遭未授权访问；第三方必然行动；或服务满足任何特定司法辖区的遗产、遗嘱认证、税务、继承、消费者或隐私要求。</p>
    <p>本条款不排除法律不允许排除的保证、救济、消费者权利或责任。</p>
  </> },
  { id: "liability", title: "14. 责任与责任限制", content: <>
    <p>你仍负责获得专业意见、准备有效法律文件、安全处理访问凭据、保存独立副本、选择接收人并遵守第三方规则。</p>
    <p><strong>在法律允许的最大范围内，运营者不对间接、偶发、特殊、示范性、惩罚性或后果性损失；利润、收入、机会、商誉或数据损失；第三方造成的损失；或把 Rillora 记录当作法律、财务或专业建议而产生的损失负责，无论请求基于合同、侵权、成文法或其他法律理论。</strong></p>
    <p><strong>在法律允许的最大范围内，运营者就所有因 Rillora 产生或与 Rillora 有关的请求所负累计总责任，不超过以下两者中的较高者：（A）100 美元；或（B）引发第一项请求的事件发生前12个月内，你向 Rillora 实际支付的金额。多项请求或事件不会提高该上限。</strong></p>
    <p>免责声明、责任排除和责任上限用于分配双方风险，并在法律允许的最大范围内适用，即使有限救济不能完全补偿损失。</p>
    <p>上述排除和责任上限不适用于欺诈、故意不当、法律不允许限制的重大过失、适用情况下因过失造成的死亡／人身伤害、法律不允许限制的权利／义务违反，或其他不可排除责任。</p>
  </> },
  { id: "law", title: "15. 适用法律和争议", content: <>
    <p>提出请求前，双方应发送说明争议的书面通知，并给予30天善意非正式解决期；紧急救济、时效或适用法律另有要求的除外。</p>
    <p>本条款及与 Rillora 有关的非合同争议适用香港法律。对香港具有管辖权的法院享有非专属管辖。用户居住地不可放弃的强制消费者保护继续适用。双方均可向任何有管辖权的法院申请紧急临时或禁制救济。</p>
    <p>在法律允许范围内，请求应在发生后一年内提出；法律要求更长且不可放弃的期限继续适用。</p>
  </> },
  { id: "changes-contact", title: "16. 变更、同意与联系", content: <>
    <p>我们可以更新条款。重大变更使用新版本，提供合理通知，并可能要求用户在继续私人使用前重新主动同意。除非法律和明确协议允许，变更不会追溯剥夺已产生的权利／义务。</p>
    <p>支持：{legalOperator.supportEmail}；隐私：{legalOperator.privacyEmail}；安全：{legalOperator.securityEmail}；法律通知：{legalOperator.address}。</p>
    <p>Rillora 可向账号关联的当前电子邮箱发送通知，也可在服务内显示通知。你应保持邮箱有效。</p>
  </> },
  { id: "intellectual-property", title: "17. Rillora 权利与反馈", content: <>
    <p>服务、软件、设计、文档和 Rillora 标识由运营者或许可方所有。在遵守条款的前提下，你获得有限、个人、非独占、不可转让的预期用途使用权；该权利只能按本条款和适用法律暂停或终止。自愿反馈可被无偿使用；但不会转移你的私人事项地图内容，也不覆盖隐私政策。</p>
  </> },
  { id: "force-majeure", title: "18. 合理控制范围外事件", content: <>
    <p>在法律允许的范围内，对合理控制范围外事件造成的延迟／失败，运营者不负责，包括服务提供商、网络、云、设备、电力、劳工、政府、法律、自然灾害、战争、疫情或网络安全事件；在可行情况下仍采取合理缓解措施。</p>
  </> },
  { id: "indemnity", title: "19. 滥用责任和赔偿", content: <>
    <p>在法律允许的范围内，对直接因你的违法内容、故意滥用、侵犯他人权利、未授权披露、虚假陈述权限或重大违约而产生的第三方请求、损失和合理费用，你将在由自身行为造成的范围内为运营者抗辩、赔偿并使其免责。运营者会对受保障请求给予合理及时通知和合理协助；你可由合资格律师控制抗辩，但未经运营者书面同意，不得以承认运营者过错或向运营者施加非金钱义务的方式和解。本条不适用于运营者自身过错或消费者法律禁止的范围。</p>
  </> },
  { id: "general", title: "20. 一般条款", content: <>
    <p>条款一部分不可执行时，只在最低必要范围内限制／删除，其余继续有效。不执行某条不代表放弃。未经同意你不得转让协议；运营者可在业务／服务转移时，依通知和适用法律转让。除另有书面协议，本条款和并入政策构成 Rillora 完整协议。标题仅为阅读便利，不改变含义。</p>
    <p>适用法律要求且不得免除的当地语言要求或解释规则继续适用。</p>
  </> },
];

const subscriptionSectionsZH = [
  { id: "subscription-scope", title: "1. 范围与并入条款", content: <>
    <p>当 Rillora 家庭版或其他周期付费能力开放时，本订阅条款适用，并补充服务条款。应用商店／支付渠道的强制条款只在对应交易必须适用的范围内优先。</p>
  </> },
  { id: "subscription-offer", title: "2. 价格、账期与续费", content: <>
    <p>购买前，Rillora 清楚展示具体能力、完整价格、币种、已知税务处理、账期、续费频率和取消方式。不得通过预勾选或沉默创建订阅。</p>
    <p>除非购买页面明确另有说明，月付和年付按原账期自动续费，直到取消。支付服务提供商可在每个续费期开始时向已保存付款方式扣款。</p>
  </> },
  { id: "subscription-consent", title: "3. 单独购买同意", content: <>
    <p>创建账号不授权周期扣款。购买前必须再次主动确认当前价格、周期续费和取消条款。Rillora 保留报价版本和交易引用作为证据。</p>
  </> },
  { id: "subscription-providers", title: "4. Stripe、Apple 和权威状态", content: <>
    <p>网页订阅可由 Stripe 处理；App Store 订阅由 Apple 销售并扣款。各付款平台依据自身条款管理付款凭据、账单与退款。Rillora 只会在向付款平台核实订阅状态并完成对账后开放相应功能；客户端显示的结果或单次回调本身不会授予访问权限。</p>
  </> },
  { id: "subscription-cancel", title: "5. 取消", content: <>
    <p>网页直接订阅可通过 Rillora 在线订阅管理路径取消；App Store 订阅可通过 Apple 订阅设置或购买时显示的其他服务提供商路径取消。取消停止下一次续费，通常保留当前已付周期访问。除相称的身份／账号安全核验外，Rillora 不会要求比加入订阅明显更繁琐的取消流程。删除应用、设备丢失、停止使用或关闭浏览器不等于取消订阅。</p>
  </> },
  { id: "subscription-failure", title: "6. 付款失败、宽限与访问", content: <>
    <p>付款失败可进入重试、宽限、逾期、暂停或过期状态。访问以权威服务提供商状态和适用法律为准。付款状态永不触发死亡、失能、失联或披露流程。家庭版过期后可继续保留免费版基础访问。</p>
  </> },
  { id: "subscription-change", title: "7. 价格变更、试用和促销", content: <>
    <p>未来价格或重大订阅变更会提前披露，并取得法律要求的服务提供商或用户同意。除非购买页面明确说明，Rillora 不提供试用。试用／促销必须在加入前说明期限、试用后价格、续费和取消截止时间。</p>
  </> },
];

const refundSectionsZH = [
  { id: "refund-cancellation", title: "1. 取消不等于追溯退款", content: <>
    <p>取消阻止未来续费，通常不退还已购买的时间。除非退款、争议、法律要求或服务提供商决定提前终止，访问通常持续到已付周期结束。</p>
  </> },
  { id: "refund-web", title: "2. 网页直接购买", content: <>
    <p>除法律强制要求或 Rillora 明确书面同意外，费用不退，并不因未使用时间、忘记取消、设备丢失、对第三方服务提供商不满或未实际使用服务提供部分／按比例退款。</p>
    <p>对于重复、未授权或存在实质缺陷的网页直接订阅扣款，请及时携带交易引用联系{legalOperator.supportEmail}。Rillora 可调查、更正错误或酌情退款，但不因此在其他情形形成普遍退款义务。</p>
  </> },
  { id: "refund-apple", title: "3. App Store 购买", content: <>
    <p>Apple 控制 App Store 账单和退款决定。通常应通过 Apple 退款流程申请。Rillora 可提供事实性订阅资料，但除非 Apple 系统允许，不能承诺、签发或推翻 Apple 退款。</p>
  </> },
  { id: "refund-rights", title: "4. 强制权利与拒付", content: <>
    <p>本政策不限制法律不允许排除的退款、撤回、扣款更正或消费者救济。拒付处理期间，服务提供商可暂时限制付费访问。欺诈性拒付、重复滥用或虚假请求可导致暂停、保全证据并追偿合法成本。</p>
  </> },
];

const acceptableUseSectionsZH = [
  { id: "aup-lawful", title: "1. 只用于合法规划", content: <>
    <p>只能将 Rillora 用于自己的合法规划，或用于你有权代表的组织。遵守适用的隐私、保密、知识产权、计算机滥用、欺诈、制裁、出口管制和消费者法律。</p>
  </> },
  { id: "aup-prohibited", title: "2. 禁止行为", content: <>
    <p>不得冒充他人、提交虚假人生事件请求、声称 Rillora 标签证明权限、取得未授权访问、规避认证、共享会话、攻击／扫描系统、引入恶意软件、自动化滥用流量、抓取私人资料、骚扰、歧视、跟踪、威胁、协助欺诈、洗钱、逃避制裁，或利用 Rillora 计划非法转移／隐匿。</p>
  </> },
  { id: "aup-secrets", title: "3. 禁止秘密与高风险内容", content: <>
    <p>不得存储密码、完整恢复码、私钥、助记词、支付凭据或直接转移秘密；不得把它们隐藏在并非为秘密设计的备注、标签、文件或密文字段中。</p>
  </> },
  { id: "aup-enforcement", title: "4. 执行", content: <>
    <p>为保护用户、服务或合法权利，在合理必要时 Rillora 可删除／限制内容、限制功能、保全证据、暂停账号或报告行为；在情况允许时采取相称措施。在法律允许的最大范围内，Rillora 不为善意且相称的执行行动承担责任，但不限制任何强制退款或消费者救济。</p>
  </> },
];

const cookieSectionsZH = [
  { id: "cookie-necessary", title: "1. 严格必要技术", content: <>
    <p>Rillora 目前只使用提供用户请求的账号／安全功能所必需的存储：认证事务 Cookie、已认证会话 Cookie、防伪 Cookie、当前标签页的草稿恢复与删除查询凭据，以及记住“必要存储提示已关闭”的本地存储值。禁用或删除安全 Cookie 可能阻止登录或私人功能；删除提示值只会让提示再次出现。</p>
  </> },
  { id: "cookie-details", title: "2. 当前第一方存储明细", content: <>
    <ul><li>continuity_auth_tx：HttpOnly认证事务 Cookie，把用户主动发起的 Auth0 跳转绑定到对应回调。默认最长10分钟，并在回调或失败后清除。</li><li>continuity_session：HttpOnly已认证会话 Cookie。当前默认浏览器最长8小时；服务端另有30分钟无操作限制和撤销检查。</li><li>continuity_csrf：同源 Rillora 网页客户端可读取的防请求伪造 Cookie，用于保护状态变更请求。当前默认浏览器时长与会话相同；它单独不能认证用户。</li><li>rillora.matter-draft.v1：会话存储，限定于已核验的同一账号，只包含当前浏览器标签页中一个未完成的事项表单。仅在确认同一账号后提供恢复，24小时后到期，并在保存、明确放弃或退出登录时清除。关闭标签页或清除浏览器存储会移除草稿；部分浏览器可能恢复之前的标签页会话。</li><li>rillora.deletion-reference.v1：会话存储，保存随机生成、仅用于查询删除请求进度的凭据。它不能登录或读取私人事项地图。请保留可下载的查询凭据，以便之后在其他标签页或设备上查询。删除进行期间及完成后30天内可以查询公开进度。</li><li>rillora.cookie-notice：本地存储，只保存用户点击“知道了”时对应的当前提示版本标识；不包含账号或私人事项地图内容，直到用户清除或新提示版本替代。</li></ul>
  </> },
  { id: "cookie-security", title: "3. 安全属性与范围", content: <>
    <p>生产环境的 Rillora Cookie 使用Secure、SameSite=Lax和根路径。会话与认证事务 Cookie 为HttpOnly。CSRF Cookie 因安全用途必须由同源网页客户端读取。Cookie 值不写入产品分析或普通应用日志。</p>
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

const legalNoticeSectionsZH = [
  { id: "notice-operator", title: "1. 运营者", content: <>
    <p>产品：Rillora。法律运营者：{legalOperator.name}，以个人身份在{legalOperatorCountryZH}运营。服务及法律通知地址：{legalOperator.address}。Rillora 是品牌，不是独立公司。</p>
  </> },
  { id: "notice-contacts", title: "2. 联系方式", content: <>
    <p>支持：{legalOperator.supportEmail}；隐私：{legalOperator.privacyEmail}；安全：{legalOperator.securityEmail}。</p>
  </> },
  { id: "notice-boundary", title: "3. 服务边界", content: <>
    <p>Rillora 提供数字遗产与事项交接整理服务，不是法律、信义、金融、保险、应急或政府服务；不产生权限、不转移财产，也不保证第三方行动。</p>
  </> },
  { id: "notice-policies", title: "4. 相关政策", content: <>
    <p>本法律声明应与<LegalPolicyLink to="/terms">《服务条款》</LegalPolicyLink><LegalPolicyLink to="/privacy">《隐私政策》</LegalPolicyLink><LegalPolicyLink to="/subscription-terms">《订阅条款》</LegalPolicyLink><LegalPolicyLink to="/refund-policy">《退款与取消政策》</LegalPolicyLink><LegalPolicyLink to="/acceptable-use">《可接受使用政策》</LegalPolicyLink>和《Cookie 与类似存储技术通知》一并阅读。</p>
  </> },
];

const documents = {
  privacy: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    summary: "How Rillora handles personal information while keeping planning, identity, and future disclosure separate.",
    updated: "15 September 2026",
    version: LEGAL_CONTRACT.privacyVersion,
    sections: privacySections,
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms of Service",
    summary: "The rules and boundaries for using Rillora’s digital legacy and estate-continuity planning service.",
    updated: "9 October 2026",
    version: LEGAL_CONTRACT.termsVersion,
    sections: termsSections,
  },
  subscriptions: {
    eyebrow: "Legal",
    title: "Subscription Terms",
    summary: "Recurring billing, renewal, cancellation, and payment-provider boundaries.",
    updated: "27 August 2026",
    version: "subscriptions-2026-08-27-1",
    sections: subscriptionSections,
  },
  refunds: {
    eyebrow: "Legal",
    title: "Refund & Cancellation Policy",
    summary: "How cancellation, refunds, App Store requests, and charge disputes work.",
    updated: "27 August 2026",
    version: "refunds-2026-08-27-1",
    sections: refundSections,
  },
  acceptableUse: {
    eyebrow: "Legal",
    title: "Acceptable Use Policy",
    summary: "Rules protecting users, third parties, and the service.",
    updated: "27 August 2026",
    version: "acceptable-use-2026-08-27-1",
    sections: acceptableUseSections,
  },
  cookies: {
    eyebrow: "Legal",
    title: "Cookie Notice",
    summary: "Strictly necessary storage and current tracking boundaries.",
    updated: "15 September 2026",
    version: "cookies-2026-09-15-1",
    sections: cookieSections,
  },
  legalNotice: {
    eyebrow: "Legal",
    title: "Legal Notice",
    summary: "Who operates Rillora and what the service does not promise.",
    updated: "27 August 2026",
    version: "legal-notice-2026-08-27-1",
    sections: legalNoticeSections,
  },
};

const documentsZH = {
  privacy: { ...documents.privacy, eyebrow: "法律信息", title: "隐私政策", summary: "Rillora 如何处理个人信息，以及规划记录、身份核验与资料披露之间的界限。", updated: "2026 年 9 月 15 日", sections: privacySectionsZH },
  terms: { ...documents.terms, eyebrow: "法律信息", title: "服务条款", summary: "使用 Rillora 数字遗产与事项交接规划服务的规则和边界。", updated: "2026 年 10 月 9 日", sections: termsSectionsZH },
  subscriptions: { ...documents.subscriptions, eyebrow: "法律信息", title: "订阅条款", summary: "周期扣款、续订、取消方式及付款平台各自负责的事项。", updated: "2026 年 8 月 27 日", sections: subscriptionSectionsZH },
  refunds: { ...documents.refunds, eyebrow: "法律信息", title: "退款与取消政策", summary: "取消订阅、申请退款、App Store 购买和付款争议的处理方式。", updated: "2026 年 8 月 27 日", sections: refundSectionsZH },
  acceptableUse: { ...documents.acceptableUse, eyebrow: "法律信息", title: "可接受使用政策", summary: "保护用户、第三方及服务的使用规则。", updated: "2026 年 8 月 27 日", sections: acceptableUseSectionsZH },
  cookies: { ...documents.cookies, eyebrow: "法律信息", title: "浏览器存储声明", summary: "必要存储技术与当前的跟踪边界。", updated: "2026 年 9 月 15 日", sections: cookieSectionsZH },
  legalNotice: { ...documents.legalNotice, eyebrow: "法律信息", title: "法律声明", summary: "Rillora 的运营者，以及服务提供和不承诺的事项。", updated: "2026 年 8 月 27 日", sections: legalNoticeSectionsZH },
};

export const legalDocumentSectionIds = Object.freeze(Object.fromEntries(
  Object.keys(documents).map(key => [key, { en: documents[key].sections.map(section => section.id),
    "zh-CN": documentsZH[key].sections.map(section => section.id) }]),
));

export function LegalDocumentPage({ documentKey, onBack }) {
  const { locale } = useI18n();
  const chinese = locale === "zh-CN";
  const document = (chinese ? documentsZH : documents)[documentKey];

  return (
    <main className="legal-page" aria-labelledby="legal-title">
      <button className="legal-back" type="button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" />{chinese ? "返回 Rillora" : "Back to Rillora"}
      </button>

      <header className="legal-hero">
        <p className="legal-eyebrow">{document.eyebrow}</p>
        <h1 id="legal-title">{document.title}</h1>
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
