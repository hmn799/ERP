import PurchaseOrderReceivePage from "@/features/purchase-order/pages/PurchaseOrderReceivePage";

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
    <PurchaseOrderReceivePage
      purchaseOrderId={id}
    />
  );
}