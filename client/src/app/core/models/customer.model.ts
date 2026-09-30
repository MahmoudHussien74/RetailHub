// ── Customer Models ──

export interface CustomerListDto {
  id: string;
  name: string;
  phone: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerDetailDto extends CustomerListDto {
  address?: string;
  invoiceCount: number;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  address?: string;
}

export interface UpdateCustomerDto extends CreateCustomerDto {
  id: string;
}
