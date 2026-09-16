import ERPLayout from "@/layouts/ERPLayout";

import LedgerPage from "@/features/accounts/ledger/pages/LedgerPage";

export default function Page() {
  return (
    <ERPLayout>
      <LedgerPage />
    </ERPLayout>
  );
}
