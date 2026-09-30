<!--
{
  "availability" : [
    "App Store Server Notifications: 2.0.0 -"
  ],
  "documentType" : "symbol",
  "framework" : "AppStoreServerNotifications",
  "identifier" : "/documentation/AppStoreServerNotifications/responseBodyV2DecodedPayload",
  "metadataVersion" : "0.1.0",
  "role" : "Object",
  "symbol" : {
    "kind" : "Object",
    "modules" : [
      "App Store Server Notifications"
    ],
    "preciseIdentifier" : "data:store_s2s:responseBodyV2DecodedPayload"
  },
  "title" : "responseBodyV2DecodedPayload"
}
-->

# responseBodyV2DecodedPayload

A decoded payload that contains the version 2 notification data.

```
object responseBodyV2DecodedPayload
```

## Discussion

The `responseBodyV2DecodedPayload` is the Base64URL-decoded notification information from the JWS payload portion of the [`signedPayload`](/documentation/AppStoreServerNotifications/signedPayload). Use the [`notificationType`](/documentation/AppStoreServerNotifications/notificationType) and [`subtype`](/documentation/AppStoreServerNotifications/subtype) to understand the event that led to this notification.

The payload can contain only one of the following four fields:

- A [`data`](/documentation/AppStoreServerNotifications/data) object, which contains details including the environment, the app metadata, and the signed transaction and subscription renewal information.
- An [`appData`](/documentation/AppStoreServerNotifications/appData) object, which contains details including the environment, the app metadata, and the signed app transaction information.
- A [`summary`](/documentation/AppStoreServerNotifications/summary) object, which contains information only when the notification is a `RENEWAL_EXTENSION` with a `SUMMARY` subtype. For more information, see <doc://com.apple.documentation/documentation/AppStoreServerAPI/Extend-Subscription-Renewal-Dates-for-All-Active-Subscribers>.
- An [`externalPurchaseToken`](/documentation/AppStoreServerNotifications/externalPurchaseToken) object, which contains an external purchase token only when the notification is `EXTERNAL_PURCHASE_TOKEN`. For more information about this notification, see [`externalPurchaseToken`](/documentation/AppStoreServerNotifications/externalPurchaseToken).

## Topics

### Response objects for in-app purchases

[`object summary`](/documentation/AppStoreServerNotifications/summary)

The payload data for a subscription-renewal-date extension notification.

[`object data`](/documentation/AppStoreServerNotifications/data)

The payload data that contains app metadata and the signed renewal and transaction information.

[`object appData`](/documentation/AppStoreServerNotifications/appData)

The object that contains the app metadata and signed app transaction information.

### Response object for an external purchase

[`object externalPurchaseToken`](/documentation/AppStoreServerNotifications/externalPurchaseToken)

The payload data that contains an external purchase token.

### Response types

[`string notificationType`](/documentation/AppStoreServerNotifications/notificationType)

The type that describes the In-App Purchase or external purchase event for which the App Store sends the version 2 notification.

[`string subtype`](/documentation/AppStoreServerNotifications/subtype)

A string that provides details about select notification types in version 2.

[`string version`](/documentation/AppStoreServerNotifications/version)

A string that indicates the notification’s App Store Server Notifications version number.

[`timestamp signedDate`](/documentation/AppStoreServerNotifications/signedDate)

The UNIX time, in milliseconds, that the App Store signed the JSON Web Signature data.

[`string notificationUUID`](/documentation/AppStoreServerNotifications/notificationUUID)

A unique identifier for the notification.

### JWS header and payload data types

[`object JWSTransactionDecodedPayload`](/documentation/AppStoreServerNotifications/JWSTransactionDecodedPayload)

A decoded payload that contains transaction information.

[`object JWSRenewalInfoDecodedPayload`](/documentation/AppStoreServerNotifications/JWSRenewalInfoDecodedPayload)

A decoded payload containing subscription renewal information for an auto-renewable subscription.

[`object JWSDecodedHeader`](/documentation/AppStoreServerNotifications/JWSDecodedHeader)

A decoded JSON Web Signature header containing transaction or renewal information.

[Transaction data types](/documentation/AppStoreServerNotifications/transaction-data-types)

Refer to these data types for decoded transaction and renewal information payloads.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)