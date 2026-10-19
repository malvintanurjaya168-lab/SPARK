'use client';

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Student {
  id: number;
  name: string;
  nomor_induk: string;
  kelas?: string | null;
}

interface StudentSearchProps {
  value: string;
  onChange: (value: string, student: Student | null) => void;
  students: Student[];
  placeholder?: string;
  disabled?: boolean;
}

export function StudentSearch({ value, onChange, students, placeholder = "Cari siswa...", disabled = false }: StudentSearchProps) {
  const [open, setOpen] = React.useState(false)

  const selectedStudent = React.useMemo(() => 
    students.find((s) => s.id.toString() === value),
  [value, students])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white text-slate-800 border-slate-300"
            disabled={disabled}
          />
        }
      >
        {selectedStudent
          ? `${selectedStudent.name} (${selectedStudent.nomor_induk})`
          : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Ketik nama atau nomor induk..." />
          <CommandList>
            <CommandEmpty>Siswa tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`${student.name} ${student.nomor_induk} ${student.kelas || ''}`}
                  onSelect={() => {
                    onChange(student.id.toString() === value ? "" : student.id.toString(), student.id.toString() === value ? null : student)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === student.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{student.name}</span>
                    <span className="text-xs text-slate-500">
                      NI: {student.nomor_induk} {student.kelas ? `| Kelas: ${student.kelas}` : ''}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
