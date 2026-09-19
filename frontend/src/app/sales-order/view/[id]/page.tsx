import ERPLayout from "@/layouts/ERPLayout";

import SalesOrderViewPage from "@/features/sales-order/pages/SalesOrderViewPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <ERPLayout>
      <SalesOrderViewPage salesOrderId={id} />
    </ERPLayout>
  );
}
