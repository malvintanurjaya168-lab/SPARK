import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { STATUS_THRESHOLDS } from "./constants";
import { PointStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPointStatus(points: number): {
  status: PointStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (points >= STATUS_THRESHOLDS.EXCELLENT) {
    return {
      status: 'excellent',
      label: 'Excellent',
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    };
  } else if (points >= STATUS_THRESHOLDS.GOOD) {
    return {
      status: 'good',
      label: 'Good',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    };
  } else if (points >= STATUS_THRESHOLDS.WARNING) {
    return {
      status: 'warning',
      label: 'Warning',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    };
  } else {
    return {
      status: 'critical',
      label: 'Critical',
      color: 'bg-red-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    };
  }
}

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
