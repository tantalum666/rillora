import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import { LEGAL_CONTRACT } from "./legalContract.js";

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
        <p>The <a href="/acceptable-use">Acceptable Use Policy</a> is incorporated into these Terms.</p>
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
      <p>Paid services, when enabled, are governed by the <a href="/subscription-terms">Subscription Terms</a> and <a href="/refund-policy">Refund &amp; Cancellation Policy</a> incorporated into these Terms and shown before purchase. Registration acceptance does not authorize a recurring charge: the price, billing period, renewal, taxes, cancellation method, refund or withdrawal rights and included features must receive a separate express purchase action. Payment failure or cancellation never proves death, incapacity or being unreachable and never triggers disclosure.</p>
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
        <p>Any Chinese or other translation made available for review or convenience is not a separate contract. The published English version controls to the extent permitted by applicable law; a mandatory local-language or interpretation rule continues to apply where it cannot be waived.</p>
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
      <p>Review the <a href="/terms">Terms of Service</a>, <a href="/privacy">Privacy Policy</a>, <a href="/subscription-terms">Subscription Terms</a>, <a href="/refund-policy">Refund &amp; Cancellation Policy</a>, <a href="/acceptable-use">Acceptable Use Policy</a>, and <a href="/cookies">Cookie Notice</a>.</p>
    ),
  },
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
    updated: "27 August 2026",
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

export function LegalDocumentPage({ documentKey, onBack }) {
  const document = documents[documentKey];

  return (
    <main className="legal-page" aria-labelledby="legal-title">
      <button className="legal-back" type="button" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" /> Back to Rillora
      </button>

      <header className="legal-hero">
        <p className="legal-eyebrow">{document.eyebrow}</p>
        <h1 id="legal-title">{document.title}</h1>
        <p className="legal-summary">{document.summary}</p>
        <dl className="legal-meta">
          <div><dt>Status</dt><dd>Effective</dd></div>
          <div><dt>Version</dt><dd>{document.version}</dd></div>
          <div><dt>Last updated</dt><dd>{document.updated}</dd></div>
        </dl>
        <button className="legal-print" type="button" onClick={() => window.print()}>
          Print or save a copy
        </button>
      </header>

      <div className="legal-layout">
        <nav className="legal-contents" aria-label={`${document.title} contents`}>
          <p>On this page</p>
          {document.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title.replace(/^\d+\.\s*/, "")}</a>)}
        </nav>

        <article className="legal-document">
          {document.sections.map((section) => (
            <section id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.content}
            </section>
          ))}
          <a className="legal-end-link" href="#legal-title">Return to top <ArrowUpRight size={16} aria-hidden="true" /></a>
        </article>
      </div>
    </main>
  );
}
