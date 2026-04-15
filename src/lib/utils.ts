import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const storage = {
  get: (key: string) => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const formatCurrency = (val: number) => {
  return Math.round(val).toLocaleString('en-BD');
};

export const formatUSD = (val: number) => {
  return val.toFixed(2);
};
