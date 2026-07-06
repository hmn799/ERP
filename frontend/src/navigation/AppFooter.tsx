"use client";

export default function AppFooter() {
  return (
    <footer className="border-t bg-background px-6 py-3 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Muljibhai Harjibhai ERP
    </footer>
  );
}