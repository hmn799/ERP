"use client";

import { useState } from "react";
import { toast } from "sonner";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPDeleteDialog from "@/components/erp/crud/ERPDeleteDialog";
import ImportMastersDialog from "@/components/erp/crud/ImportMastersDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

import { useCustomers } from "../hooks/useCustomers";
import CustomerTable from "../components/CustomerTable";
import CustomerDialog from "../components/CustomerDialog";

import customerService from "@/services/customer/customer.service";

import { Customer } from "../types/customer.types";

export default function CustomersPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useCustomers();

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [selected, setSelected] =
    useState<Customer>();

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [importOpen, setImportOpen] =
    useState(false);

  async function deleteCustomer() {
    if (!selected) return;

    try {
      await customerService.remove(
        selected.id,
      );

      toast.success(
        "Customer deleted",
      );

      setDeleteOpen(false);

      refetch();
    } catch {
      toast.error(
        "Unable to delete customer",
      );
    }
  }

  const filtered = data.filter(
    (x: Customer) =>
      x.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      x.customerCode
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <ERPToolbar
        search={search}
        searchPlaceholder="Search Customers..."
        onSearch={setSearch}
        addLabel="Add Customer"
        onRefresh={refetch}
        onAdd={() => {
          setSelected(undefined);
          setDialogOpen(true);
        }}
        extraActions={
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        }
      />

      <CustomerTable
        data={filtered}
        loading={isLoading}
        onEdit={(customer) => {
          setSelected(customer);
          setDialogOpen(true);
        }}
        onDelete={(customer) => {
          setSelected(customer);
          setDeleteOpen(true);
        }}
      />

      <CustomerDialog
        open={dialogOpen}
        customer={selected}
        onOpenChange={
          setDialogOpen
        }
        onSuccess={refetch}
      />

      <ERPDeleteDialog
        open={deleteOpen}
        title="Delete Customer"
        description={`Delete "${selected?.name}" ?`}
        onClose={() =>
          setDeleteOpen(false)
        }
        onConfirm={deleteCustomer}
      />

      <ImportMastersDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Customers"
        entity="customer"
        templateHeaders={[
          "Name",
          "Customer Group",
          "GST Category",
          "GSTIN",
          "Mobile",
          "Email",
          "Address",
          "City",
          "State",
          "Pincode",
          "Opening Balance",
          "Credit Limit",
        ]}
        templateSample={[
          "Ramesh Kumar",
          "RETAIL",
          "Unregistered",
          "",
          "9876543210",
          "",
          "",
          "",
          "",
          "",
          "0",
          "0",
        ]}
        helpText='Customer Group: RETAIL, WHOLESALE, or DISTRIBUTOR. GST Category: "Registered" or "Unregistered". Customer code is generated automatically.'
        onSuccess={refetch}
      />

    </div>
  );
}