export type ShiftStatus = 'Open' | 'Match' | 'Shortage' | 'Surplus';

export interface ShiftDto {
  id: string;
  cashierId?: string | null;
  cashierName: string;
  startTime: string;
  endTime?: string | null;
  isOpen: boolean;
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  actualCash?: number | null;
  difference?: number | null;
  status: ShiftStatus;
  statusText: string;
  transactionCount: number;
  totalDiscounts?: number;
  notes?: string | null;
}

export interface CloseShiftRequest {
  actualCash: number;
  notes?: string | null;
  cashierId?: string | null;
  cashierName?: string | null;
}

export interface StartShiftRequest {
  cashierName: string;
  openingBalance?: number;
  cashierId?: string | null;
  notes?: string | null;
}
