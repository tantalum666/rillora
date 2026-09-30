import Foundation

enum OfficialProviderGuideKind: String, Sendable {
    case prepareNow
    case estateRequest
    case prepareAndRequest

    var label: String {
        switch self {
        case .prepareNow: "Set up now"
        case .estateRequest: "Estate request"
        case .prepareAndRequest: "Set up + request"
        }
    }
}

struct OfficialProviderLink: Identifiable, Equatable, Sendable {
    let title: String
    let detail: String
    let urlString: String

    var id: String { urlString }
    var url: URL? { URL(string: urlString) }
    var hostLabel: String {
        guard let host = url?.host else { return "Official site" }
        return host.replacingOccurrences(of: "www.", with: "")
    }
}

struct OfficialProviderGuide: Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let systemImage: String
    let kind: OfficialProviderGuideKind
    let summary: String
    let prepareSteps: [String]
    let laterSteps: [String]
    let usuallyRequested: [String]
    let boundary: String
    let links: [OfficialProviderLink]
    let lastReviewed: String

    var supportsSelfReportedCheck: Bool {
        OfficialProviderGuideCatalog.selfReportedProviderKeys.contains(id)
    }
}

enum OfficialProviderGuideCatalog {
    static let selfReportedProviderKeys: Set<String> = [
        "apple", "google", "meta", "github", "password_manager",
    ]

    static let priorityGuides = [apple, google, meta, github, passwordManager]
    static let estateRequestGuides = [microsoft, linkedin, x, paypal, coinbase, binance]
    static let all = priorityGuides + estateRequestGuides

    static func guide(for providerKey: String) -> OfficialProviderGuide? {
        all.first { $0.id == providerKey }
    }

    private static let reviewed = "20 Aug 2026"

    private static let apple = OfficialProviderGuide(
        id: "apple",
        name: "Apple",
        systemImage: "apple.logo",
        kind: .prepareAndRequest,
        summary: "Name a Legacy Contact and share the access key.",
        prepareSteps: [
            "On iPhone or iPad, open Settings › your name › Sign-In & Security › Legacy Contact.",
            "Add one or more people, then share or print each person’s access key.",
            "Confirm the contact received the key and keep a second copy with estate documents.",
        ],
        laterSteps: [
            "The Legacy Contact opens Apple’s Digital Legacy request site.",
            "Submit the access key and death certificate; Apple may request additional regional legal documents.",
            "After approval, use the special Legacy Contact Apple Account within Apple’s access window.",
        ],
        usuallyRequested: ["Legacy Contact access key", "Death certificate", "Possible court or regional documents"],
        boundary: "Apple does not release iCloud Keychain passwords, passkeys or payment information, and purchased media or subscriptions do not transfer through Legacy Contact.",
        links: [
            .init(title: "Set up Legacy Contact", detail: "Apple Support instructions", urlString: "https://support.apple.com/en-us/102631"),
            .init(title: "Request access", detail: "Apple Digital Legacy", urlString: "https://digital-legacy.apple.com/"),
        ],
        lastReviewed: reviewed
    )

    private static let google = OfficialProviderGuide(
        id: "google",
        name: "Google",
        systemImage: "clock.arrow.circlepath",
        kind: .prepareAndRequest,
        summary: "Choose inactivity timing, contacts, data and deletion.",
        prepareSteps: [
            "Open Google Inactive Account Manager while signed in.",
            "Choose the inactivity period, up to ten contacts, and which data each person may receive.",
            "Choose whether Google should delete the account and keep contact details current.",
        ],
        laterSteps: [
            "Use Google’s deceased-user request form to ask for account closure, funds or selected content.",
            "Choose the request type before closing the account; closure can prevent a later content request.",
            "Follow Google’s identity and document review without asking for the password.",
        ],
        usuallyRequested: ["Google Account identifier", "Requestor identity", "Death and relationship or authority evidence"],
        boundary: "Inactivity is not a death determination. Google never provides passwords, and content or funds are released only after case review, if at all.",
        links: [
            .init(title: "Open Inactive Account Manager", detail: "Google Account", urlString: "https://myaccount.google.com/inactive"),
            .init(title: "Request help for a deceased user", detail: "Google Account Help", urlString: "https://support.google.com/accounts/troubleshooter/6357590?hl=en"),
        ],
        lastReviewed: reviewed
    )

