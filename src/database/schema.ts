import Database from 'better-sqlite3';
import { ENV } from '../config/env';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sequence_counters (
      name TEXT PRIMARY KEY,
      current_value INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO sequence_counters (name, current_value)
    VALUES ('customer_code', 1000);

    INSERT OR IGNORE INTO sequence_counters (name, current_value)
    VALUES ('container_air', 1);

    INSERT OR IGNORE INTO sequence_counters (name, current_value)
    VALUES ('container_sea', 1);

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES
      ('usd_iqd_rate', '${ENV.DEFAULT_EXCHANGE_RATE}', datetime('now')),
      ('warehouse_name', '${ENV.DEFAULT_WAREHOUSE_NAME}', datetime('now')),
      ('warehouse_address_en', '${ENV.DEFAULT_WAREHOUSE_ADDRESS_EN}', datetime('now')),
      ('warehouse_address_zh', '${ENV.DEFAULT_WAREHOUSE_ADDRESS_ZH}', datetime('now')),
      ('warehouse_phone', '${ENV.DEFAULT_WAREHOUSE_PHONE}', datetime('now')),
      ('default_air_rate_kg', '${ENV.DEFAULT_AIR_RATE_PER_KG_USD}', datetime('now')),
      ('default_sea_rate_cbm', '${ENV.DEFAULT_SEA_RATE_PER_CBM_USD}', datetime('now'));

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      personal_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      city TEXT NOT NULL,
      local_address TEXT NOT NULL,
      nearest_point TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'staff', 'manager')),
      preferred_language TEXT NOT NULL DEFAULT 'ar' CHECK(preferred_language IN ('ar', 'en')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_personal_code ON users(personal_code);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS containers (
      id TEXT PRIMARY KEY,
      container_number TEXT UNIQUE NOT NULL,
      shipping_type TEXT NOT NULL CHECK(shipping_type IN ('air', 'sea')),
      cost_per_container_usd REAL NOT NULL DEFAULT 0,
      cost_per_cbm_usd REAL NOT NULL DEFAULT 0,
      cost_per_kg_usd REAL NOT NULL DEFAULT 0,
      customs_tax_usd REAL NOT NULL DEFAULT 0,
      max_cbm REAL NOT NULL DEFAULT 68.0,
      max_weight_kg REAL NOT NULL DEFAULT 25000.0,
      status TEXT NOT NULL CHECK(status IN ('loading', 'sealed', 'in_transit', 'customs', 'arrived_unpacked')),
      etd TEXT,
      eta TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_containers_number ON containers(container_number);
    CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      internal_tracking_code TEXT UNIQUE NOT NULL,
      merchant_tracking_number TEXT NOT NULL,
      user_id TEXT NOT NULL,
      container_id TEXT,
      shipping_type TEXT NOT NULL CHECK(shipping_type IN ('air', 'sea')),
      weight_kg REAL NOT NULL DEFAULT 0,
      length_cm REAL NOT NULL DEFAULT 0,
      width_cm REAL NOT NULL DEFAULT 0,
      height_cm REAL NOT NULL DEFAULT 0,
      cbm REAL NOT NULL DEFAULT 0,
      volumetric_weight_kg REAL NOT NULL DEFAULT 0,
      chargeable_weight_kg REAL NOT NULL DEFAULT 0,
      package_type TEXT NOT NULL DEFAULT 'General Goods',
      photos_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL,
      third_party_courier_name TEXT,
      third_party_tracking_number TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_packages_user_id ON packages(user_id);
    CREATE INDEX IF NOT EXISTS idx_packages_internal_code ON packages(internal_tracking_code);
    CREATE INDEX IF NOT EXISTS idx_packages_merchant_number ON packages(merchant_tracking_number);
    CREATE INDEX IF NOT EXISTS idx_packages_container_id ON packages(container_id);
    CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      package_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      shipping_cost_usd REAL NOT NULL DEFAULT 0,
      customs_tax_usd REAL NOT NULL DEFAULT 0,
      extra_fees_usd REAL NOT NULL DEFAULT 0,
      total_usd REAL NOT NULL DEFAULT 0,
      exchange_rate_iqd REAL NOT NULL DEFAULT 1500,
      total_iqd REAL NOT NULL DEFAULT 0,
      amount_paid_usd REAL NOT NULL DEFAULT 0,
      amount_paid_iqd REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash_on_delivery', 'zain_cash', 'qi_card')),
      payment_status TEXT NOT NULL CHECK(payment_status IN ('unpaid', 'down_payment', 'paid')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_package_id ON invoices(package_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

    CREATE TABLE IF NOT EXISTS tracking_events (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      location TEXT NOT NULL,
      is_internal_only INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tracking_events_package_id ON tracking_events(package_id);
  `);
}
