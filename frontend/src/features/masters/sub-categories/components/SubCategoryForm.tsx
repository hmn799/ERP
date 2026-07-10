"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import categoryService from "@/services/category/category.service";

interface Category {
  id: string;
  name: string;
}

export interface SubCategoryFormValues {
  name: string;
  categoryId: string;
}

interface SubCategoryFormProps {
  defaultValues?: SubCategoryFormValues;

  loading?: boolean;

  onSubmit(values: SubCategoryFormValues): void;
}

export default function SubCategoryForm({
  defaultValues,
  loading,
  onSubmit,
}: SubCategoryFormProps) {
  const [name, setName] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name);
      setCategoryId(defaultValues.categoryId);
    } else {
      setName("");
      setCategoryId("");
    }
  }, [defaultValues]);

  return (
    <form
      id="sub-category-form"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit({
          name,
          categoryId,
        });
      }}
    >
      <Select
        value={categoryId}
        onValueChange={setCategoryId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>

        <SelectContent>
          {categories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.id}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={name}
        disabled={loading}
        placeholder="Enter Sub Category"
        onChange={(e) => setName(e.target.value)}
      />
    </form>
  );
}