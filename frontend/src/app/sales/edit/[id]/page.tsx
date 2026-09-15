import SalesPage from "@/features/sales/pages/SalesPage";

interface SalesEditRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({
  params,
}: SalesEditRouteProps) {
  const { id } = await params;

  return (
    <SalesPage saleId={id} />
  );
}