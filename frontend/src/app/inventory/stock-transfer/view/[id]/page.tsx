import ERPLayout from "@/layouts/ERPLayout";

import StockTransferViewPage from "@/features/inventory/stock-transfer/pages/StockTransferViewPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <ERPLayout>
      <StockTransferViewPage transferId={id} />
    </ERPLayout>
  );
}
