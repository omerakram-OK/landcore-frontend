# Landcore — Product Requirements Document

Status: Draft v2 (2026-07-15). Open items from Draft v1 have been resolved via explicit user decisions (see Section 5). Do not resolve any *remaining* TBD silently — see `rules.md`.

---

## 1. What Landcore Is

Landcore is a multi-tenant plot management system for housing societies. A single company ("SuperMan") owns and operates the platform and sells access to it, on subscription, to independent housing societies ("Admin" tenants). Each Admin manages their own plot inventory, staff, agents, and clients in isolation, while SuperMan retains a consolidated cross-society view for platform oversight and subscription billing.

Currency: PKR only. Language: English only (Phase 1). Notifications: email only (Phase 1).

## 2. Who It's For

- **SuperMan** — platform owner. Full visibility and control across every Admin/society: consolidated revenue, subscription status, per-society performance, defaulters, plot counts.
- **Admin** — a society client on a paid subscription. Manages their own plots, employees, designations, agents, clients, and financials. Cannot see other Admins' data.
- **Employee** — belongs to an Admin, restricted to whatever their assigned Designation permits.
- **Designation** — Admin-defined role template: a checklist of per-module, per-action permissions (create/view/edit/delete).
- **Agent** — external referral partner, tied to specific client bookings, earns commission.
- **Client** — the plot buyer/owner. A profile must exist before any booking or sale.

## 3. Feature List by Module

Each item is tagged **[P1]** (build now) or **[P2]** (later, do not build).

### 3.1 Platform / SuperMan
- [P1] SuperMan login, consolidated dashboard (total revenue, subscription revenue, per-society comparison, defaulters, active plot counts)
- [P1] Manual subscription activation/suspension/reactivation per Admin
- [P2] Automated subscription billing / payment gateway integration

### 3.2 Subscription (SuperMan ↔ Admin billing)
- [P1] Subscription entity: Admin reference, plan (monthly/yearly, configurable per Admin), fee amount, start date, next due date, status (`Active`/`Overdue`/`Suspended`)
- [P1] Access suspension when lapsed (Admin/Employees blocked from login) until SuperMan reactivates
- [P2] Per-plot fees or percentage-of-sale commission billing models

### 3.3 Auth & Access Control
- [P1] JWT auth with role + permission claims
- [P1] Designation CRUD (Admin-defined, per-module/action permission checklist)
- [P1] Permission-enforcement middleware on every write endpoint

### 3.4 Employees
- [P1] Employee CRUD, assigned a Designation

