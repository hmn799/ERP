import PurchaseOrderViewPage from "@/features/purchase-order/pages/PurchaseOrderViewPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <PurchaseOrderViewPage
      purchaseOrderId={id}
    />
  );
}