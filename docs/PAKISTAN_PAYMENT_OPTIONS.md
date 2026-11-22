# Pakistan checkout options — Dr. Ali Hassan Health & Wellness

## What is live in the repository (not a verified successful wallet transfer)

- Cash on Delivery (COD).
- WhatsApp order confirmation.
- **Easypaisa — Manual Wallet Transfer**.
- **JazzCash — Manual Wallet Transfer**.

Merchant-provided receiving number for both wallet choices: **03486287055**.

**Account ownership has not been independently verified.** Before customers
transfer money, the merchant must ensure this number is registered and able to
receive payments in **both** Easypaisa and JazzCash and the recipient name
matches the store. If either is unregistered, disable that option before use.

Manual wallet orders are written to the existing Firebase `orders` and
`orderTracking` collections with `paymentStatus: pending`. The existing
rules in the repository already list `jazzcash` and `easypaisa` as accepted
payment methods; those rules must be published in the *named Firestore
database* in use. Never loosen unrelated database security rules.

To complete a manual wallet order, buyers send the exact order amount
separately in their wallet app and share their **order number** and wallet
transaction reference with merchant support. Screenshots, user-supplied refs,
and redirects are NOT reliable payment authorization. Admin must confirm
actual merchant wallet receipt before fulfilling the order/marking paid. Never
collect customer PIN, OTP, card PAN or CVV.

## Future automatic hosted checkout (requires merchant onboarding)

**Premier PayFast OneCheckout** is a Pakistan merchant gateway that advertises
cards, JazzCash, Easypaisa, and Raast in one hosted checkout. Its FAQ as
checked 2026-11-22 listed PKR 20,000 one-time setup fee and NTN requirement;
confirm pricing, product-category acceptance (supplements), credentials,
available methods and compliance terms directly with the provider before
committing to it.

Official links:
- https://premierpayfast.com/onecheckout/
- https://premierpayfast.com/faqs/
- https://premierpayfast.com/developers/

A secure production hosted gateway will still need server-side payment amount
checks, merchant credentials, webhook authenticity/provider-side status
confirmation, idempotent order reconciliation, expiry/retry handling, and
refunds. Do not treat an emailed or screenshot proof as payment success.

The **website's GitHub Pages auto-deployment** can deploy the checkout UI; it
cannot by itself acquire gateway merchant credentials or guarantee settlement.