### 3.5 Agents
- [P1] Agent profile CRUD (name, CNIC, phone, email, address)
- [P1] Commission type per agent: percentage or fixed (Admin's choice), editable for future bookings only, not retroactive
- [P1] Agent history: clients/bookings brought in, commission earned/paid/pending

### 3.6 Leads
- [P1] Lead CRUD: name, phone, email, source (walk-in/referral/agent/call), interested plot/block (optional)
- [P1] Status pipeline: `New` → `Contacted` → `Follow-up` → `Converted`/`Lost`
- [P1] Assigned Employee, follow-up notes/history
- [P1] Convert Lead → Client + Booking

### 3.7 Clients
- [P1] Client profile: full name, CNIC, phone(s), email, address, emergency contact (optional)
- [P1] Linked Agent (optional)
- [P1] Co-owners: additional Client references for joint ownership
- [P2] Photo/CNIC scan upload
- [P2] Client self-service portal

### 3.8 Blocks / Sectors / Phases
- [P1] Block CRUD: name/number, description, total plots, scoped to Admin

### 3.9 Plots
- [P1] Plot CRUD: plot number, Block reference, size + unit (Marla/Kanal/Sq. Yd), category (residential/commercial)
- [P1] Base price + configurable extra charges (development, corner, west-open, park-facing, transfer — extensible, data-driven, not hardcoded)
- [P1] Annual maintenance/membership charge, separate from installment plan
- [P1] Status lifecycle: `Available → Booked → Sold → Fully Paid/Overdue → Repossessed → Available`
- [P1] Possession status tracked separately: `Not Handed Over` / `Possession Given`
- [P1] Co-ownership support
- [P1] Merge/split (Admin-initiated only), full history log
- **Resolved**: plot charge types are Admin free-form (no SuperMan approval step). Admin can add/edit charge type definitions for their own society at any time.

### 3.10 Bookings
- [P1] Token/advance or direct initial charges
- [P1] Configurable booking expiry period — **Resolved**: default 15 days, Admin can override per-booking or change the society-wide default
- [P1] Linked Agent + commission snapshot at time of booking
- [P1] Linked Lead if applicable

### 3.11 Installment Plans
- [P1] Down payment + N monthly installments, each with status `Pending/Partially Paid/Paid/Late/Missed`
- [P1] Early full-payment discount/rebate, Admin-configured, optional

### 3.12 Payments / Receipts
- [P1] Manual payment entry: amount, mode (cash/bank/cheque), date, Bank Account used
- [P1] Partial payments; overpayment creates a credit balance auto-applied to the next due installment
- [P1] Auto-generated receipt, unique ID, configurable prefix per society

### 3.13 Cheques
- [P1] Cheque number, bank, amount, due/deposit date
- [P1] Status: `Pending/Cleared/Bounced`
- [P1] Bounce triggers a penalty and reverts the related installment to unpaid

### 3.14 Bank Accounts
- [P1] Multiple bank accounts per society, payments linked to an account for reconciliation

### 3.15 Legal Documents
- [P1] System-generated PDFs: allotment letter, transfer letter, NOC, possession letter — stored against Plot history
- **TBD**: CNIC/document upload storage strategy (Section 10, deferred to Phase 2 regardless)

### 3.16 Overdue / Repossession / Refund
- [P1] Missed installment(s) → plot flagged `Overdue`, email notification sent
- **Resolved (supersedes the original master-prompt default of 3 months)**: no late fee is charged during the overdue period. If no payment is made within **1 month** of the first missed installment, the plot auto-reverts to `Repossessed` and returns to the Admin's inventory as `Available` for resale. This window is stored as a configurable setting (`RepossessionGraceMonths`, default `1`), not hardcoded, so an Admin can adjust it later without a code change.
- [P1] Former client later pays any amount → 15% retained as company profit, 85% recorded as refundable/payable to client, clearly shown to Admin. (This rule was not addressed by the grace-period answer above and is carried forward unchanged from the master prompt; flagged here in case the Admin wants it revisited given the shorter 1-month window.)
- [P1] Former client may instead resume the plan if Admin approves — no refund triggered, plot returns to `Sold`

### 3.17 Transfers
- [P1] Transfer types: sale, gift, inheritance (deceased owner → legal heirs), each with potentially different required docs/charges
- [P1] Transfer charge applies to sale/gift transfers
- **Resolved**: inheritance transfers get a reduced/no transfer charge (Admin-configurable rate, defaults to 0 for inheritance), distinct from the standard sale transfer charge
- [P1] Full transfer history retained against the Plot

### 3.18 Merge / Split
- [P1] Admin-initiated only; produces new Plot record(s); links to originals in history

### 3.19 Approval Workflows
- [P1] Employee-proposed / Admin-approved actions: repossession override or reversal, refund issuance, plot merge/split, large manual discount
- [P1] Proposed actions sit in `Pending Approval` state with justification until Admin approves/rejects
- [P1] All approvals/rejections logged in the audit trail

### 3.20 Reporting
- [P1] Receipt generation (unique configurable-prefix ID, timestamp, recorder, mode, plot & client reference)
- [P1] Daily collection report (by plot/client/employee/mode)
- [P1] Monthly profit report (collected, charges/commissions/discounts paid out, repossession profits, net profit)
- [P1] Aging report (30/60/90+ day overdue buckets)
- [P1] Bank reconciliation report (expected vs. recorded deposits per account)
- [P1] SuperMan consolidated reports (platform revenue, subscription revenue, per-society comparison, defaulters, plot status counts)

### 3.21 Notifications
- [P1] Email: installment due reminders, overdue warnings, repossession notice, receipt copy, bounced cheque alert, subscription due/overdue alert
- [P1] Bulk email (e.g. reminders to all clients with a due installment this week)
- [P1] Architecture must allow adding SMS/WhatsApp later without major rework
- [P2] SMS/WhatsApp channels themselves

## 4. Out of Scope (Phase 1) — Explicit

To prevent scope creep, the following are explicitly **not** built in Phase 1:

- Online subscription payment gateway or automated billing for SuperMan ↔ Admin subscriptions
- Per-plot fees or percentage-of-sale commission billing models for SuperMan
- Photo / CNIC scan document upload and storage
- Client self-service portal
- Urdu or any bilingual UI — English only
- SMS or WhatsApp notification channels (email only; architecture must not block adding these later)

## 5. Open Items — Resolution Log

Resolved by explicit user decision on 2026-07-15:

1. **Grace period / late fee**: no late fee; repossession grace period is **1 month** (not the master prompt's original 3-month default), configurable via `RepossessionGraceMonths`. Note: this changes the *timeline* the master prompt specified — flagged here rather than silently applied. The separate 15%/85% refund-on-late-payment rule (3.16) was not addressed by this answer and is carried forward unchanged; worth re-confirming with the Admin given the shorter window.
2. **Booking token expiry**: default 15 days, configurable/overridable per booking.
3. **Plot charge type governance**: Admin free-form, no SuperMan approval step.
4. **Inheritance transfer rules**: reduced/no transfer charge vs. standard sale transfer, Admin-configurable rate.

Still open (not yet discussed):

5. **CNIC/document upload storage strategy** — deferred; out of scope per Section 4 (no photo/CNIC upload in Phase 1), so `DocumentGenerationService` will generate PDFs from typed data only, with no file upload/storage path built yet.

All four resolved items are implemented as configurable settings (not hardcoded), per `rules.md` Section 1, so future adjustment doesn't require a code change.
