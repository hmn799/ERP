# ERP DELIVERY ROADMAP

## Purpose and operating principles

This roadmap turns the approved software requirements into a release plan for the existing Next.js, NestJS, Prisma, and PostgreSQL application. It is deliberately ordered around transaction integrity: stock, document numbers, ledger postings, and auditability must be correct before reporting or analytics are trusted.

Product requirements used as planning inputs:

- Retail and wholesale billing must be fast, keyboard-driven, and batch-aware.
- Each batch has MRP, purchase rate, rate A/B/C, barcode, and optional expiry.
- Pricing follows party-item override, permitted manual override, party default rate, then MRP fallback.
- Schemes, payments, returns, ledgers, audit controls, reports, backups, and role-based permissions are required.

## Current baseline - September 2026

### Usable today

- Master data: items, categories, brands, units, GST slabs, warehouses, suppliers, customers, price lists, item prices, party prices, batches, routes, and salesmen.
- Core transactions: purchase, purchase order and receiving, purchase return, sales, sales return, stock ledger, and basic customer/supplier ledger services.
- Backend report endpoints and a document-series service exist.

### Must be completed before release

- The frontend currently has no working pages for inventory, accounts, reports, users/roles, settings, or document-series navigation entries.
- Dashboard feature files are empty and the dashboard is only a static welcome screen.
- Authentication, authorization, audit logs, held bills, shortcuts, scheme processing, and backup operations are not implemented end to end.
- Sales and sales returns should use the server-side document-number engine, not client-side sequence generation.
- Automated business-flow tests are missing.

## Delivery sequence

### Foundation release - Stabilize the current transaction baseline

**Goal:** Make the existing purchase, sales, and return functions releasable for controlled internal use.

1. Complete the outstanding current code batch, run Prisma migrations in a non-production environment, and commit it as a coherent release candidate.
2. Make every transaction number server-generated and transaction-safe. Remove UI-generated sales and sales-return document numbers.
3. Add transaction status and cancellation rules consistently. A cancellation must reverse only its own stock and ledger effects, and preserve the original document.
4. Create API integration tests for purchase, sale, purchase return, sale return, insufficient stock, duplicate document numbers, and concurrent save attempts.
5. Make the frontend production build independent of external Google Font downloads or provide local font assets.
6. Document API contracts, migration steps, environment configuration, and release checks.

**Exit criteria:** backend and frontend production builds pass; migrations apply cleanly; all core transaction tests pass; no client can create a duplicate transaction number.

### Phase 1 - Fast billing, pricing, and schemes

**Goal:** Deliver the high-speed billing workflow and correct commercial rules.

1. Implement party default rate selection (A/B/C), batch rate A/B/C storage, and the final pricing engine in this exact priority: party-item override, authorized manual override, party default rate, MRP fallback.
2. When a manual rate is entered, show the required save-for-party decision. Persist only the party-item price when approved; otherwise retain it only on the current bill.
3. Add roles/permissions before enabling manual rate edits, discounts, profit access, bill edits, or deletion/cancellation controls.
4. Create purchase-defined schemes: quantity (for example 10+1), free-item schemes, and percentage discount schemes. Store applied scheme details on bill lines so reports are reproducible.
5. Ensure free items affect stock but have zero sale value and that scheme calculation order is quantity, free items, then payable-quantity discount.
6. Improve barcode behavior: auto-select when exactly one in-stock batch matches; otherwise select the oldest valid batch and let the operator override through a quick picker.
7. Add held bills: save multiple drafts without stock or ledger impact, recall safely, expire/archive when necessary, and audit every recall or conversion.
8. Complete the billing side panel with party outstanding, total sales, top items, and purchase history.

**Exit criteria:** billing is usable without a mouse for normal workflow; pricing and scheme calculations are deterministic and covered by tests; held bills never affect financial or stock balances.

### Phase 2 - Payments and ledgers

**Goal:** Make financial handling correct and traceable at the transaction level.

