"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

import ERPToolbar from "@/components/erp/crud/ERPToolbar";
import ERPFormDialog from "@/components/erp/crud/ERPFormDialog";
import ERPDataTable from "@/components/erp/crud/ERPDataTable";
import { Button } from "@/components/ui/button";

import LedgerService from "@/services/ledger/ledger.service";
import BankAccountService from "@/services/bank/bank-account.service";
import CompanyService from "@/services/company/company.service";

import PaymentForm, {
  PaymentFormValues,
} from "../components/PaymentForm";

import VoucherReceiptPrint from "../../components/VoucherReceiptPrint";

import type { Payment } from "../../types/ledger.types";
import type { CompanyProfile } from "@/features/settings/types/company.types";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getColumns(
  onPrint: (payment: Payment) => void,
): ColumnDef<Payment>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        new Date(
          row.original.date,
        ).toLocaleDateString("en-IN"),
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) =>
        `${row.original.supplierCode} - ${row.original.supplierName}`,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) =>
        `₹${money(row.original.amount)}`,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) =>
        row.original.remarks || "-",
    },
    {
      id: "billNo",
      header: "Against Bill",
      cell: ({ row }) =>
        row.original.billNo || "General",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onPrint(row.original)
          }
        >
          Print
        </Button>
      ),
    },
  ];
}

export default function PaymentsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["payments"],
    queryFn: LedgerService.listPayments,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: BankAccountService.getAll,
    retry: false,
  });

  const [company, setCompany] =
    useState<CompanyProfile | null>(null);

  const [printingPayment, setPrintingPayment] =
    useState<Payment | null>(null);

  const [
    printingOutstanding,
    setPrintingOutstanding,
  ] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CompanyService.getProfile()
      .then(setCompany)
      .catch((err) =>
        console.error(
          "Failed to load company profile:",
          err,
        ),
      );
  }, []);

  useEffect(() => {
    if (!printingPayment) {
      setPrintingOutstanding(null);
      return;
    }

    let cancelled = false;

    function triggerPrint() {
      window.setTimeout(() => {
        window.print();
      }, 100);
    }

    LedgerService.getSupplierOutstanding(
      printingPayment.supplierId,
    )
      .then((value) => {
        if (!cancelled) {
          setPrintingOutstanding(value);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrintingOutstanding(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          triggerPrint();
        }
      });

    function handleAfterPrint() {
      setPrintingPayment(null);
    }

    window.addEventListener(
      "afterprint",
      handleAfterPrint,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "afterprint",
        handleAfterPrint,
      );
    };
  }, [printingPayment]);

  async function handleSubmit(
    values: PaymentFormValues,
  ) {
    if (!values.supplierId) {
      toast.error("Select a supplier.");
      return;
    }

    try {
      setSaving(true);

      await LedgerService.createPayment(values);

      toast.success("Payment recorded.");

      setDialogOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      toast.error("Failed to record payment.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = data.filter(
    (payment) =>
      payment.supplierName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      payment.supplierCode
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const printingBankAccountName = printingPayment
    ?.bankAccountId
    ? bankAccounts.find(
        (account) =>
          account.id ===
          printingPayment.bankAccountId,
      )?.name
    : null;

  return (
    <div className="space-y-6">
      {printingPayment && (
        <VoucherReceiptPrint
          type="PAYMENT"
          record={printingPayment}
          bankAccountName={
            printingBankAccountName
          }
          outstandingBalance={
            printingOutstanding
          }
          company={company}
        />
      )}

      <ERPToolbar
        search={search}
        searchPlaceholder="Search payments by supplier..."
        onSearch={setSearch}
        addLabel="Record Payment"
        onRefresh={refetch}
        onAdd={() => setDialogOpen(true)}
      />

      <ERPDataTable
        columns={getColumns(
          setPrintingPayment,
        )}
        data={filtered}
        loading={isLoading}
      />

      <ERPFormDialog
        open={dialogOpen}
        title="Record Payment"
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => {
          const form = document.getElementById(
            "payment-form",
          ) as HTMLFormElement | null;

          form?.requestSubmit();
        }}
      >
        <PaymentForm
          loading={saving}
          onSubmit={handleSubmit}
        />
      </ERPFormDialog>
    </div>
  );
}
