# Security Specification — Dr. Ali Hassan Health & Wellness

## 1. Data Invariants
1. **Product Publication Compliance Gate**: Public `get` and `list` on `/products/{productId}` require `published == true && complianceStatus == 'approved'` unless the caller is a verified admin (`isAdmin()`).
2. **PII Isolation**: Customer PII (`orders`, `appointments`, `contactInquiries`, `newsletterSubscribers`, `users/{userId}/private/profile`) is NEVER publicly readable or listable. Only the authenticated owner (`request.auth.uid == userId`) or a verified admin (`isAdmin()`) may read their own records.
3. **Guest Tracking Verification**: `/orderTracking/{trackingKey}` excludes raw PII (no street address, no phone, no email), disables `allow list: if false`, and requires an unguessable verification key `SHA256(orderNumber + ':' + normalizedContact)` for `allow get`.
4. **Atomic Order + Tracking Write**: Creating an order in `/orders/{orderId}` requires `existsAfter(/databases/$(database)/documents/orderTracking/$(incoming().trackingKey))` so order creation and verification-gated tracking stay in sync.
5. **No Self-Assigned Roles**: Customers cannot write `role`, `isAdmin`, or any document under `/admins/{userId}` unless they are already an admin or match the verified bootstrapped admin email (`moavia400@gmail.com` with `email_verified == true`).
6. **Temporal & Structural Integrity**: All created documents enforce `createdAt == request.time`, `isValidId()` regex guards on path variables, strict `keys().hasAll(...)` + `keys().hasOnly(...)`, and explicit `.size()` bounds on all strings and lists.
7. **Terminal State Protection**: Cancelled or delivered orders cannot be modified by customers; only admins can manage fulfillment transitions.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Field Injection on Order**: Order payload adds `isPaidOverride: true` or `role: "admin"` -> rejected by `keys().hasOnly(...)`.
2. **Status Shortcutting on Order Creation**: Guest/customer submits `status: "delivered"` or `paymentStatus: "paid"` on create -> rejected (`status == 'placed' && paymentStatus == 'pending'`).
3. **Admin Privilege Escalation**: Non-admin user tries to write `/admins/{uid}` with `role: "super_admin"` -> rejected by `isAdmin()`.
4. **Unapproved Product Scraping**: Visitor queries `products` where `published == false` -> rejected by `allow list`.
5. **Cross-User Order Snooping**: Signed-in user A tries to `get` or `list` user B's order in `/orders` -> rejected.
6. **Email Spoofing Attack**: User with unverified email token (`email_verified == false`) attempts admin action or verified profile write -> rejected.
7. **ID Poisoning**: Document creation with 1,500-char ID or invalid characters `../admin` -> rejected by `isValidId()`.
8. **Guest Tracking Enumeration**: Unauthenticated user runs `list` on `/orderTracking` -> rejected by `allow list: if false`.
9. **Contact Inbox Scraping**: Signed-in non-admin customer attempts `list` on `/contactInquiries` -> rejected by `isAdmin()`.
10. **Fake Review Auto-Approval**: Customer creates `/reviews/{id}` with `approved: true` -> rejected (`incoming().approved == false`).
11. **Oversized Payload Denial-of-Wallet**: Product/order/inquiry payload injects 50KB description string -> rejected by `.size()` checks.
12. **Timestamp Forgery**: Client submits custom `createdAt` timestamp instead of `request.time` -> rejected by `incoming().createdAt == request.time`.