1. Record primary amount and secondary amount on every relevant sales bill.
2. For cash sales, post primary amount to Cash Ledger and secondary amount to Other Cash Ledger. For credit sales, post the full amount to the party ledger.
3. Build receipt allocation that automatically splits primary and secondary amounts according to the originating bill, with traceable allocation records.
4. Complete Cash, UPI, Card, Credit, and Mixed payment handling. Include card surcharge as a separate, auditable value (fixed amount or percentage).
5. Build receipt, payment, customer ledger, supplier ledger, and cash/other-cash screens for the APIs already present.

**Exit criteria:** every financial entry balances and every payment allocation is traceable to its source bill.

### Phase 3 - Reporting, dashboard, and keyboard workflow

**Goal:** Make operating data visible and fast to use.

1. Implement dashboard cards and charts from the existing report APIs: sales, outstanding, low stock, recent bills, and top items.
2. Build report pages with saved filters and export-ready data for sales (bill/item/party/batch), purchase, profit, outstanding/ageing, stock/current/batch/value/movement, payments, sales returns, GST, and control reports.
3. Build a configurable shortcut registry: action, key combination, enabled state, role eligibility, conflict detection, and user preferences. Start with new bill, hold/recall, purchase, receipt/payment, ledger, debit note, edit bill, sale return, batch selection, item information, outstanding, save, and reports.
4. Establish performance budgets and measure them: billing submit under one second, barcode search effectively immediate, and ordinary reports under three seconds against representative data.

**Exit criteria:** every navigation entry opens a usable screen; reports reconcile to transaction and ledger records; high-volume billing passes keyboard and performance acceptance tests.

### Phase 4 - Reliability, access control, analytics, and automation

**Goal:** Prepare the ERP for production operation and data-driven decisions.

1. Add daily automated PostgreSQL backups, encrypted/off-machine retention, restore drills, and a permission-controlled manual backup/download operation.
2. Add monitoring for failed jobs, backup failures, slow report queries, transaction errors, and stock/ledger reconciliation exceptions.
3. Implement authentication, admin/staff roles, permission checks in the API, and UI-level capability checks.
4. Add immutable audit events for rate changes, discounts, bill edits, cancellation/deletion attempts, stock adjustment, and permission changes.
5. Build advanced analytics from verified historical data: fast/slow/dead stock, reorder recommendations, sales forecast, category performance, and trend analysis.
6. Add bank reconciliation and GST return outputs (GSTR-1 and 3B) after accounting and tax data are validated.
7. Design APIs and responsive workflows for the future mobile client only after the web transactions are stable.

**Exit criteria:** restore drill succeeds, operating alerts are actionable, access controls and audit history are verified, analytics use reconciled data, and production support procedures are documented.

## Cross-cutting definition of done

No feature is complete until it has:

1. database migration and rollback/compatibility plan;
2. validated API DTOs and clear error responses;
3. frontend loading, empty, error, and permission states;
4. unit tests for rules and integration tests for side effects;
5. audit events where a business or financial decision is changed;
6. keyboard behavior where the feature is used at the billing desk;
7. performance measurement for transaction and report operations;
8. documentation and acceptance cases signed off by a business user.

## Deferred workstream - Primary/secondary inventory and Stock Receive

This scope is intentionally deferred. Do not add `isSecondary`, separate ledgers, Stock Receive, or Primary-only/Secondary-only reporting filters during the active phases. When it is resumed, treat it as a data-model and transaction-migration project: classify batches and stock ledger entries, create the dedicated Stock Receive transaction, then update sales, returns, allocation, and reports together.

## Immediate next sprint

1. Stabilize and test the current uncommitted purchase/sales/return changes.
2. Move all transaction numbering to the backend document-number service.
3. Implement party default rate A/B/C, party-item overrides, and manual price overrides.
4. Implement hold/recall bills and barcode batch selection improvements.
5. Build accounts, dashboard, reports, settings, and document-series pages in small vertical slices, beginning with screens backed by existing APIs.
6. Add roles, permissions, and audit logs after the operational workflows are complete.
