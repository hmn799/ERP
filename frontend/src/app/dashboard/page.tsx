import ERPLayout from "@/layouts/ERPLayout";

export default function DashboardPage() {
  return (
    <ERPLayout>

      <div className="space-y-4">

        <h1 className="text-3xl font-bold">
          ERP Dashboard
        </h1>

        <p className="text-muted-foreground">
          Welcome to your ERP System.
        </p>

      </div>

    </ERPLayout>
  );
}
