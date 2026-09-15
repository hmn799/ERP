import ERPLayout from "@/layouts/ERPLayout";

import SalesViewPage from "@/features/sales/pages/SalesViewPage";

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
      <SalesViewPage saleId={id} />
    </ERPLayout>
  );
}
