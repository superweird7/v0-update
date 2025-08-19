"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TransactionRow } from "@/app/page"
import { groupByBank, exportToExcel } from "@/lib/excel-utils"

interface ExportManagerProps {
  data: TransactionRow[]
  onBack: () => void
  onError: (error: string) => void
}

export function ExportManager({ data, onBack, onError }: ExportManagerProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const bankGroups = groupByBank(data)

  const handleExport = async (bankName: string, bankData: TransactionRow[]) => {
    try {
      setExporting(bankName)
      await exportToExcel(bankName, bankData)
      onError("")
    } catch (error) {
      onError(`Failed to export ${bankName}: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setExporting(null)
    }
  }

  const handleExportAll = async () => {
    try {
      setExporting("all")
      for (const [bankName, bankData] of Object.entries(bankGroups)) {
        await exportToExcel(bankName, bankData)
      }
      onError("")
    } catch (error) {
      onError(`Failed to export files: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Export Manager - Bank Groups</span>
            <Button variant="outline" onClick={onBack}>
              ← Back to Processing
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Export Summary</h3>
                <p className="text-gray-600">
                  Total Records: {data.length} | Banks: {Object.keys(bankGroups).length}
                </p>
              </div>
              <Button onClick={handleExportAll} disabled={exporting !== null} className="px-6">
                {exporting === "all" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  "📥 "
                )}
                Export All Banks
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {Object.entries(bankGroups).map(([bankName, bankData]) => (
              <Card key={bankName} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                        🏦
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{bankName}</h4>
                        <p className="text-gray-600">{bankData.length} transactions</p>
                        <div className="text-sm text-gray-500 mt-1">
                          BIC Codes: {Array.from(new Set(bankData.map((row) => row.receiverBIC))).join(", ")}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExport(bankName, bankData)}
                      disabled={exporting !== null}
                      variant="outline"
                    >
                      {exporting === bankName ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      ) : (
                        "📥 "
                      )}
                      Export {bankName}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {Object.keys(bankGroups).length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Bank Groups Found</h3>
              <p className="text-gray-500">
                No valid BIC codes were found in the data. Please check the Receiver BIC field values.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
