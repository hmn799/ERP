import { Database } from "lucide-react";

interface TableEmptyProps {
  title?: string;
  description?: string;
}

export default function TableEmpty({
  title = "No Records Found",
  description = "There are no records available.",
}: TableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border py-16">
      <Database className="mb-4 h-12 w-12 text-muted-foreground" />

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}