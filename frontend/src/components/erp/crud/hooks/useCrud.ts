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

  function closeCreate() {
    setCreateOpen(false);
  }

  function closeEdit() {
    setEditOpen(false);
    setSelected(null);
  }

  function closeDelete() {
    setDeleteOpen(false);
    setSelected(null);
  }

  function closeAll() {
    closeCreate();
    closeEdit();
    closeDelete();
  }

  return {
    selected,

    createOpen,
    editOpen,
    deleteOpen,

    openCreate,
    openEdit,
    openDelete,

    closeCreate,
    closeEdit,
    closeDelete,

    closeAll,
  };
}