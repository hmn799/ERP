"use client";

import { useState } from "react";

export function useCrud<T>() {
  const [selected, setSelected] = useState<T | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  function openCreate() {
    setSelected(null);
    setCreateOpen(true);
  }

  function openEdit(item: T) {
    setSelected(item);
    setEditOpen(true);
  }

  function openDelete(item: T) {
    setSelected(item);
    setDeleteOpen(true);
  }

  function closeAll() {
    setCreateOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
    setSelected(null);
  }

  return {
    selected,

    createOpen,
    editOpen,
    deleteOpen,

    openCreate,
    openEdit,
    openDelete,

    closeAll,
  };
}