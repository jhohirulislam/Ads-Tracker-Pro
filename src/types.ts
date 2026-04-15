export type Status = 'active' | 'paused' | 'ended';

export interface Campaign {
  id: string;
  name: string;
  company: string;
  platform: string;
  start: string;
  end: string;
  defaultPrice: number;
  defaultCost: number;
  note: string;
  status: Status;
  createdAt: number;
}

export interface AdEntry {
  id: string;
  campId: string;
  campName: string;
  adset: string;
  adsetStatus: Status;
  date: string;
  spendUSD: number;
  spendBDT: number;
  sales: number;
  price: number;
  cost: number;
  other: number;
  rev: number;
  prodCostTotal: number;
  totalCost: number;
  profit: number;
  roas: number;
  cpp: number;
  cps: number;
  usdRate: number;
  note: string;
}

export interface DateRange {
  from: string | null;
  to: string | null;
  label: string;
  mode: string;
}
