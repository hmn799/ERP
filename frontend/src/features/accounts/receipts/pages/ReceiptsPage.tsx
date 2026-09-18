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

import ReceiptForm, {
  ReceiptFormValues,
} from "../components/ReceiptForm";

import VoucherReceiptPrint from "../../components/VoucherReceiptPrint";

import type { Receipt } from "../../types/ledger.types";
import type { CompanyProfile } from "@/features/settings/types/company.types";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getColumns(
  onPrint: (receipt: Receipt) => void,
): ColumnDef<Receipt>[] {
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
      id: "customer",
      header: "Customer",
      cell: ({ row }) =>
        `${row.original.customerCode} - ${row.original.customerName}`,
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

export default function ReceiptsPage() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["receipts"],
    queryFn: LedgerService.listReceipts,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: BankAccountService.getAll,
    retry: false,
  });

  const [company, setCompany] =
    useState<CompanyProfile | null>(null);

  const [printingReceipt, setPrintingReceipt] =
    useState<Receipt | null>(null);

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
    if (!printingReceipt) {
      setPrintingOutstanding(null);
      return;
    }

    let cancelled = false;

    function triggerPrint() {
      window.setTimeout(() => {
        window.print();
      }, 100);
    }

    LedgerService.getCustomerOutstanding(
      printingReceipt.customerId,
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
      setPrintingReceipt(null);
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
  }, [printingReceipt]);

  async function handleSubmit(
    values: ReceiptFormValues,
  ) {
    if (!values.customerId) {
      toast.error("Select a customer.");
      return;
    }

    try {
      setSaving(true);

      await LedgerService.createReceipt(values);

      toast.success("Receipt recorded.");

      setDialogOpen(false);

      refetch();
    } catch (error) {
      console.error(error);

      toast.error("Failed to record receipt.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = data.filter(
    (receipt) =>
      receipt.customerName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      receipt.customerCode
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const printingBankAccountName = printingReceipt
    ?.bankAccountId
    ? bankAccounts.find(
        (account) =>
          account.id ===
          printingReceipt.bankAccountId,
      )?.name
    : null;

  return (
    <div className="space-y-6">
      {printingReceipt && (
        <VoucherReceiptPrint
          type="RECEIPT"
          record={printingReceipt}
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
        searchPlaceholder="Search receipts by customer..."
        onSearch={setSearch}
        addLabel="Record Receipt"
        onRefresh={refetch}
        onAdd={() => setDialogOpen(true)}
      />

      <ERPDataTable
        columns={getColumns(
          setPrintingReceipt,
        )}
        data={filtered}
        loading={isLoading}
      />

      <ERPFormDialog
        open={dialogOpen}
        title="Record Receipt"
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => {
          const form = document.getElementById(
            "receipt-form",
          ) as HTMLFormElement | null;

          form?.requestSubmit();
        }}
      >
        <ReceiptForm
          loading={saving}
          onSubmit={handleSubmit}
        />
      </ERPFormDialog>
    </div>
  );
}
