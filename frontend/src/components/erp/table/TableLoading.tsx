import { Skeleton } from "@/components/ui/skeleton";

interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export default function TableLoading({
  rows = 8,
  columns = 5,
}: TableLoadingProps) {
  return (
    <div className="rounded-lg border">
      <div className="border-b p-4">
        <Skeleton className="h-5 w-52" />
      </div>

      <div className="divide-y">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid gap-4 p-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton
                key={col}
                className="h-5"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}