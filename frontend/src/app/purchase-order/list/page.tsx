import ERPLayout from "@/layouts/ERPLayout";
import PurchaseOrderListPage from "@/features/purchase-order/pages/PurchaseOrderListPage";

export default function Page() {
  return (
    <ERPLayout>
      <PurchaseOrderListPage />
    </ERPLayout>
  );
}
