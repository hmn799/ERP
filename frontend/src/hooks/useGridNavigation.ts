"use client";

import { useRef } from "react";

export function useGridNavigation() {
  const refs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  function key(
    row: number,
    column: number,
  ) {
    return `${row}-${column}`;
  }

  function register(
    row: number,
    column: number,
  ) {
    return (
      element: HTMLInputElement | null,
    ) => {
      refs.current[key(row, column)] =
        element;
    };
  }

  function focus(
    row: number,
    column: number,
  ) {
    refs.current[key(row, column)]?.focus();
  }

  function next(
    row: number,
    column: number,
  ) {
    focus(row, column + 1);
  }

  function previous(
    row: number,
    column: number,
  ) {
    focus(row, column - 1);
  }

  function onEnter(
    e: React.KeyboardEvent,
    row: number,
    column: number,
  ) {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    next(row, column);
  }

  return {
    register,
    focus,
    next,
    previous,
    onEnter,
  };
}