    private static let meta = OfficialProviderGuide(
        id: "meta",
        name: "Facebook & Instagram",
        systemImage: "person.2.crop.square.stack.fill",
        kind: .prepareAndRequest,
        summary: "Set Facebook memorialization; keep Instagram’s request route.",
        prepareSteps: [
            "In Facebook Accounts Centre, open Personal details › Account ownership and control › Memorialisation.",
            "Choose a Facebook Legacy Contact or Delete after death, and decide whether downloads are allowed.",
            "Record the Instagram profile URL separately; Instagram does not publish the same Legacy Contact setting.",
        ],
        laterSteps: [
            "Report Facebook for memorialization or request removal with the appropriate documents.",
            "Use Instagram’s separate deceased-account form for memorialization or removal.",
            "Do not attempt to sign in as the deceased person.",
        ],
        usuallyRequested: ["Profile URL", "Proof of death", "Relationship or estate authority for removal"],
        boundary: "A Facebook Legacy Contact cannot log in or read messages. Meta does not provide another person’s login details; Instagram uses a separate request process.",
        links: [
            .init(title: "Set Facebook Legacy Contact", detail: "Facebook Help Center", urlString: "https://www.facebook.com/help/1070665206293088"),
            .init(title: "Manage a deceased Facebook account", detail: "Facebook Help Center", urlString: "https://www.facebook.com/help/275013292838654"),
            .init(title: "Report a deceased Instagram account", detail: "Instagram help from Meta", urlString: "https://www.facebook.com/help/264154560391256/"),
        ],
        lastReviewed: reviewed
    )

