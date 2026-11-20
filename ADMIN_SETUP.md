# Dr. Ali Wellness — Admin Panel Setup & Verification

This project uses a React/Vite frontend deployed on GitHub Pages and Firebase for client-side Authentication, Firestore and product image Storage.

## Admin page
- Public storefront: https://mmoavia7861.github.io/draliwellness/
- Admin login: https://mmoavia7861.github.io/draliwellness/admin
- Only verified, explicitly authorized Firebase Email/Password users may load protected admin data. Admin navigation links are hidden from regular customers, but **Firestore rules are the actual security boundary**.

## Firebase setup (must be performed in the Firebase Console)
1. Open the Firebase project named in `firebase-applet-config.json`.
2. Authentication → Sign-in method: enable **Email/Password** (not Email link). The website no longer uses Google OAuth.
3. Authentication → Settings → Authorized domains: add `mmoavia7861.github.io` (domain only, no path/https).
4. Firestore Database: select the **named database** shown in `firebase-applet-config.json` (`firestoreDatabaseId`), not another database.
5. In this database's Rules tab, review and publish the repository's `firestore.rules`. GitHub commits **do not automatically publish Firebase rules**.
6. Storage: enable the Firebase Storage bucket configured by `storageBucket`. In Storage → Rules, review and publish `storage.rules`. The file-upload control requires these Storage rules.
7. Provision the owner as a Firebase Authentication user with an email/password credential. The verified owner email is already configured in the source as the bootstrap administrator; other admin members must already be permitted in Firestore.
8. If the email was previously used with Google OAuth, **preserve its existing Firebase user UID** and add an email/password sign-in method to that same Firebase user. Use a password-reset link from Firebase Authentication → Users when supported, or an authorized one-time Firebase Admin SDK / linking procedure. Do not create a second conflicting user or store any password in GitHub, Firestore, messages, or screenshots.
9. Confirm the user has `emailVerified = true`. For new customer accounts, the app sends a verification email; after verification sign out and sign in again.
10. Disable the Google sign-in provider in Firebase only after all users who need continued access are migrated. The app does not show Google login buttons.
8. Test product editing and save to Firestore from the real `/admin` page; refresh the storefront and verify the displayed price.

## Working features and restrictions
- Product editing, order management, banners, CMS, coupons, appointment administration and customer support data are implemented as Firestore client interactions.
- Product image uploads use Firebase Storage (JPG/PNG/WebP, <=5 MB) and require owner authorization.
- The **Initialize Missing Defaults** button only inserts absent seed documents; it must never overwrite live prices, inventory or edited CMS.
- The store's initial BrainAxis Energy Boost price is **PKR 1,350** for both the base product and its one-pack variant. If old products already exist in Firestore, update them using the Products tab to make the live database agree.
- On GitHub Pages, the Express server in `server.ts` does **not** run. Any `/api/*` functionality such as server-powered AI and payment capabilities requires a separately hosted, secured backend. Do not assume those features are working on Pages.
- Product claims, supplement authorization and payment processing must be validated before launch.

## Smoke-test checklist
- Open `/admin` without signing in; email and password fields plus Forgot Password should appear, not Google OAuth.
- Sign in with a non-admin user; protected collections must remain inaccessible.
- Sign in with the authorized verified administrator using the Firebase Authentication password (not the Gmail inbox password).
- Open Products → change selling price on a single-variant product; variant must update.
- Change CMS headline, save and verify the storefront reflects it.
- Open Orders; verify errors appear visibly if reads are blocked.
- Upload a valid product image and confirm Storage URL saves.
- Test anonymous product reads and admin-only writes against the *deployed* rules.

## Troubleshooting
- `auth/operation-not-allowed`: enable Email/Password under Authentication → Sign-in method.
- `auth/invalid-credential`: check the email and website password or use Forgot Password; if the user only had Google OAuth, first link a password to the existing Firebase user.
- `auth/unauthorized-domain`: add the Pages hostname to Firebase Auth Authorized domains.
- `permission-denied`: check the **named Firestore database**, deployed rules and authorized admin sign-in.
- `storage/unauthorized`: publish `storage.rules` for the correct bucket and ensure the owner is signed in.
- Unknown index: create the index recommended in the Firestore error details, then retry.

## Security notes
- This is a Firebase email/password credential, **not** your actual Gmail mailbox password. Choose a separate strong password.
- Never ask an assistant, contractor or customer to receive your password in a chat. Set/reset passwords via official Firebase flows.
- Use verified email, least-privilege roles, rate limiting / abuse protection and preferably multi-factor authentication for admin accounts.
- Firebase-hosted identity checks and Firestore rules protect admin access; hiding the Admin link does not provide security.
- Password/account migration is not done by a GitHub deploy. It must be completed in Firebase Authentication by the account owner.
