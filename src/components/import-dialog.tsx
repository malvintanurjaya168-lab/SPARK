'use client';

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { DataTable } from "./data-table"

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [previewData, setPreviewData] = React.useState<any[]>([])
  const [isImporting, setIsImporting] = React.useState(false)
  const [dataType, setDataType] = React.useState<'siswa' | 'guru'>('siswa')

  // Reset when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setPreviewData([])
      setDataType('siswa')
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    console.log('File selected:', selectedFile.name, selectedFile.type, selectedFile.size)
    setFile(selectedFile)
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        console.log('File read successfully, type:', typeof bstr)
        
        if (!bstr) {
          console.error('File content is empty')
          toast.error("File kosong atau tidak dapat dibaca")
          return
        }
        
        const wb = XLSX.read(bstr as string, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        
        console.log('Parsed data:', data.length, 'rows')
        if (data.length > 0) {
          console.log('First row:', data[0])
        }
        
        // Map common column names to our expected format
        const formattedData = data.map((row: any) => {
          // Get keys and trim whitespace from them
          const trimmedRow: any = {};
          Object.keys(row).forEach(key => {
            trimmedRow[key.trim()] = row[key];
          });

          // Check if this is guru/pembina data by looking for Role column
          const role = trimmedRow['Role'] || trimmedRow['role'];
          const isGuru = role && (role.toLowerCase() === 'guru' || role.toLowerCase() === 'staff');

          // Handle Wali Kelas - if it's "-", set to null
          let wali_kelas = trimmedRow['Wali Kelas'] || trimmedRow['wali_kelas'];
          if (wali_kelas === '-' || wali_kelas === '' || wali_kelas === null) {
            wali_kelas = null;
          }

          if (isGuru) {
            // Guru/Pembina format
            return {
              nomor_induk: trimmedRow['Nomor Induk'] || trimmedRow['nomor_induk'] || trimmedRow['NIP'] || trimmedRow['nip'],
              name: trimmedRow['Nama'] || trimmedRow['name'] || trimmedRow['Nama Guru'],
              role: role?.toLowerCase() || 'guru',
              wali_kelas: wali_kelas,
            };
          } else {
            // Student format (default)
            return {
              nomor_induk: trimmedRow['Nomor Induk'] || trimmedRow['nomor_induk'] || trimmedRow['NIS'] || trimmedRow['nis'],
              name: trimmedRow['Nama'] || trimmedRow['name'] || trimmedRow['Nama Siswa'],
              kelas: trimmedRow['Kelas'] || trimmedRow['kelas'],
              angkatan: trimmedRow['Angkatan'] || trimmedRow['angkatan'],
              role: 'siswa',
            };
          }
        }).filter(r => r.nomor_induk && r.name); // Require at least NI and Name
        
        console.log('Formatted data:', formattedData.length, 'valid rows')
        
        if (formattedData.length === 0) {
          toast.error('Tidak ada data valid ditemukan. Pastikan kolom "Nomor Induk" dan "Nama" ada.')
          return
        }
        
        setPreviewData(formattedData)
        
        // Determine data type for message
        const hasGuru = formattedData.some(r => r.role === 'guru');
        setDataType(hasGuru ? 'guru' : 'siswa')
        
        const message = hasGuru 
          ? `Berhasil membaca ${formattedData.length} data (guru/pembina)`
          : `Berhasil membaca ${formattedData.length} data siswa`;
        toast.success(message)
      } catch (err) {
        console.error('Error parsing file:', err)
        toast.error("Gagal membaca file Excel/CSV. Pastikan format benar.")
      }
    }
    reader.onerror = (err) => {
      console.error('FileReader error:', err)
      toast.error("Gagal membaca file")
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Tidak ada data untuk diimport')
      return
    }
    
    setIsImporting(true)
    
    try {
      console.log('Starting import with', previewData.length, 'items')
      console.log('Sample data:', previewData[0])
      
      const res = await fetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
      })
      
      console.log('Import response status:', res.status)
      
      const data = await res.json()
      console.log('Import response data:', data)
      
      if (!res.ok) {
        throw new Error(data.message || 'Gagal melakukan import')
      }
      
      toast.success(data.message || 'Import berhasil')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Import error:', err)
      toast.error(err.message || "Terjadi kesalahan saat import data")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Unggah file Excel (.xlsx) atau CSV. 
            <br/><br/>
            <strong>Untuk Siswa:</strong> Kolom yang dibutuhkan: <strong>Nomor Induk</strong> dan <strong>Nama</strong>. Opsional: <strong>Kelas</strong> dan <strong>Angkatan</strong>.
            <br/><br/>
            <strong>Untuk Guru/Pembina:</strong> Kolom yang dibutuhkan: <strong>Nomor Induk</strong>, <strong>Nama</strong>, dan <strong>Role</strong> (isi dengan "guru"). Opsional: <strong>Wali Kelas</strong> (isi dengan nama kelas atau "-" jika tidak merangkap).
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            disabled={isImporting}
          />
          
          {previewData.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Preview Data ({previewData.length} baris)</h4>
              <DataTable
                pageSize={5}
                data={previewData}
                columns={dataType === 'guru' ? [
                  { header: "Nomor Induk", accessorKey: "nomor_induk" },
                  { header: "Nama", accessorKey: "name" },
                  { header: "Role", accessorKey: "role" },
                  { header: "Wali Kelas", accessorKey: "wali_kelas" },
                ] : [
                  { header: "Nomor Induk", accessorKey: "nomor_induk" },
                  { header: "Nama", accessorKey: "name" },
                  { header: "Kelas", accessorKey: "kelas" },
                  { header: "Angkatan", accessorKey: "angkatan" },
                ]}
              />
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting}
                  className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]"
                >
                  {isImporting ? 'Mengimport...' : 'Mulai Import'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
