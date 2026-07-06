# BUSINESS RULES
Version 1.0

---

# GENERAL PRINCIPLES

- Every business transaction must be auditable.
- No transaction is permanently deleted.
- Financial postings must remain balanced.
- Stock movements must always be traceable.
- Every document has a status.
- Every document stores Created By, Updated By, Created Date and Updated Date.
- Every document belongs to a Financial Year.
- Every document belongs to a Branch (future ready).

---

# ITEM RULES

- Item Code must be unique.
- Item Name cannot be blank.
- GST Slab is mandatory.
- Base Unit is mandatory.
- Purchase Unit and Sale Unit are mandatory.
- Conversion Factor must be greater than zero.
- An inactive item cannot be used in transactions.

---

# BATCH RULES

- Batch Number is unique per Item.
- Purchase Rate belongs to Batch.
- MRP belongs to Batch.
- Expiry Date is optional.
- Barcode may differ between batches.
- Multiple batches of the same item are supported.

---

# PURCHASE RULES

- Purchase Order is optional.
- Purchase Bill may be linked to a Purchase Order.
- Partial receipt is allowed.
- Multiple Purchase Bills can complete one Purchase Order.
- Purchase updates Warehouse Stock.
- Purchase creates Stock Ledger entries.
- Purchase creates Supplier Ledger entries.

---

# SALES RULES

- Customer is optional for Cash Sale.
- Customer is mandatory for Credit Sale.
- Every Sales Invoice generates a document number.
- Selling price is calculated by Pricing Engine.
- Batch allocation is performed by FIFO Engine.
- Stock deduction is performed by Stock Engine.
- Ledger posting is automatic after successful invoice creation.

---

# PRICING RULES

Price calculation priority:

1. Party Price Override
2. Quantity Price
3. Active Scheme
4. Customer Default Price List
5. Item Price
6. MRP Validation

Selling below Minimum Sale Price is not allowed unless permitted.

---

# STOCK RULES

- Warehouse Stock stores current quantity.
- Stock Ledger stores complete movement history.
- Stock Ledger is immutable.
- Stock cannot become negative unless allowed in System Settings.
- FIFO is the default batch allocation strategy.
- FEFO may be enabled through System Settings in the future.

---

# RETURN RULES

Purchase Return

- Increases supplier debit.
- Reduces stock.
- Updates Stock Ledger.

Sales Return

- Increases stock.
- Updates Stock Ledger.
- Reverses customer ledger.

---

# CUSTOMER RULES

- Every customer has one default Price List.
- Credit Limit is optional.
- Credit Days are optional.
- Customer may have Party Price Overrides.
- Customer may belong to a Route.
- Customer may belong to a Salesman.

---

# SUPPLIER RULES

- Supplier Code must be unique.
- GSTIN is optional.
- Opening Balance is supported.

---

# GST RULES

- GST is calculated per line item.
- Bill level discount is applied before final GST calculation.
- CGST and SGST for intra-state transactions.
- IGST for inter-state transactions.
- GST rounding follows System Settings.

---

# DOCUMENT NUMBER RULES

- Every transaction document has a unique number.
- Number generation is handled only by Document Number Engine.
- Manual numbering is configurable.

---

# PERMISSION RULES

- Users belong to Roles.
- Permissions are Role based.
- Sensitive operations require appropriate permission.
- Price modification permission is configurable.
- Negative stock override permission is configurable.

---

# AUDIT RULES

Every transaction stores:

- Created By
- Updated By
- Created Date
- Updated Date
- Status
- Remarks

Audit history is never deleted.

---

END OF VERSION 1.0