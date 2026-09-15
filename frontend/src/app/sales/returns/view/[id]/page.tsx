import ERPLayout from "@/layouts/ERPLayout";

import SaleReturnViewPage from "@/features/sale-return/pages/SaleReturnViewPage";

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
      <SaleReturnViewPage id={id} />
    </ERPLayout>
  );
}
