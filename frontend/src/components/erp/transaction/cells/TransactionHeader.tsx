export default function TransactionHeader() {
  return (
    <thead className="bg-muted">
      <tr>
        <th className="p-2 text-left w-16">#</th>

        <th className="p-2 text-left min-w-[280px]">
          Item / Barcode
        </th>

        <th className="p-2 text-right w-24">
          Qty
        </th>

        <th className="p-2 text-right w-24">
          Free
        </th>

        <th className="p-2 text-right w-32">
          Total Value
        </th>

        <th className="p-2 text-right w-28">
          Rate / PCS
        </th>

        <th className="p-2 text-center w-24">
          Batch
        </th>

        <th className="p-2 text-right w-24">
          MRP
        </th>

        <th className="p-2 text-right w-20">
          GST
        </th>

        <th className="p-2 text-center w-32">
          Expiry
        </th>

        <th className="p-2 text-center w-16">
          Del
        </th>
      </tr>
    </thead>
  );
}