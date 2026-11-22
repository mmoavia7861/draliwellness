# Admin email migration — Dr Ali Wellness

Goal: replace primary admin sign-in moavia400@gmail.com with alihassan0260060@gmail.com. Order-notification destination is configured separately in Cloudflare and is not affected by this change.

## Prerequisites — DO NOT MERGE UNTIL DONE

1. Keep current primary admin signed in at /admin in a safe session.
2. Have the intended owner register an account with alihassan0260060@gmail.com at /account using a unique password. If already registered, sign in instead.
3. The new account holder must open their verification email, verify it, then sign out and in again.
4. Existing primary admin goes to /admin -> Audience & Team -> Registered Customers. Copy the new user's Firebase UID (the profile should be visible after verification) and use Grant / Update Admin Access with the exact Gmail and Super Admin role.
5. Confirm the new user's admins/{uid} document is saved, and the new account can sign in at /admin, see orders, and access administration. **Do not delete the old admin until the new one is verified to work.**

## Cutover

1. Merge this PR only after the new verified account is able to access admin. This switches the client-side bootstrap email and repository Firestore rules from the old Gmail to the new one.
2. Publish the updated firestore.rules to the same Firebase Firestore database. GitHub deployment does NOT automatically publish database rules. Confirm the correct project and named database.
3. Sign in using the new email, check products, orders, coupons and settings.
4. In /admin -> Audience & Team, remove the old Gmail's admins/{uid} record. If old account remains in Firebase Authentication, disable or delete it separately as appropriate; avoid deleting any order records.
5. Sign out old sessions, test that old email no longer accesses admin. A hard-coded bootstrap or stale admins/{uid} registry document would leave access active, so check both.
6. If any verification fails, roll back using the previous owner session and do not revoke its access prematurely.

## Notes

- This repository change alone does not create a Firebase Auth user, verify an email, assign a new admin UID, or deploy Firestore rules.
- Never paste or share admin passwords or login verification codes with assistants.
- The order-alert inbox in Cloudflare is independent and remains unchanged.
