import Foundation

public enum CheckInCadence: Int, Codable, CaseIterable, Sendable { case day = 86400, threeDays = 259200, week = 604800 }
enum CheckInAction: String, Codable, Sendable { case confirm, pause, resume }
enum CheckInOrigin: String, Codable, Sendable { case phone, watch }
enum CheckInFailure: Error, Equatable { case invalid, unlinked, changed, expired, permission, storage, scheduling }

struct CheckInCommand: Codable, Sendable, Equatable {
    let id: UUID
    let binding: UUID
    let expectedRevision: Int
    let action: CheckInAction
    let reportedAt: Date
}
struct CheckInConfirmation: Codable, Sendable, Equatable {
    let reportedAt: Date
    let receivedAt: Date
    let origin: CheckInOrigin
}
struct CheckInReceipt: Codable, Sendable, Equatable {
    let command: CheckInCommand
    let receivedAt: Date
}

struct CheckInState: Codable, Sendable, Equatable {
    let account: String
    let binding: UUID
    var revision = 0
    var enabled = false
    var cadence: CheckInCadence = .day
    var nextDue: Date?
    var confirmation: CheckInConfirmation?
    var receipts: [CheckInReceipt] = []
    var changedAt: Date

    init(account: String, now: Date) { self.account = account; binding = UUID(); changedAt = now }
    func validated() throws -> Self {
        guard UUID(uuidString: account) != nil, revision >= 0, revision < Int.max - 1, receipts.count <= 32,
              changedAt.timeIntervalSince1970.isFinite, enabled == (nextDue != nil),
              nextDue.map({ $0.timeIntervalSince1970.isFinite }) ?? true else { throw CheckInFailure.invalid }
        return self
    }
    mutating func configure(enabled: Bool, cadence: CheckInCadence, now: Date) {
        self.enabled = enabled; self.cadence = cadence
        nextDue = enabled ? now.addingTimeInterval(Double(cadence.rawValue)) : nil
        revision += 1; changedAt = now
    }
    mutating func apply(_ command: CheckInCommand, origin: CheckInOrigin, now: Date) throws -> Bool {
        guard command.binding == binding else { throw CheckInFailure.unlinked }
        // A repeated command has an exact body match; an ID cannot be reused for another action.
        if let receipt = receipts.first(where: { $0.command.id == command.id }) {
            guard receipt.command == command else { throw CheckInFailure.invalid }; return false
        }
        let age = now.timeIntervalSince(command.reportedAt)
        guard age.isFinite, age >= -300, age <= 86400 else { throw CheckInFailure.expired }
        guard command.expectedRevision == revision else { throw CheckInFailure.changed }
        switch command.action {
        case .confirm:
            confirmation = .init(reportedAt: command.reportedAt, receivedAt: now, origin: origin)
            // This is a reminder cadence from receipt, never a health or disclosure deadline.
            if enabled { nextDue = now.addingTimeInterval(Double(cadence.rawValue)) }
        case .pause: enabled = false; nextDue = nil
        case .resume: enabled = true; nextDue = now.addingTimeInterval(Double(cadence.rawValue))
        }
        revision += 1; changedAt = now
        receipts.append(.init(command: command, receivedAt: now)); receipts = Array(receipts.suffix(32))
        return true
    }
}

// This allowlisted snapshot has no account identifier, health values, family,
// matter, credential or disclosure fields. Watch receipts only mean phone acceptance.
struct CheckInSnapshot: Codable, Sendable, Equatable {
    var version = 1
    let binding: UUID?
    let revision: Int
    let available: Bool
    let enabled: Bool
    let cadence: CheckInCadence
    let nextDue: Date?
    let confirmation: CheckInConfirmation?
    let receiptIDs: [UUID]
    let updatedAt: Date
    let notificationsAllowed: Bool
    let reminderScheduled: Bool
    static func unlinked(now: Date) -> Self {
        .init(binding: nil, revision: 0, available: false, enabled: false, cadence: .day, nextDue: nil,
              confirmation: nil, receiptIDs: [], updatedAt: now, notificationsAllowed: false, reminderScheduled: false)
    }
    func validated() throws -> Self {
        guard version == 1, revision >= 0, receiptIDs.count <= 32, updatedAt.timeIntervalSince1970.isFinite,
              !available || binding != nil, enabled == (nextDue != nil) else { throw CheckInFailure.invalid }
        return self
    }
}
struct CheckInReply: Codable, Sendable {
    let snapshot: CheckInSnapshot
    let acceptedID: UUID?
    let rejection: String?
}
struct CheckInEnvelope: Codable, Sendable {
    let version: Int
    let command: CheckInCommand?
    static let refresh = Self(version: 1, command: nil)
}
enum CheckInWire {
    static let key = "rilloraCheckInV1"
    static let limit = 32768
    static func encode<T: Encodable>(_ value: T) throws -> Data {
        let data = try JSONEncoder().encode(value)
        guard data.count <= limit else { throw CheckInFailure.invalid }; return data
    }
    static func decode<T: Decodable>(_ type: T.Type, _ data: Data) throws -> T {
        guard !data.isEmpty, data.count <= limit else { throw CheckInFailure.invalid }
        return try JSONDecoder().decode(type, from: data)
    }
}
