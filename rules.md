# Landcore — Rules

Status: Draft v1 (2026-07-15). Read this file at the start of every session before making changes. If a new requirement conflicts with anything here or in `PRD.md`/`Architecture.md`/`phases.md`, flag the conflict to the user instead of silently overriding it.

---

## 1. Coding Conventions

- **Naming:** PascalCase for C# types/members/files, camelCase for TypeScript variables/functions, PascalCase for React components and their files.
- **New backend entity** → always goes in `Landcore.Domain/Entities`, never inline in a service or controller.
- **New business logic** → always goes in a `Landcore.Application/Services` class, never directly in a controller action.
- **New endpoint** → always added to the matching existing controller in `Landcore.API/Controllers` (see the module → controller mapping in `Architecture.md` Section 6); only create a new controller for a genuinely new module, not as a place to dump one-off endpoints.
- **New frontend feature** → always its own folder under `/landcore-web/src/features`, with a matching `/api` file and `/types` entry. Never add module-specific logic to shared `/components`.
- **Charge types, payment modes, designations/permissions, document numbering prefixes** are data-driven configuration, never hardcoded enums or switch statements in code (Section 9 of the master prompt).

## 2. The AI Must Always

- Scope every tenant query by `AdminId`, sourced from the authenticated JWT claims — never from a client-supplied field.
- Validate CNIC and phone number formats on every write path that accepts them.
- Write an audit log entry (`CreatedBy`/`UpdatedBy`/`DeletedBy` + timestamps, per `Architecture.md` Section 5.9) on every financial or ownership write (Payment, Plot, Client, Booking, Installment, ApprovalRequest).
- Route repossession override/reversal, refund issuance, plot merge/split, and large manual discounts through the `ApprovalRequest` pending-approval flow rather than applying them directly.
- Re-read `PRD.md`, `Architecture.md`, `rules.md`, and `phases.md` at the start of a session before making changes, and update them as decisions are made or scope changes.
- Flag a conflict to the user when a new requirement contradicts something already decided in these four files, instead of silently overriding it.

## 3. The AI Must Never

- Bypass `PermissionAuthorizationMiddleware`, or add an endpoint that skips permission checks "temporarily."
- Perform a destructive/irreversible operation — hard-deleting a Client, Plot, or Payment record — without an explicit confirmation step from the user. Financial/ownership records are soft-deleted only (`IsDeleted`/`DeletedAt`), never hard-deleted, per `Architecture.md` Section 3.
- Invent a business rule that isn't defined in `PRD.md`. If a rule is ambiguous or missing (see the open items in `PRD.md` Section 5), implement the mechanism generically and configurable, and flag the specific number/policy as pending rather than guessing a default.
- Silently decide a value the PRD explicitly reserves for a human decision — e.g. the late-fee percentage, the repossession grace period, booking token expiry default, or whether inheritance transfers get different rules. These are flagged in `PRD.md` Section 5 and require explicit confirmation before the dependent code is finalized.

## 4. Error Handling Standards

- All API errors return a consistent shape: `{ "success": false, "error": { "code": string, "message": string, "details"?: object } }`. Success responses: `{ "success": true, "data": ... }`.
- `ExceptionHandlingMiddleware` catches unhandled exceptions, logs them server-side, and translates them to the shape above — never leaks stack traces to the client.
- Validation failures (FluentValidation) surface as 400 responses with `error.code = "VALIDATION_ERROR"` and `error.details` containing a field → message map, so the frontend can attach errors to the right form field.
- Every write endpoint that touches Payment, Plot, Client, Booking, or ApprovalRequest logs at minimum: who (UserId), what (action + entity + id), when (UTC timestamp), and the AdminId scope.

## 5. Boundaries — Human Decision vs. AI-Autonomous

**Requires an explicit human (Admin/user) decision — the AI does not decide these on its own:**
- Late-fee percentage and repossession grace period — **resolved 2026-07-15**: no late fee, 1-month grace period (`RepossessionGraceMonths` default 1). See PRD.md Section 5, item 1.
- Booking token expiry default — **resolved**: 15 days default, configurable. PRD.md Section 5, item 2.
- Whether plot charge types are Admin-free-form or need SuperMan approval — **resolved**: Admin free-form. PRD.md Section 5, item 3.
- CNIC/document upload storage strategy — **still open**, deferred (no upload in Phase 1 per PRD Section 4). PRD.md Section 5, item 5.
- Inheritance transfer charge/document rules vs. standard sale transfer — **resolved**: reduced/no charge, configurable rate. PRD.md Section 5, item 4.
- Any hard-delete of a financial/ownership record
- Any new Phase 1 vs Phase 2 scope reclassification

**The AI can decide/implement autonomously, within the patterns already fixed by `Architecture.md`:**
- Internal service/repository structure, DTO shapes, mapping code
- Which existing controller a new endpoint belongs to (per the fixed module list)
- Validation rules for well-specified fields (CNIC format, required fields, etc.)
- Test scaffolding and non-functional plumbing (logging, exception handling, DI wiring)
