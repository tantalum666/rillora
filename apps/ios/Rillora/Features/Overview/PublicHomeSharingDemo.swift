import SwiftUI

struct PublicHomeSharingDemo: View {
    let palette: PublicHomePalette
    @State private var person: PublicHomeExamplePerson = .mum
    @State private var expandedID: String?
    @RilloraReduceMotion private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text(String(localized: "Let the right people\nsee the right details."))
                .font(.system(.largeTitle, design: .serif)).foregroundStyle(palette.ink)
                .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
            Text(String(localized: "Choose a person. Choose their view."))
                .font(.body).foregroundStyle(palette.muted)
            HStack(spacing: 32) {
                ForEach(PublicHomeExamplePerson.allCases) { candidate in
                    Button {
                        expandedID = nil
                        person = candidate
                    } label: {
                        VStack(spacing: 8) {
                            Text(candidate.initial).font(.system(size: 32, design: .serif))
                                .frame(width: 64, height: 64)
                                .background(person == candidate ? palette.bronze.opacity(0.14) : .clear, in: Circle())
                                .overlay(Circle().stroke(person == candidate ? palette.bronze : palette.rule, lineWidth: 2))
                                .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: person)
                                .overlay(alignment: .bottomTrailing) {
                                    if person == candidate {
                                        Image(systemName: "checkmark").font(.system(size: 11, weight: .semibold))
                                            .padding(5).background(palette.bronze, in: Circle())
                                            .foregroundStyle(palette.paper).accessibilityHidden(true)
                                    }
                                }
                            Text(candidate.title).font(.body.weight(.medium))
                        }.foregroundStyle(palette.ink).padding(4).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(person == candidate ? [.isSelected] : [])
                    .accessibilityLabel(candidate.title)
                    .accessibilityIdentifier("public-home.person.\(candidate.rawValue)")
                }
            }
            .frame(maxWidth: .infinity)
            Text(String(localized: "INTERACTIVE EXAMPLE"))
                .font(.caption).tracking(1.5).foregroundStyle(palette.muted)
                .frame(maxWidth: .infinity)
            sheet
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("public-overview.explorer")
    }

    private var sheet: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(L10n.format("Shared with %1$@", person.title))
                .font(.system(.title2, design: .serif)).foregroundStyle(palette.ink)
                .padding(.bottom, 20).accessibilityAddTraits(.isHeader)
            ForEach(person.matters) { matter in
                VStack(alignment: .leading, spacing: 0) {
                    Button {
                        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) {
                            expandedID = expandedID == matter.id ? nil : matter.id
                        }
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: matter.symbol).font(.title3).frame(width: 26)
                            VStack(alignment: .leading, spacing: 5) {
                                Text(matter.title).font(.body.weight(.medium))
                                Text(matter.detail).font(.subheadline).foregroundStyle(palette.muted)
                            }
                            Spacer(minLength: 0)
                            Image(systemName: "chevron.down").font(.caption)
                                .rotationEffect(.degrees(expandedID == matter.id ? 180 : 0))
                        }
                        .foregroundStyle(palette.ink).padding(.vertical, 16)
                        .frame(minHeight: 54).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityValue(expandedID == matter.id ? String(localized: "Expanded") : String(localized: "Collapsed"))
                    .accessibilityIdentifier("public-home.example.\(matter.id)")
                    if expandedID == matter.id {
                        Text(matter.note).font(.subheadline).foregroundStyle(palette.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.bottom, 16).transition(.opacity)
                    }
                    palette.rule.frame(height: 1)
                }
            }
            Text(L10n.format("%1$lld matters shared. Everything else stays private.", person.matters.count))
                .font(.footnote).foregroundStyle(palette.muted).padding(.top, 16)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(22).background(palette.sheet, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(palette.rule, lineWidth: 1))
    }
}

/// Local explanatory examples only; these never enter the account/API model.
enum PublicHomeExamplePerson: String, CaseIterable, Identifiable {
    case mum, alex
    var id: String { rawValue }
    var title: String { self == .mum ? String(localized: "Mum") : "Alex" }
    var initial: String { self == .mum ? "M" : "A" }
    var matters: [PublicHomeExampleMatter] {
        switch self {
        case .mum:
            [PublicHomeExampleMatter(id: "insurance", title: String(localized: "Insurance"), detail: String(localized: "Policy location"), symbol: "doc.text",
                note: String(localized: "Example: policy documents are in the green folder at home. Contact the insurer for the next step.")),
             PublicHomeExampleMatter(id: "home", title: String(localized: "Home documents"), detail: String(localized: "Where to find them"), symbol: "house",
                note: String(localized: "Example: property records and the solicitor’s contact details are kept together in the home documents folder."))]
        case .alex:
            [PublicHomeExampleMatter(id: "crypto", title: String(localized: "Crypto account"), detail: String(localized: "Exchange and next steps"), symbol: "building.columns",
                note: String(localized: "Example: the account is held at an exchange. Use its official estate request process; no passwords or recovery phrases belong here."))]
        }
    }
}

struct PublicHomeExampleMatter: Identifiable {
    let id: String
    let title: String
    let detail: String
    let symbol: String
    let note: String
}
