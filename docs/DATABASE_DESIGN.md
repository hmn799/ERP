# DATABASE DESIGN
Version 1.0

---

# Database

PostgreSQL

---

# Design Principles

- Third Normal Form (3NF)
- No duplicate business data
- Soft delete where applicable
- Audit fields in every transaction
- UUID/CUID primary keys
- Foreign key constraints
- Indexed search columns
- Financial year aware
- Multi-branch ready

---

# Core Master Tables

## Category

Purpose

Store product categories.

Relationships

Item

---

## SubCategory

Purpose

Store sub categories.

Relationships

Category

Item

---

## Brand

Purpose

Store brands.

Relationships

Item

---

## Unit

Purpose

Store measurement units.

Relationships

Item

---

## GST Slab

Purpose

Store GST percentages.

Relationships

Item

---

## Warehouse

Purpose

Store warehouses.

Relationships

Warehouse Stock

Purchase

Sales

Stock Transfer

---

## Item

Purpose

Master product information.

Contains

Item Code

Name

GST

Brand

Category

Unit

Barcode (Default)

Status

Relationships

Batch

Warehouse Stock

Purchase

Sales

Price Master

---

## Batch

Purpose

Purchase batch information.

Contains

Batch Number

Purchase Rate

MRP

Expiry

Barcode

Relationships

Item

Warehouse Stock

Purchase

Sales

---

## Warehouse Stock

Purpose

Current stock per Warehouse + Batch.

Unique Key

Warehouse + Item + Batch

---

## Stock Ledger

Purpose

Immutable inventory movement history.

Never edited.

Never deleted.

---

# Pricing Tables

## Price List

Purpose

Retail

Wholesale

Distributor

Rate A

Rate B

Rate C

Future Price Lists

---

## Item Price

Purpose

Store selling price of an Item for a Price List.

---

## Party Price

Purpose

Override Item Price for specific customers.

---

## Quantity Price

Purpose

Quantity slab pricing.

---

## Scheme

Purpose

Buy X Get Y

Discount

Promotion

---

# Customer

Purpose

Store customers.

Important Fields

Credit Limit

Credit Days

Default Price List

Salesman

Route

GST

Outstanding

---

# Supplier

Purpose

Store suppliers.

---

# Financial Tables

Ledger

Receipt

Payment

Journal

Contra

Expense

---

# Transaction Tables

Purchase Order

Purchase Bill

Purchase Return

Sales Invoice

Sales Return

Stock Transfer

Stock Adjustment

---

# Future Modules

CRM

Manufacturing

Payroll

HR

POS

Mobile

E-Commerce

AI

---

END OF VERSION 1.0