    private static let github = OfficialProviderGuide(
        id: "github",
        name: "GitHub",
        systemImage: "chevron.left.forwardslash.chevron.right",
        kind: .prepareAndRequest,
        summary: "Invite a repository successor before access is needed.",
        prepareSteps: [
            "On GitHub, open Settings › Account › Successor settings.",
            "Invite another GitHub user and confirm that they accepted the successor request.",
            "Move critical collaborative work to an organization with another owner where appropriate.",
        ],
        laterSteps: [
            "The successor or authorized person contacts GitHub Support and states the requested action.",
            "Provide the account username, relationship and successor username if one was designated.",
            "Respond to requests for identity, death and authority documents.",
        ],
        usuallyRequested: ["GitHub username", "Death certificate or obituary", "Identity and authority evidence"],
        boundary: "A successor cannot sign in as the user. Successor powers concern public user-owned repositories; private content, organization rights and billing follow separate rules.",
        links: [
            .init(title: "Invite an account successor", detail: "GitHub Docs", urlString: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/maintaining-ownership-continuity-of-your-personal-accounts-repositories"),
            .init(title: "Read the deceased-user policy", detail: "GitHub Docs", urlString: "https://docs.github.com/en/site-policy/other-site-policies/github-deceased-user-policy"),
        ],
        lastReviewed: reviewed
    )

    private static let passwordManager = OfficialProviderGuide(
        id: "password_manager",
        name: "Password managers",
        systemImage: "key.horizontal.fill",
        kind: .prepareNow,
        summary: "Use the provider’s recovery or emergency-access design.",
        prepareSteps: [
            "For Bitwarden, invite, confirm and configure a trusted Emergency Access contact and wait period.",
            "For 1Password Families, add another Family Organizer, save the Emergency Kit and generate a recovery code.",
            "Test the chosen recovery path without placing a master password, Secret Key or recovery code in Rillora.",
        ],
        laterSteps: [
            "A Bitwarden emergency contact requests access and waits for approval or the configured delay.",
            "A 1Password Family Organizer can begin member recovery; that is account recovery, not a legal estate determination.",
        ],
        usuallyRequested: ["Accepted emergency contact or organizer", "Provider recovery artifacts", "Access to the provider account used by the helper"],
        boundary: "Emergency access can expose highly sensitive vault data and is not legal authority. Provider support usually cannot recreate zero-knowledge secrets that were never prepared.",
        links: [
            .init(title: "Set up Bitwarden Emergency Access", detail: "Bitwarden Help", urlString: "https://bitwarden.com/help/emergency-access/"),
            .init(title: "Create a 1Password family recovery plan", detail: "1Password Support", urlString: "https://support.1password.com/family-recovery-plan/"),
        ],
        lastReviewed: reviewed
    )

    private static let microsoft = OfficialProviderGuide(
        id: "microsoft",
        name: "Microsoft",
        systemImage: "folder.badge.person.crop",
        kind: .estateRequest,
        summary: "Outlook and OneDrive access depends heavily on region and law.",
        prepareSteps: [
            "Record the Microsoft account identifier and where subscription billing can be found.",
            "Do not share the password; Microsoft does not publish a consumer Legacy Contact setting.",
        ],
        laterSteps: [
            "Use Microsoft’s deceased-account guidance for the account’s country or region.",
            "Cancel recurring charges through the payment source if account access is unavailable.",
            "For account content, expect a court-order route in many regions; China and Germany have documented alternatives.",
        ],
        usuallyRequested: ["Account identifier", "Death certificate", "Court order or region-specific relationship and authority documents"],
        boundary: "A request does not guarantee account content. Microsoft’s process and acceptable documents vary materially by region.",
        links: [
            .init(title: "Read Microsoft’s deceased-account process", detail: "Microsoft Support", urlString: "https://support.microsoft.com/en-us/account-billing/accessing-outlook-com-onedrive-and-other-microsoft-services-when-someone-has-died-ebbd2860-917e-4b39-9913-212362da6b2f"),
        ],
        lastReviewed: reviewed
    )

    private static let linkedin = OfficialProviderGuide(
        id: "linkedin",
        name: "LinkedIn",
        systemImage: "person.crop.rectangle.stack.fill",
        kind: .estateRequest,
        summary: "Memorialize the profile or request closure with authority.",
        prepareSteps: [
            "Record the profile URL and account email so a future request can identify the correct member.",
            "Decide whether memorialization or closure better matches the intended outcome.",
        ],
        laterSteps: [
            "Anyone can report a death for memorialization with the required identifying information.",
            "Only an authorized estate representative can request closure.",
            "Submit LinkedIn’s form with the profile, death information and accepted court-issued authority documents.",
        ],
        usuallyRequested: ["Profile URL and email", "Obituary or death information", "Court-issued estate authority for closure"],
        boundary: "LinkedIn never provides the username or password. Memorialization locks access; a will alone is not on LinkedIn’s listed set of approved authority documents for closure.",
        links: [
            .init(title: "Memorialize or close an account", detail: "LinkedIn Help", urlString: "https://www.linkedin.com/help/linkedin/answer/a1336663/memorialize-or-close-the-account-of-a-deceased-member?lang=en"),
        ],
        lastReviewed: reviewed
    )

    private static let x = OfficialProviderGuide(
        id: "x",
        name: "X",
        systemImage: "bubble.left.and.bubble.right.fill",
        kind: .estateRequest,
        summary: "An authorized representative or close family member can request deactivation.",
        prepareSteps: [
            "Record the profile handle and URL, plus the preferred outcome.",
            "Do not plan around another person receiving account access; X does not offer it through this process.",
        ],
        laterSteps: [
            "Submit X’s deceased-user removal request.",
            "Follow the emailed instructions for identity and death-certificate evidence.",
        ],
        usuallyRequested: ["Account handle", "Requestor ID", "Death certificate", "Estate authority or verified immediate-family relationship"],
        boundary: "X’s published route deactivates the account. It does not give family members or representatives account access.",
        links: [
            .init(title: "Contact X about a deceased user", detail: "X Help Center", urlString: "https://help.x.com/en/rules-and-policies/contact-x-about-a-deceased-family-members-account"),
        ],
        lastReviewed: reviewed
    )

    private static let paypal = OfficialProviderGuide(
        id: "paypal",
        name: "PayPal",
        systemImage: "creditcard.fill",
        kind: .estateRequest,
        summary: "The executor or administrator can request closure and balance handling.",
        prepareSteps: [
            "Record the primary PayPal email and the country or PayPal entity for the account.",
            "State the intended outcome without storing a password or payment credential.",
        ],
        laterSteps: [
            "The authorized executor or administrator follows PayPal’s regional deceased-account process.",
            "Submit the requested letter, identity, death and estate-authority documents.",
            "Give lawful instructions for any remaining balance and wait for PayPal’s review.",
        ],
        usuallyRequested: ["Primary account email", "Death certificate", "Executor photo ID", "Will or estate appointment", "Balance instructions"],
        boundary: "Requirements and balance options vary by PayPal entity and country. Closure is an estate request, not permission to impersonate the account holder.",
        links: [
            .init(title: "Read PayPal’s deceased-account steps", detail: "PayPal Help — US example", urlString: "https://www.paypal.com/us/cshelp/article/how-do-i-close-the-paypal-account-of-a-deceased-relative-help220"),
        ],
        lastReviewed: reviewed
    )

    private static let coinbase = OfficialProviderGuide(
        id: "coinbase",
        name: "Coinbase",
        systemImage: "bitcoinsign.circle.fill",
        kind: .estateRequest,
        summary: "Use Executor Services; individual accounts do not name a beneficiary.",
        prepareSteps: [
            "Record the Coinbase account email and include the custodial assets in reviewed estate documents.",
            "Do not put the password, 2FA recovery code or wallet seed in Rillora.",
            "Coinbase states that individual accounts currently cannot name a beneficiary directly.",
        ],
        laterSteps: [
            "The claimant signs in to or creates their own Coinbase account.",
            "Open the Executor Services form and upload the required documents.",
            "Provide signed instructions directing transfer to the specified account.",
        ],
        usuallyRequested: ["Death certificate", "Probate or estate appointment", "Claimant government ID", "Signed transfer instructions"],
        boundary: "Estate documents or applicable succession law determine ownership. Requirements vary by region, and Coinbase—not Rillora—reviews and transfers custodial assets.",
        links: [
            .init(title: "Claim a deceased Coinbase account", detail: "Coinbase Help", urlString: "https://help.coinbase.com/en/coinbase/managing-my-account/other/how-do-i-gain-access-to-a-deceased-family-members-coinbase-account"),
        ],
        lastReviewed: reviewed
    )

    private static let binance = OfficialProviderGuide(
        id: "binance",
        name: "Binance",
        systemImage: "building.columns.fill",
        kind: .estateRequest,
        summary: "Start an inheritance case with the exact regional Binance entity.",
        prepareSteps: [
            "Record whether the account is Binance.com, Binance.US or another regional entity, plus a safe account locator.",
            "Include custodial exchange assets in reviewed estate documents; do not share the login or 2FA codes.",
            "Keep self-custody wallets separate: Binance cannot recover a private key or seed it does not hold.",
        ],
        laterSteps: [
            "An executor or authorized beneficiary starts a case through official Binance support for the correct entity.",
            "Provide death, identity and estate-authority documents requested for that region.",
            "For Binance.US, follow its dedicated deceased-user asset-collection instructions.",
        ],
        usuallyRequested: ["Exact Binance entity and account locator", "Death certificate", "Claimant ID", "Will, probate or court authority"],
        boundary: "No public global Binance Legacy Contact switch was verified. The published process is an inheritance/support application, varies by entity and does not authorize signing in as the deceased user.",
        links: [
            .init(title: "Open Binance support", detail: "Binance.com official chat", urlString: "https://www.binance.com/en/chat"),
            .init(title: "Read Binance.US deceased-user steps", detail: "Binance.US Help Center", urlString: "https://support.binance.us/en/articles/10395308-collecting-funds-from-a-deceased-user-s-account"),
        ],
        lastReviewed: reviewed
    )
}
