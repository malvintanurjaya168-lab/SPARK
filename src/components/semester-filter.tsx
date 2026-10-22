'use client';

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Semester } from "@/types"

interface SemesterFilterProps {
  semesters: Semester[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SemesterFilter({ semesters, value, onChange, disabled = false }: SemesterFilterProps) {
  const getDisplayValue = () => {
    if (value === 'all') return 'Semua Waktu (Kumulatif)';
    const selectedSemester = semesters.find(s => s.id.toString() === value);
    return selectedSemester ? `${selectedSemester.name} ${selectedSemester.is_active ? '(Aktif)' : ''}` : 'Pilih Semester';
  };

  return (
    <Select value={value} onValueChange={(val: any) => { if (val) onChange(val); }} disabled={disabled}>
      <SelectTrigger className="w-[280px] bg-white border-slate-300">
        <SelectValue placeholder="Pilih Semester">
          {value ? getDisplayValue() : 'Pilih Semester'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Daftar Semester</SelectLabel>
          <SelectItem value="all">Semua Waktu (Kumulatif)</SelectItem>
          {semesters.map((semester) => (
            <SelectItem key={semester.id} value={semester.id.toString()}>
              {semester.name} {semester.is_active ? '(Aktif)' : ''}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
