"use client"

import Image from "next/image";
import { useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/ui/Text/text";
import { cn } from "@/lib/utils";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";



 
export function TableInformation({ data, columnsSchema, columnWidths = [], className = '' }: {data: Record<string, any>[], columnsSchema: ColumnDef<any, any>[], columnWidths?: string[], className?: string}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns: columnsSchema,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const getColumnWidth = (index: number) => {
    const width = columnWidths[index] || "auto"
    return typeof width === "number" ? `${width}px` : width
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <Text variant="tiny">No data</Text>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <Table className={cn("w-full min-w-max", className)}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b-neutral-800 !border-b-2 hover:bg-transparent"
            >
              {headerGroup.headers.map((header, index) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="text-xs px-0 cursor-pointer text-white hover:text-white/70"
                  style={{ width: getColumnWidth(index) }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: (
                      <Image
                        className="ml-2 inline-flex text-white rotate-180"
                        src="/icons/arrow.svg"
                        width={9}
                        height={6}
                        alt=""
                      />
                    ),
                    desc: (
                      <Image
                        className="ml-2 inline-flex text-white"
                        src="/icons/arrow.svg"
                        width={9}
                        height={6}
                        alt=""
                      />
                    ),
                  }[header.column.getIsSorted() as string] ?? null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="hover:bg-neutral-800 border-b-neutral-800"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="text-xs px-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
