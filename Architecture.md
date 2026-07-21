# Landcore — Architecture

Status: Draft v1 (2026-07-15). Read this file at the start of every session before touching backend/frontend code.

---

## 1. Tech Stack (fixed — do not substitute)

| Layer | Choice | Why |
|---|---|---|
| Backend | .NET 10 (latest LTS) Web API | Strong typing, mature DI/middleware pipeline, good fit for permission-middleware-heavy multi-tenant APIs. Briefly retargeted to `net9.0` to match the dev machine's SDK at the time (9.0.316), reverted back to `net10.0` now that the user has installed the .NET 10 SDK |
| Database | MongoDB | Schema-per-tenant flexibility (charge types, permissions, plot attributes are extensible/data-driven per Section 9 of the prompt); document model suits nested entities like InstallmentPlan/Installment |
| Frontend | React + TypeScript + Ant Design + React Query | Ant Design gives enterprise CRUD/table/form components out of the box; React Query handles server-state caching/invalidation for a data-heavy admin app without hand-rolled state management |
| Auth | JWT, role + permission claims | Stateless, middleware-enforceable, carries both role (SuperMan/Admin/Employee/Agent) and fine-grained Designation permissions in the token/claims |
| Currency | PKR only | Fixed requirement, no multi-currency logic needed |
| Language | English only (Phase 1) | Urdu/bilingual deferred — do not build i18n scaffolding yet, but avoid hardcoding strings in a way that would block it later |
| Notifications | Email only (Phase 1) | Architecture must not preclude adding SMS/WhatsApp later (see Section 4) |

## 2. Request / Data Flow

```
Client (React) 
  → axios (JWT attached) 
  → Controller (Landcore.API) 
      → PermissionAuthorizationMiddleware (role + Designation permission check, AdminId scope resolved from JWT claims)
  → Service (Landcore.Application) — business rules, validation, orchestration
  → Repository (Landcore.Infrastructure/Persistence) — MongoDB access, always filtered by AdminId (except SuperMan-scoped queries)
  → MongoDB
```

