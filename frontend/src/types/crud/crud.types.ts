import { ColumnDef } from "@tanstack/react-table";
import { ComponentType } from "react";

export interface CrudService<TEntity, TCreateDto> {
  getAll(): Promise<TEntity[]>;

  create(dto: TCreateDto): Promise<TEntity>;

  update(
    id: string,
    dto: TCreateDto,
  ): Promise<TEntity>;

  remove(id: string): Promise<void>;
}

export interface CrudPageConfig<TEntity, TCreateDto> {
  title: string;

  columns: ColumnDef<TEntity>[];

  service: CrudService<TEntity, TCreateDto>;

  Form: ComponentType<any>;
}