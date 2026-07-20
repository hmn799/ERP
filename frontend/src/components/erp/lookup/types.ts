export interface LookupOption {
  id: string;

  code: string;

  name: string;
}

export interface LookupProps<T extends LookupOption> {
  value: string;

  items: T[];

  loading?: boolean;

  placeholder?: string;

  getSubtitle?(item: T): string;

  onSearch(value: string): void;

  onSelect(item: T): void;
}