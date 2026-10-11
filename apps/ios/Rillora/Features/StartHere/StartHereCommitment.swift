import Foundation
import CryptoKit
import CoreFoundation

enum StartHereCommitment {
    static func verify(package: Any, expected: String) throws {
        let bytes = try canonicalBytes(package)
        let digest = Data(SHA256.hash(data: bytes)).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        guard digest == expected else {
            throw StartHereEncryptionError.invalidRecoveredPayload
        }
    }

    static func canonicalBytes(_ value: Any) throws -> Data {
        let root = try object(value, required: ["schemaVersion","planner","plan","matters","trustedContacts","directionsNotPasswords","legalAuthorityNotGranted"], optional: ["audience"])
        guard root["schemaVersion"] as? String == "start-here-v1",
              isTrue(root["directionsNotPasswords"]),
              isTrue(root["legalAuthorityNotGranted"]),
              let matters = root["matters"] as? [Any], matters.count <= 500,
              let people = root["trustedContacts"] as? [Any], people.count <= 200 else { throw invalid }
        var fields = [("schemaVersion", try text(root["schemaVersion"]))]
        if let raw = root["audience"], !(raw is NSNull) {
            let a = try object(raw, required: ["kind"], optional: ["connectionPublicId","name","version"])
            let version: String
            if let rawVersion = a["version"], !(rawVersion is NSNull) {
                guard let number = rawVersion as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID(),
                      number.doubleValue >= 1, number.doubleValue <= 9_007_199_254_740_991,
                      number.doubleValue.rounded() == number.doubleValue else { throw invalid }
                version = String(number.int64Value)
            } else { version = "null" }
            fields.append(("audience", pairs([("kind",try text(a["kind"])),("connectionPublicId",try nullable(a["connectionPublicId"])),
                                              ("name",try nullable(a["name"])),("version",version)])))
        }
        let planner = try object(root["planner"] as Any, required: ["display_name","locale","time_zone"])
        fields.append(("planner",pairs(try ["display_name","locale","time_zone"].map { ($0,try text(planner[$0])) })))
        let plan = try object(root["plan"] as Any, required: ["status"])
        fields.append(("plan",pairs([("status",try text(plan["status"]))])))
        fields.append(("matters","[" + (try matters.map { item in
            let m = try object(item, required:["publicId","category","title"],optional:["institutionName","locationHint","desiredOutcome","status"])
            return pairs(try ["publicId","category","title"].map { ($0,try text(m[$0])) }
                         + ["institutionName","locationHint","desiredOutcome","status"].map { ($0,try nullable(m[$0])) })
        }).joined(separator:",") + "]"))
        fields.append(("trustedContacts","[" + (try people.map { item in
            let p = try object(item,required:["displayName"],optional:["relationshipLabel"])
            return pairs([("displayName",try text(p["displayName"])),("relationshipLabel",try nullable(p["relationshipLabel"]))])
        }).joined(separator:",") + "]"))
        fields += [("directionsNotPasswords","true"),("legalAuthorityNotGranted","true")]
        return Data(pairs(fields).utf8)
    }

    private static var invalid: StartHereEncryptionError { .invalidRecoveredPayload }
    private static func isTrue(_ value: Any?) -> Bool {
        guard let number = value as? NSNumber, CFGetTypeID(number) == CFBooleanGetTypeID() else { return false }
        return number.boolValue
    }
    private static func object(_ value: Any, required: [String], optional: [String] = []) throws -> [String: Any] {
        guard let value = value as? [String: Any], required.allSatisfy({value[$0] != nil}),
              value.keys.allSatisfy({required.contains($0) || optional.contains($0)}) else { throw invalid }
        return value
    }
    private static func text(_ value: Any?) throws -> String {
        guard let value = value as? String else { throw invalid }
        return String(decoding: try JSONSerialization.data(withJSONObject:value,options:[.fragmentsAllowed,.withoutEscapingSlashes]),as:UTF8.self)
    }
    private static func nullable(_ value: Any?) throws -> String {
        value == nil || value is NSNull ? "null" : try text(value)
    }
    private static func pairs(_ values: [(String,String)]) -> String {
        "{" + values.map { "\"\($0.0)\":\($0.1)" }.joined(separator:",") + "}"
    }
}
