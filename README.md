# Dante Global Logistics & Shipment Tracking Platform

A secure freight forwarding and container tracking web application engineered for hybrid **Air & Sea Cargo** consolidation (e.g. from China/Turkey to Iraqi governorates), designed with an API-first architecture ready for future native iOS/Android mobile app deployment.

---

## 🚀 Key Features

### 1. Customer Portal (Bilingual: Arabic RTL & English)
- **Automated Personal Mailbox Code:** Assigns unique codes (e.g. `IRQ-1001`, `IRQ-5020`) upon registration.
- **Supplier Address Card & PDF Download:** Instant generation of official Chinese/English shipping address slips with bilingual directives instructing overseas suppliers to print the customer code on cartons.
- **Doorstep Delivery Address:** Supports all 18 Iraqi governorates/cities, exact address, and nearest landmark ("nearest point").
- **Pre-Alert Registration:** Customers can declare incoming packages by carrier tracking number and select preferred shipping mode (Air by KG vs. Sea by CBM).
- **Privacy-Preserving Tracking:** Customers view tracking timelines and domestic China milestones; internal container codes, batch margins, and staff notes are strictly redacted.
- **Dual Currency Invoices:** Real-time billing in USD with automated conversion to Iraqi Dinar (IQD rounded to standard 250 IQD cash denominations).

### 2. Warehouse Staff UI (Fast Intake & Sorting)
- **Rapid Intake Terminal:** Fast barcode/tracking number scanner with camera photo capture.
- **Automated CBM & Volumetric Calculations:** Computes CBM ($\frac{L \times W \times H}{1,000,000}$) and Volumetric Weight ($\frac{L \times W \times H}{5,000}$) live as dimensions are entered.
- **Chargeable Weight Selection:** Automatically picks $\max(\text{actual}, \text{volumetric})$ for Air freight.
- **Container Assignment:** Bulk-packs packages into open Air or Sea containers.

### 3. Manager Command Center (Full Dashboard)
- **Container Lifecycle:** Create and manage Air and Sea containers, set departure/arrival dates, container costs, and CBM capacity thresholds.
- **Cascading Milestones:** When a container moves (`in_transit`, `customs`, `arrived_unpacked`), all enclosed customer packages automatically cascade their tracking milestones.
- **Exchange Rate Management:** Global USD $\rightarrow$ IQD exchange rate controller.
- **3rd-Party Local Iraqi Delivery Manifest:** Groups shipments by Iraqi city with customer phone, address, nearest landmark, and COD amounts for handover to local Iraqi courier companies.
- **Payment Collection Tracking:** Record payments via **Cash on Delivery (COD)**, **ZainCash**, or **Qi Card** with status (`unpaid`, `down_payment`, `paid`).

---

## 🛡️ Tight Security Implementation

- **Strict Role-Based Access Control (RBAC):** Middleware guarantees customers cannot access staff/manager endpoints (`403 Forbidden`).
- **Object-Level Authorization:** Customers can only query their own packages and invoices.
- **Password Security:** Salted hashes generated using `bcrypt` (10 rounds).
- **Input Validation:** Strict schema validation with `Zod` across all payloads (Iraqi phone format, governorates enum, positive weights/dimensions).
- **API Rate Limiting:** Sliding-window rate limiter protecting auth endpoints against brute force.
- **Security Headers:** Hardened HTTP headers via `helmet` and CORS protection.
- **SQL Injection Prevention:** 100% parameterized SQLite prepared statements with foreign key constraints and WAL mode concurrency.

---

## 🧪 Testing Suite (100% Pass)

Run all unit and integration tests:

```bash
npm test
```

Test coverage includes:
- `tests/unit/calculations.test.ts` (CBM, volumetric weight, chargeable weight, minimum billing rules, IQD rounding)
- `tests/unit/codeGenerator.test.ts` (atomic personal code formatting, container codes, regex verification)
- `tests/unit/validation.test.ts` (Iraqi governorates validation, phone regex, intake constraints)
- `tests/unit/trackingPrivacy.test.ts` (strict scrubbing of container IDs and internal notes)
- `tests/integration/auth_and_rbac.test.ts` (registration, login, RBAC permission enforcement, PDF export)
- `tests/integration/logistics_workflow.test.ts` (complete end-to-end lifecycle from customer pre-alert to container shipping, customs, local city dispatch manifest, and payment)

---

## 🏃 Quick Start

### 1. Build and Run Server
```bash
npm run build
npm start
```
The server will start on `http://localhost:3000`.

### 2. Default Demo Accounts
- **Manager:** `manager@dante.com` / `Admin@2026!`
- **Warehouse Staff:** `staff@dante.com` / `Staff@2026!`
- **Customer:** Click the **"👤 Customer (Demo)"** button on the UI header bar, or register a new customer account.
