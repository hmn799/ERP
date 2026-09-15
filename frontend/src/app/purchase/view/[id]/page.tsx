import ERPLayout from "@/layouts/ERPLayout";

import PurchaseViewPage from "@/features/purchase/pages/PurchaseViewPage";

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
    <ERPLayout>
      <PurchaseViewPage
        purchaseId={id}
      />
    </ERPLayout>
  );
}