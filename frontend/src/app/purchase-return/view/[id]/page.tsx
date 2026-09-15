import ERPLayout from "@/layouts/ERPLayout";

import PurchaseReturnViewPage from "@/features/purchase-return/pages/PurchaseReturnViewPage";

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
      <PurchaseReturnViewPage id={id} />
    </ERPLayout>
  );
}