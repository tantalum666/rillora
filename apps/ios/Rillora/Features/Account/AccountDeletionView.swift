import SwiftUI
import UniformTypeIdentifiers

struct AccountDeletionView: View {
    let service: any AccountDataServing
    let profile: AccountDataProfile
    let onRequested: (AccountDeletionReference) async -> Void
    @State private var word = ""
    @State private var savedCopies = false
    @State private var billing = false
    @State private var billingRequiredByServer = false
    @State private var confirm = false
    @State private var busy = false
    @State private var error: String?
    @State private var reference: AccountDeletionReference?
    private var needsBilling: Bool { billingRequiredByServer || profile.billing?.requiresAcknowledgement == true }
    var body: some View {
        RilloraForm {
            Section {
                Text(profile.account.displayName).font(.headline)
                Text("Your private map, people, saved packages and Rillora access will be removed.")
                Text("Required consent and payment records may be retained.").font(.footnote).foregroundStyle(RilloraTheme.muted)
            }
            Section {
                Toggle("I understand copies already saved or shared cannot be removed.", isOn: $savedCopies)
                    .accessibilityIdentifier("account-delete.copies")
                if needsBilling {
                    Toggle("I understand account deletion does not cancel provider billing.", isOn: $billing)
                    if profile.billing?.providers.contains("apple") == true || profile.billing?.providers.contains("storekit") == true {
                        Link("Manage Apple subscriptions", destination: URL(string: "https://apps.apple.com/account/subscriptions")!)
                    }
                }
                TextField("Type DELETE to confirm", text: $word).textInputAutocapitalization(.characters).autocorrectionDisabled()
                    .foregroundStyle(RilloraTheme.body).accessibilityIdentifier("account-delete.confirmation")
            }
            if let reference, let data = try? JSONEncoder().encode(reference) {
                Section { ShareLink(item: PrivateMapFile(data: data, filename: "rillora-deletion-reference.json"), preview: SharePreview("Deletion reference")) { Label("Save deletion reference", systemImage: "square.and.arrow.down") } }
            }
            if let error { Section { Label(error, systemImage: "exclamationmark.circle").foregroundStyle(RilloraTheme.clay) } }
            Section {
                Button("Delete account", role: .destructive) { confirm = true }
                    .disabled(busy || reference == nil || word != "DELETE" || !savedCopies || (needsBilling && !billing))
                    .accessibilityIdentifier("account-delete.submit")
                if busy { ProgressView("Requesting deletion…") }
            }
        }
        .rilloraStructuredList().rilloraFocusedTask().navigationTitle("Delete account").navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(busy)
        .task { do { reference = try AccountDeletionReference.create() } catch { self.error = error.localizedDescription } }
        .confirmationDialog("Delete this Rillora account?", isPresented: $confirm, titleVisibility: .visible) {
            Button("Delete account", role: .destructive) { Task { await request() } }
            Button("Keep my account", role: .cancel) {}
        } message: { Text("This cannot be undone. Keep a private map backup first if you need one.") }
    }
    private func request() async {
        guard let reference, !busy else { return }
        busy = true; error = nil
        do { try await AccountDeletionReferenceStore.save(reference) }
        catch { self.error = "The deletion reference could not be saved on this device. Try again before deleting."; busy = false; return }
        do {
            _ = try await service.requestAccountDeletion(receipt: reference.receipt, acknowledgesBilling: billing)
            await onRequested(reference)
        } catch let failure as RilloraAPIError {
            if case .server(let status, let code, _, _) = failure, status < 500 {
                if code == "billing_confirmation_required" { billingRequiredByServer = true }
                error = failure.localizedDescription; busy = false
            } else { await onRequested(reference) }
        } catch { await onRequested(reference) }
    }
}

struct AccountDeletionStatusView: View {
    let service: any AccountDataServing
    let initialReference: AccountDeletionReference
    @State private var status: AccountDeletionEnvelope.Status?
    @State private var reference: AccountDeletionReference?
    @State private var error: String?
    @State private var busy = false
    @State private var chooseFile = false
    private var currentReference: AccountDeletionReference { reference ?? initialReference }
    var body: some View {
        RilloraForm {
            Section {
                Label(status?.status == "completed" ? "Account deleted" : status == nil ? "Check deletion status" : "Deletion in progress", systemImage: status?.status == "completed" ? "checkmark.circle" : "clock")
                    .font(.headline).accessibilityIdentifier("account-delete.status")
                if status?.status == "completed" {
                    Text("Your account and private map have been removed from active systems. Saved copies and required retained records remain.")
                    Link("Privacy Policy", destination: RilloraLegalURLs.privacy)
                } else if status != nil {
                    Text("Access is closed while removal finishes. You can leave and check again with this reference.")
                }
                if let error { Text(error).foregroundStyle(RilloraTheme.clay) }
                Button(busy ? "Checking…" : "Check status") { Task { await refresh() } }.disabled(busy)
                    .accessibilityIdentifier("account-delete.check")
            }
            Section {
                if let data = try? JSONEncoder().encode(currentReference) {
                    ShareLink(item: PrivateMapFile(data: data, filename: "rillora-deletion-reference.json"), preview: SharePreview("Deletion reference")) { Label("Save deletion reference", systemImage: "square.and.arrow.down") }
                }
                Button("Open another reference") { chooseFile = true }.disabled(busy)
            }
        }
        .rilloraStructuredList().rilloraFocusedTask().navigationTitle("Deletion status").navigationBarTitleDisplayMode(.inline)
        .task { await refresh() }
        .fileImporter(isPresented: $chooseFile, allowedContentTypes: [.json]) { result in
            do {
                let url = try result.get(), access = url.startAccessingSecurityScopedResource()
                defer { if access { url.stopAccessingSecurityScopedResource() } }
                guard (try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0) <= 8192 else { throw RilloraAPIError.invalidResponse }
                let value = try JSONDecoder().decode(AccountDeletionReference.self, from: Data(contentsOf: url))
                guard value.isValid else { throw RilloraAPIError.invalidResponse }
                reference = value; status = nil; Task { await refresh() }
            } catch let error as NSError where error.code == NSUserCancelledError {} catch { self.error = "Choose a saved Rillora deletion reference." }
        }
    }
    private func refresh() async {
        guard !busy, currentReference.isValid else { return }
        busy = true; error = nil; defer { busy = false }
        do {
            let result = try await service.accountDeletionStatus(receipt: currentReference.receipt)
            guard ["pending", "completed"].contains(result.deletion.status) else { throw RilloraAPIError.invalidResponse }
            status = result.deletion
        } catch { self.error = "The request could not be confirmed. Check again with the reference saved when you requested deletion." }
    }
}
