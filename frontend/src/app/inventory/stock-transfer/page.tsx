import ERPLayout from "@/layouts/ERPLayout";

import StockTransferListPage from "@/features/inventory/stock-transfer/pages/StockTransferListPage";

export default function Page() {
  return (
    <ERPLayout>
      <StockTransferListPage />
    </ERPLayout>
  );
}
