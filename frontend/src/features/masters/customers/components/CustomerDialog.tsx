"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";

import { CustomerService } from "@/services/customer/customer.service";

import type { Customer } from "../types/customer.types";

import CustomerForm, {
  CustomerFormValues,
} from "./CustomerForm";

interface CustomerDialogProps {
  open: boolean;

  onOpenChange(open: boolean): void;

  customer?: Customer;

  onSuccess?(): void;
}

export default function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    values: CustomerFormValues,
  ) {
    try {
      setLoading(true);

      if (customer) {
        await CustomerService.update(
          customer.id,
          values,
        );

        toast.success("Customer updated successfully.");
      } else {
        await CustomerService.create(values);

        toast.success("Customer created successfully.");
      }

      onOpenChange(false);

      onSuccess?.();
    } catch (error) {
      console.error(error);

      toast.error("Failed to save customer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ERPFormDialog
      open={open}
      title={
        customer
          ? "Edit Customer"
          : "New Customer"
      }
      loading={loading}
      onClose={() => onOpenChange(false)}
      onSubmit={() => {
        const form = document.getElementById(
          "customer-form",
        ) as HTMLFormElement | null;

        form?.requestSubmit();
      }}
    >
      <CustomerForm
        defaultValues={
          customer
            ? {
                customerCode:
                  customer.customerCode,
                name: customer.name,
                customerGroup:
                  customer.customerGroup,
                priceLevel:
                  customer.priceLevel ?? "",
                priceListId:
                  customer.priceListId,
                gstCategory:
                  customer.gstCategory,
                gstin:
                  customer.gstin ?? "",
                mobile:
                  customer.mobile ?? "",
                email:
                  customer.email ?? "",
                address:
                  customer.address ?? "",
                city:
                  customer.city ?? "",
                state:
                  customer.state ?? "",
                pincode:
                  customer.pincode ?? "",
                openingBalance:
                  customer.openingBalance,
                creditLimit:
                  customer.creditLimit,
                isActive:
                  customer.isActive,
              }
            : undefined
        }
        loading={loading}
        onSubmit={handleSubmit}
      />
    </ERPFormDialog>
  );
}