- **Auth flow:** `AuthController` → `JwtTokenService` issues a token containing `sub` (user id), `role` (SuperMan/Admin/Employee/Agent), `adminId` (tenant scope, null for SuperMan), and `permissions[]` (resolved from the user's Designation at token-issue time).
- **Permission-check flow:** every write endpoint (and sensitive read endpoint) is decorated/attributed with the required module + action (e.g. `Plots.Edit`). `PermissionAuthorizationMiddleware` reads the JWT claims, checks the role first (SuperMan bypasses Designation checks entirely; Admin has full access within their own AdminId; Employee is checked against their Designation's permission list), and rejects with 403 before the controller action runs.
- Every service method that touches tenant data takes/derives `AdminId` from the authenticated context — never from a client-supplied parameter — to prevent cross-tenant access via a forged request body.

## 3. Multi-Tenancy Strategy

- Every tenant-scoped collection (Client, Plot, Block, Booking, Payment, Cheque, BankAccount, Agent, Lead, Employee, Designation, ApprovalRequest, GeneratedDocument) carries an `AdminId` field.
- All repository queries for Admin/Employee/Agent-scoped operations inject `AdminId` from the authenticated user's JWT claims — this is never optional and never client-supplied.
- SuperMan-scoped endpoints (consolidated dashboards/reports) aggregate across all `AdminId` values; these are the only queries allowed to omit an `AdminId` filter, and they are restricted to the SuperMan role by the same permission middleware.
- Subscription status gates login: `AuthController` checks the resolved Admin's Subscription status before issuing a token to that Admin's Employees; `Overdue`/`Suspended` blocks login except for the Admin themselves reactivating (per PRD Section 3.2 — manual SuperMan reactivation only, no self-service in Phase 1).
- Soft delete: financial/ownership records (Payment, Plot, Client, Booking, InstallmentPlan) are never hard-deleted — a `IsDeleted` + `DeletedAt` pair on the common base entity is set instead, and repositories filter these out by default.

## 4. Notification Architecture

`NotificationService` (Landcore.Application) is channel-agnostic: it accepts a notification type + recipient + template data, and delegates to a channel provider. Phase 1 wires only `EmailService` (Landcore.Infrastructure/Email) as the provider. Adding SMS/WhatsApp later means adding a new provider implementing the same channel interface — no changes to callers.

## 5. MongoDB Collection Schemas

Field types are indicative (.NET Core + MongoDB.Driver conventions: `ObjectId` for `_id` and references, `Decimal128` for money, UTC `DateTime` for dates). All entities inherit common audit + soft-delete fields (Section 5.9).

### 5.1 SuperMen (`supermen`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| FullName | string | |
| Email | string | unique index |
| PasswordHash | string | |

### 5.2 Admins (`admins`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| SocietyName | string | |
| ContactEmail | string | unique index |
| PasswordHash | string | |
| SubscriptionId | ObjectId | ref → subscriptions |
| Status | enum | Active / Suspended (mirrors subscription status) |

### 5.3 Subscriptions (`subscriptions`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | ref → admins, unique index |
| Plan | enum | Monthly / Yearly |
| FeeAmount | Decimal128 | PKR |
| StartDate | DateTime | |
| NextDueDate | DateTime | indexed — used by the overdue-check job |
| Status | enum | Active / Overdue / Suspended |

### 5.4 Employees (`employees`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| FullName, Email, Phone | string | |
| PasswordHash | string | |
| DesignationId | ObjectId | ref → designations |

### 5.5 Designations (`designations`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| Name | string | |
| Permissions | array of `{ Module: string, Actions: string[] }` | data-driven, not hardcoded enums in code |

### 5.6 Agents (`agents`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| FullName, CNIC, Phone, Email, Address | string | CNIC format-validated |
| CommissionType | enum | Percentage / Fixed |
| CommissionValue | Decimal128 | |

### 5.7 Leads (`leads`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| Name, Phone, Email | string | |
| Source | enum | WalkIn / Referral / Agent / Call |
| InterestedPlotId | ObjectId? | ref → plots, optional |
| Status | enum | New / Contacted / FollowUp / Converted / Lost |
| AssignedEmployeeId | ObjectId | ref → employees |
| FollowUpNotes | array of `{ Note, By, At }` | |

### 5.8 Clients (`clients`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| FullName, CNIC, Phones[], Email, Address, EmergencyContact | string | CNIC/phone format-validated |
| LinkedAgentId | ObjectId? | ref → agents, optional |
| CoOwnerClientIds | ObjectId[] | ref → clients |

### 5.9 Common Base Fields (embedded in every entity, not a standalone collection)
| Field | Type | Notes |
|---|---|---|
| CreatedAt, CreatedBy | DateTime, ObjectId | audit |
| UpdatedAt, UpdatedBy | DateTime, ObjectId | audit |
| IsDeleted, DeletedAt, DeletedBy | bool, DateTime?, ObjectId? | soft delete |

### 5.10 Blocks (`blocks`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| Name, Description | string | |
| TotalPlots | int | |

### 5.11 Plots (`plots`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| PlotNumber | string | |
| BlockId | ObjectId | ref → blocks, indexed |
| Size | decimal | SizeUnit: Marla / Kanal / SqYd |
| Category | enum | Residential / Commercial |
| BasePrice | Decimal128 | |
| Charges | array of `{ ChargeType: string, Amount: Decimal128 }` | data-driven charge types, see PRD open item |
| AnnualMaintenanceCharge | Decimal128 | |
| Status | enum | Available / Booked / Sold / Overdue / Repossessed |
| PossessionStatus | enum | NotHandedOver / PossessionGiven |
| OwnerClientIds | ObjectId[] | ref → clients (co-ownership) |
| HistoryLog | array of `{ Event, Details, At, By }` | merges, splits, transfers, status changes |

### 5.12 Bookings (`bookings`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| PlotId | ObjectId | ref → plots |
| ClientId | ObjectId | ref → clients |
| LeadId | ObjectId? | ref → leads, optional |
| AgentId | ObjectId? | ref → agents, optional |
| CommissionSnapshot | `{ Type, Value }` | frozen at booking time |
| TokenAmount | Decimal128 | |
| ExpiryDate | DateTime | see PRD open item on default expiry |

### 5.13 InstallmentPlans (`installmentPlans`) and Installments (embedded array)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| BookingId | ObjectId | ref → bookings |
| DownPayment | Decimal128 | |
| EarlyPaymentDiscount | Decimal128? | optional |
| Installments | array of `{ SeqNo, DueDate, Amount, Status, PaidAmount }` | Status: Pending / PartiallyPaid / Paid / Late / Missed |

### 5.14 Payments (`payments`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| InstallmentPlanId | ObjectId | ref → installmentPlans |
| InstallmentSeqNo | int | which installment this applies to |
| Amount | Decimal128 | |
| Mode | enum | Cash / Bank / Cheque |
| BankAccountId | ObjectId? | ref → bankAccounts |
| Date | DateTime | |
| ReceiptId | ObjectId | ref → receipts |
| CreditBalanceApplied | Decimal128? | overpayment tracking |

### 5.15 Cheques (`cheques`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| PaymentId | ObjectId | ref → payments |
| ChequeNumber, Bank | string | |
| Amount | Decimal128 | |
| DueDate, DepositDate | DateTime | |
| Status | enum | Pending / Cleared / Bounced |

### 5.16 BankAccounts (`bankAccounts`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| AccountName, AccountNumber, BankName | string | |

### 5.17 Receipts (`receipts`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| ReceiptNumber | string | society-configurable prefix + sequence, unique index per AdminId |
| PaymentId | ObjectId | ref → payments |

### 5.18 GeneratedDocuments (`generatedDocuments`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| PlotId | ObjectId | ref → plots |
| DocumentType | enum | AllotmentLetter / TransferLetter / NOC / PossessionLetter |
| FileUrl | string | |
| GeneratedAt | DateTime | |

### 5.19 ApprovalRequests (`approvalRequests`)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| AdminId | ObjectId | indexed |
| Type | enum | RepossessionOverride / Refund / MergeSplit / LargeDiscount |
| RequestedByEmployeeId | ObjectId | ref → employees |
| Justification | string | |
| Status | enum | PendingApproval / Approved / Rejected |
| DecidedByAdminId | ObjectId? | |
| DecisionNotes | string? | |

## 6. Required Project Structure (copied in full from Section 11 of the master prompt — always the reference)

### Backend — `Landcore.API` (.NET Core, Clean Architecture)

```
Landcore.sln
/src
  /Landcore.API
    /Controllers
      AuthController.cs, AdminsController.cs, SubscriptionsController.cs,
      EmployeesController.cs, DesignationsController.cs, BlocksController.cs,
      PlotsController.cs, LeadsController.cs, ClientsController.cs,
      AgentsController.cs, BookingsController.cs, InstallmentsController.cs,
      PaymentsController.cs, ChequesController.cs, BankAccountsController.cs,
      DocumentsController.cs, ApprovalsController.cs, ReportsController.cs
    /Middleware
      PermissionAuthorizationMiddleware.cs, ExceptionHandlingMiddleware.cs
    Program.cs, appsettings.json, appsettings.Development.json
  /Landcore.Application
    /DTOs  /Interfaces
    /Services
      PlotService.cs, PaymentService.cs, BookingService.cs, RepossessionService.cs,
      CommissionService.cs, SubscriptionService.cs, ApprovalService.cs,
      DocumentGenerationService.cs, ReportService.cs, NotificationService.cs
    /Validators  /Mappings
  /Landcore.Domain
    /Entities
      SuperMan.cs, Admin.cs, Subscription.cs, Employee.cs, Designation.cs,
      Permission.cs, Agent.cs, Lead.cs, Client.cs, Block.cs, Plot.cs,
      PlotCharge.cs, Booking.cs, InstallmentPlan.cs, Installment.cs,
      Payment.cs, Cheque.cs, BankAccount.cs, Receipt.cs,
      GeneratedDocument.cs, ApprovalRequest.cs
    /Enums
    /Common (base entity, audit fields, soft-delete fields)
  /Landcore.Infrastructure
    /Persistence (MongoDbContext.cs, /Repositories)
    /Auth (JwtTokenService.cs)
    /Email (EmailService.cs)
    /Configuration
  /Landcore.Common
    Constants.cs, Helpers/
/tests
  /Landcore.UnitTests
  /Landcore.IntegrationTests
```

### Frontend — `landcore-web` (React + TypeScript)

```
/landcore-web
  /src
    /api  (axiosClient.ts + one file per module: admins, subscriptions, plots,
           blocks, leads, clients, agents, employees, designations, bookings,
           payments, cheques, bankAccounts, documents, approvals, reports)
    /components
    /features (one folder per module, matching /api list above, plus auth
               and superman-dashboard)
    /layouts (AdminLayout.tsx, SuperManLayout.tsx)
    /hooks
    /store
    /types
    /utils
    App.tsx, main.tsx
  package.json, tsconfig.json
```

**Rule for all future sessions:** every new module/feature must fit this structure — new entity → `Landcore.Domain/Entities`, new business logic → `Landcore.Application/Services`, new endpoint → matching Controller, new frontend feature → its own `/features` folder with a matching `/api` file and `/types`.
