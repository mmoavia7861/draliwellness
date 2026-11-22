-- D1 Safepay payment ledger; apply only to draliwellness-payments.
-- Does not alter any Firebase database, existing orders, or products.
CREATE TABLE IF NOT EXISTS safepay_sessions (
  order_id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  tracking_key TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0 AND amount_minor <= 1000000000),
  currency TEXT NOT NULL DEFAULT 'PKR' CHECK(currency = 'PKR'),
  environment TEXT NOT NULL CHECK(environment IN ('sandbox','production')),
  tracker TEXT UNIQUE,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'creating'
    CHECK(status IN ('creating','pending','sandbox_succeeded','paid','refunded','review')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  verified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_safepay_sessions_tracker ON safepay_sessions(tracker);
CREATE INDEX IF NOT EXISTS idx_safepay_sessions_status ON safepay_sessions(status,created_at);

CREATE TABLE IF NOT EXISTS safepay_events (
  event_id TEXT PRIMARY KEY,
  tracker TEXT NOT NULL,
  event_type TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'received'
    CHECK(result IN ('received','processed','ignored','review')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(tracker) REFERENCES safepay_sessions(tracker)
);
CREATE INDEX IF NOT EXISTS idx_safepay_events_tracker ON safepay_events(tracker);
