"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import ERPToolbar from "./ERPToolbar";
import ERPDataTable from "./ERPDataTable";

export interface CrudService<T, TCreate> {
  getAll(): Promise<T[]>;
  create(dto: TCreate): Promise<T>;
  update(id: string, dto: TCreate): Promise<T>;
  remove(id: string): Promise<void>;
}

interface CRUDPageProps<T, TCreate> {
  title: string;

  data: T[];

  columns: ColumnDef<T>[];

  service: CrudService<T, TCreate>;

  onRefresh(): void;

  children: React.ReactNode;
}

export default function CRUDPage<T, TCreate>({
  title,
  data,
  columns,
  onRefresh,
  children,
}: CRUDPageProps<T, TCreate>) {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>

      <ERPToolbar
        search={search}
        onSearch={setSearch}
        onAdd={() => {}}
        onRefresh={onRefresh}
      />

      <ERPDataTable
        columns={columns}
        data={data}
      />

      {children}
    </div>
  );
}