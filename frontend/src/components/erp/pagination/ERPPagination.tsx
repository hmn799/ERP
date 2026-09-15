"use client";

interface ERPPaginationProps {
  page: number;
  pageSize: number;
  total: number;

  onPageChange(page: number): void;
}

export default function ERPPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: ERPPaginationProps) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize),
  );

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <button
        className="rounded border px-4 py-2 disabled:opacity-50"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <button
        className="rounded border px-4 py-2 disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}