# Landcore — Phases

Status: Draft v1 (2026-07-15). Expands Section 12 of the master prompt into checkable milestones. Update/check off as work progresses so any session can see what's built and what's next.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Foundation Docs (this session)
**Goal:** establish the source-of-truth documents before any code exists.
- [x] PRD.md
- [x] Architecture.md
- [x] rules.md
- [x] phases.md (this file)
**Definition of done:** all four files exist in project root and are internally consistent.

## Phase 1 — Scaffolding
**Goal:** stand up the empty solution/app matching the structure in `Architecture.md` Section 6, with nothing but placeholder files, so every subsequent phase has a fixed home for its code.
- [x] `Landcore.sln` + 5 backend projects (API, Application, Domain, Infrastructure, Common) + 2 test projects, wired with project references matching Clean Architecture direction (API → Application → Domain; Infrastructure → Application/Domain). Stub entities/services/controllers created matching every name in `Architecture.md` Section 6.
- [x] `landcore-web` React + TypeScript app (Vite), Ant Design + React Query + axios + react-router-dom installed, folder skeleton per `Architecture.md` Section 6, `App.tsx` wired with QueryClientProvider/ConfigProvider/router.
- [~] Backend builds (`dotnet build`) and frontend builds (`npm run build`) cleanly — **not verified in this sandbox**: no .NET SDK is installable here (no root, and dotnet download domains aren't network-reachable from this sandbox). Frontend: `tsc -b` type-checks with zero errors, but the `vite` binary itself crashes (native binary bus error) in this specific sandbox — environment issue, not a code issue. Both need a real build verification pass on a normal machine (e.g. opening `Landcore.sln` in Visual Studio, and running `npm install && npm run build` in `landcore-web` from VS Code) before Phase 1 is fully closed out.
**Definition of done:** both build commands succeed with zero real functionality yet.

## Phase 2 — Domain Entities + MongoDB Collections
**Goal:** all entities in `Landcore.Domain/Entities` exist as POCOs with `MongoDbContext` wired to the collections in `Architecture.md` Section 5, including indexes (AdminId, unique receipt numbers per Admin, unique subscription per Admin, etc.).
**Definition of done:** entities + context compile; a manual insert/read round-trip works against a local/dev MongoDB instance for at least one entity per collection.

## Phase 3 — Auth + Role/Permission Middleware
**Goal:** JWT issuance (`JwtTokenService`), `AuthController`, `PermissionAuthorizationMiddleware` enforcing role + Designation permission claims.
**Definition of done:** SuperMan/Admin/Employee can log in and receive a token; a Designation-restricted Employee is rejected (403) from an endpoint their Designation doesn't permit.

## Phase 4 — Admin & Subscription CRUD (SuperMan side)
**Goal:** SuperMan can create/view/edit Admins and their Subscriptions; suspend/reactivate access.
**Definition of done:** SuperMan can fully manage the Admin lifecycle end-to-end via API; a suspended Admin's Employees cannot log in.

## Phase 5 — Employee & Designation CRUD
**Goal:** Admin can create Designations (permission checklists) and assign Employees to them.
**Definition of done:** Admin can create a Designation with a specific permission set and confirm an Employee assigned to it is correctly restricted.

## Phase 6 — Block, Client, Agent, Lead Profile CRUD
**Goal:** the four foundational profile modules, each scoped by AdminId, with the Lead → Client + Booking conversion flow.
**Definition of done:** full CRUD on all four modules; converting a Lead produces a linked Client and (if applicable) a starting Booking.

## Phase 7 — Plot CRUD + Charge Configuration
**Goal:** Plot CRUD, Block linkage, configurable charge types, status lifecycle, co-ownership, merge/split.
**Definition of done:** a Plot can be created, priced with multiple charge types, and merged/split with full history retained. **Blocked on PRD open item:** whether charge types are Admin-free-form or need SuperMan approval — confirm before finalizing the charge-type management endpoint.

## Phase 8 — Booking → Installment Plan → Payment → Receipt Flow
**Goal:** the core revenue flow: Booking (token/expiry), InstallmentPlan generation, Payment entry (partial payments, overpayment credit), Cheque tracking, Receipt generation.
**Definition of done:** a full flow from Booking through several partial/overpaid installments to a fully-paid plot produces correct installment statuses, credit balances, and receipts. **Blocked on PRD open item:** default booking token expiry period.

## Phase 9 — Bank Account Setup + Reconciliation
**Goal:** multiple Bank Accounts per society, Payments linked to accounts, reconciliation report.
**Definition of done:** reconciliation report correctly compares expected vs. recorded deposits per account.

## Phase 10 — Overdue / Repossession / Refund Automation + Approval Workflow
**Goal:** missed-installment flagging, 3-month repossession auto-reversion, 15/85 refund split, resume-plan path, and the Employee-proposed/Admin-approved ApprovalRequest flow for repossession override, refund issuance, merge/split, and large discounts.
**Definition of done:** a simulated overdue plot correctly reaches `Repossessed` status after 3 months with no payment, and the refund/resume paths both work. **Blocked on PRD open item:** exact grace period/late fee before the 3-month clock starts — implement the clock as configurable and confirm the number before this phase is marked done.

## Phase 11 — Legal Document Generation
**Goal:** PDF generation for allotment letter, transfer letter, NOC, possession letter, stored against Plot history via `GeneratedDocument`.
**Definition of done:** all four document types generate correctly from a Plot/Client/Booking context and are retrievable from Plot history. **Blocked on PRD open item:** CNIC/document upload storage strategy, and whether inheritance transfers need distinct docs/charges.

## Phase 12 — Reports
**Goal:** daily collection, monthly profit, aging (30/60/90+), bank reconciliation, and SuperMan consolidated reports.
**Definition of done:** each report matches a manually-computed expected result on a seeded test dataset.

## Phase 13 — Email Notification Service (incl. Bulk Reminders)
**Goal:** `NotificationService` + `EmailService` wired for installment due reminders, overdue warnings, repossession notice, receipt copy, bounced cheque alert, subscription due/overdue alert, and bulk sends.
**Definition of done:** each notification type fires on its correct trigger event and bulk send correctly batches recipients with a due installment.

## Phase 14 — Frontend
**Goal:** auth screens, role-specific dashboards (SuperMan/Admin/Employee layouts), then module-by-module UI matching the `/features` list in `Architecture.md` Section 6.
**Definition of done:** every backend module from Phases 4–13 has a corresponding working UI, gated correctly by role/permission on the frontend to match backend enforcement.

---

## Open Items Carried Forward (see `PRD.md` Section 5)

These block specific phases above until resolved: repossession grace period/late fee (Phase 10), booking token expiry default (Phase 8), plot charge type governance (Phase 7), CNIC/document storage strategy (Phase 11), inheritance transfer rules (Phase 11).
