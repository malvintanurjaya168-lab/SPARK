'use client';

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

interface DataTableProps<TData> {
  columns: {
    header: string;
    accessorKey?: keyof TData;
    cell?: (item: TData, rowIndex?: number) => React.ReactNode;
    className?: string;
  }[];
  data: TData[];
  pageSize?: number;
  emptyMessage?: string;
  expandable?: boolean;
  renderExpandedContent?: (item: TData) => React.ReactNode;
  onRowExpand?: (item: TData, rowIndex: number) => void;
}

export function DataTable<TData>({ 
  columns, 
  data, 
  pageSize = 10,
  emptyMessage = "Tidak ada data.",
  expandable = false,
  renderExpandedContent,
  onRowExpand
}: DataTableProps<TData>) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [expandedRow, setExpandedRow] = React.useState<number | null>(null)
  
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = data.slice(startIndex, startIndex + pageSize)

  const toggleExpand = (rowIndex: number) => {
    const newExpandedRow = expandedRow === rowIndex ? null : rowIndex
    setExpandedRow(newExpandedRow)
    if (onRowExpand && newExpandedRow !== null) {
      onRowExpand(paginatedData[rowIndex], rowIndex)
    }
  }

  const tableColumns = expandable 
    ? [{ 
        header: '', 
        cell: (_: any, rowIndex: number) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleExpand(rowIndex)}
            className="h-8 w-8 p-0"
          >
            {expandedRow === rowIndex ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        ),
        className: 'w-10'
      } as any, ...columns]
    : columns

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {tableColumns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length ? (
              paginatedData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow>
                    {tableColumns.map((column, colIndex) => (
                      <TableCell key={colIndex} className={column.className}>
                        {column.cell 
                          ? column.cell(row, rowIndex) 
                          : column.accessorKey 
                            ? String((row as any)[column.accessorKey]) 
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandable && expandedRow === rowIndex && renderExpandedContent && (
                    <TableRow>
                      <TableCell colSpan={tableColumns.length} className="p-4 bg-slate-50/50">
                        {renderExpandedContent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + pageSize, data.length)} dari {data.length} data
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Sebelumnya</span>
            </Button>
            <div className="text-sm font-medium">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Selanjutnya</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
