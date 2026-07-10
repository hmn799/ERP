export interface GstSlab {
  id: string;

  name: string;

  percentage: number;
}

export interface CreateGstSlabDto {
  name: string;

  percentage: number;
}