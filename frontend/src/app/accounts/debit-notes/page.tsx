import ERPLayout from "@/layouts/ERPLayout";

import AdjustmentNotesPage from "@/features/adjustment-notes/pages/AdjustmentNotesPage";

export default function Page() {
  return (
    <ERPLayout>
      <AdjustmentNotesPage noteType="DEBIT" />
    </ERPLayout>
  );
}
