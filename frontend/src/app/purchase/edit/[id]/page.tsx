import ERPLayout from "@/layouts/ERPLayout";

import PurchasePage from "@/features/purchase/pages/PurchasePage";

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
      <PurchasePage
        purchaseId={id}
      />
    </ERPLayout>
  );
}