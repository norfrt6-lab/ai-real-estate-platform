export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface TimeStamps {
  createdAt: Date;
  updatedAt: Date;
}

export type ID = string;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
