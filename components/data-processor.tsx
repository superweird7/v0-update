"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/data-table"
import { validateBICAccount, processMultipleExcelFiles, findDuplicates, normalizeName } from "@/lib/excel-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define TransactionRow interface locally to avoid import issues
interface TransactionRow {
  id: string
  reference: string
  valueDate: string
  payerName: string
  payerAccount: string
  amount: string
  currency: string
  receiverBIC: string
  beneficiaryAccount: string
  beneficiaryName: string
  remittanceInformation: string
  detailsOfCharges: string
  validationError?: string
  isDuplicate?: boolean
}

// Define a type for the keys we can update
type UpdatableTransactionFields = keyof Pick<TransactionRow, 
  'reference' | 'valueDate' | 'payerName' | 'payerAccount' | 'amount' | 
  'currency' | 'receiverBIC' | 'beneficiaryAccount' | 'beneficiaryName' | 
  'remittanceInformation' | 'detailsOfCharges'>

interface DataProcessorProps {
  templateFile: File
  dataFiles: File[]
  onDataProcessed: (data: TransactionRow[]) => void
  onBack: () => void
  onError: (error: string) => void
}

export function DataProcessor({ templateFile, dataFiles, onDataProcessed, onBack, onError }: DataProcessorProps) {
  const [data, setData] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [globalPayerAccount, setGlobalPayerAccount] = useState("")
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)
  const [showDuplicateContent, setShowDuplicateContent] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [templateFile, dataFiles])

  const loadData = async () => {
    try {
      setLoading(true)
      const processedData = await processMultipleExcelFiles(dataFiles)
      setData(processedData)
      onError("")
    } catch (error) {
      onError(`Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const updateRow = (id: string, field: UpdatableTransactionFields, value: string) => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value }

          const validationErrors: string[] = []
          const normalizedName = normalizeName(updatedRow.beneficiaryName)

          // Validate BIC/Account matching
          const bicValidationError = validateBICAccount(updatedRow.receiverBIC, updatedRow.beneficiaryAccount)
          if (bicValidationError) {
            validationErrors.push(bicValidationError)
          }

          // Validate beneficiary name length
          if (normalizedName.length > 32) {
            validationErrors.push("Beneficiary name exceeds 32 characters")
          }

          // Set validation error (combine all errors or clear if none)
          updatedRow.validationError = validationErrors.length > 0 ? validationErrors.join("; ") : ""

          return updatedRow
        }
        return row
      }),
    )
  }

  const applyGlobalPayerAccount = () => {
    if (!globalPayerAccount.trim()) return

    setData((prevData) =>
      prevData.map((row) => ({
        ...row,
        payerAccount: globalPayerAccount,
      })),
    )
  }

  const trimAllNames = () => {
    setData((prevData) =>
      prevData.map((row) => {
        const trimmedName = normalizeName(row.beneficiaryName).substring(0, 32)
        const updatedRow = { ...row, beneficiaryName: trimmedName }

        // Re-validate the row after trimming
        const validationErrors: string[] = []

        // Validate BIC/Account matching
        const bicValidationError = validateBICAccount(updatedRow.receiverBIC, updatedRow.beneficiaryAccount)
        if (bicValidationError) {
          validationErrors.push(bicValidationError)
        }

        // Validate beneficiary name length (should pass now after trimming)
        if (normalizeName(updatedRow.beneficiaryName).length > 32) {
          validationErrors.push("Beneficiary name exceeds 32 characters")
        }

        // Set validation error (combine all errors or clear if none)
        updatedRow.validationError = validationErrors.length > 0 ? validationErrors.join("; ") : ""

        return updatedRow
      }),
    )
  }

  const handleCheckDuplicates = () => {
    setCheckingDuplicates(true)
    setTimeout(() => {
      const updatedData = findDuplicates(data)
      setData(updatedData)
      setCheckingDuplicates(false)
    }, 500)
  }

  const handleRemoveDuplicates = () => {
    const uniqueData = data.filter((row) => !row.isDuplicate)
    setData(uniqueData)
  }

  const hasValidationErrors = data.some((row) => row.validationError)
  const validationErrorCount = data.filter((row) => row.validationError).length
  const validationErrorDetails = data
    .filter((row) => row.validationError)
    .map((row, index) => `Row ${index + 1}: ${row.validationError}`)

  const duplicateCount = data.filter((row) => row.isDuplicate).length
  
  const hasErrorsOrDuplicates = hasValidationErrors || duplicateCount > 0

  const handleProceed = () => {
    if (hasErrorsOrDuplicates) {
      onError("Please fix all validation errors and duplicates before proceeding")
      return
    }
    onDataProcessed(data)
  }

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Processing Excel file...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data Processing Interface</span>
            <div className="flex items-center gap-2">
              {hasValidationErrors && (
                <Button
                  variant="outline"
                  onClick={() => setShowValidationErrors(!showValidationErrors)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  ⚠️ {validationErrorCount} Error{validationErrorCount !== 1 ? "s" : ""}
                </Button>
              )}
              {duplicateCount > 0 && (
                <Dialog open={showDuplicateContent} onOpenChange={setShowDuplicateContent}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">
                      ⚠️ {duplicateCount} Duplicate{duplicateCount !== 1 ? "s" : ""}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-6">
                    <DialogHeader>
                      <DialogTitle>Duplicate Content Report</DialogTitle>
                      <DialogDescription>
                        Found {duplicateCount} duplicate entries.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[500px] mt-4 p-4 border rounded-lg bg-gray-50">
                      {data
                        .filter((row) => row.isDuplicate)
                        .map((row, index) => (
                          <div key={index} className="mb-4 p-3 border rounded-md bg-white shadow-sm">
                            <div className="font-semibold text-lg">{`Duplicate Entry ${index + 1}`}</div>
                            <div className="mt-2 text-sm space-y-1">
                              <div><span className="font-medium">Payer Name:</span> {row.payerName}</div>
                              <div><span className="font-medium">Payer Account:</span> {row.payerAccount}</div>
                              <div><span className="font-medium">Amount:</span> {row.amount}</div>
                              <div><span className="font-medium">Beneficiary Account:</span> {row.beneficiaryAccount}</div>
                            </div>
                          </div>
                        ))}
                    </ScrollArea>
                    <DialogClose asChild>
                      <Button className="mt-4">Close</Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" onClick={onBack}>
                ← Back to Upload
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showValidationErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium">Validation Errors ({validationErrorCount})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValidationErrors(false)}
                  className="text-red-600 hover:bg-red-100"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-1 text-sm text-red-700">
                {validationErrorDetails.map((error, index) => (
                  <div key={index} className="font-mono">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {duplicateCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-yellow-800">
                <span className="text-lg">⚠️</span>
                <span className="font-medium">Duplicate Rows Found ({duplicateCount})</span>
              </div>
              <div className="flex space-x-2">
                <Dialog open={showDuplicateContent} onOpenChange={setShowDuplicateContent}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-100">
                      Show Duplicate Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-6">
                    <DialogHeader>
                      <DialogTitle>Duplicate Content Report</DialogTitle>
                      <DialogDescription>
                        Found {duplicateCount} duplicate entries.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[500px] mt-4 p-4 border rounded-lg bg-gray-50">
                      {data
                        .filter((row) => row.isDuplicate)
                        .map((row, index) => (
                          <div key={index} className="mb-4 p-3 border rounded-md bg-white shadow-sm">
                            <div className="font-semibold text-lg">{`Duplicate Entry ${index + 1}`}</div>
                            <div className="mt-2 text-sm space-y-1">
                              <div><span className="font-medium">Payer Name:</span> {row.payerName}</div>
                              <div><span className="font-medium">Payer Account:</span> {row.payerAccount}</div>
                              <div><span className="font-medium">Amount:</span> {row.amount}</div>
                              <div><span className="font-medium">Beneficiary Account:</span> {row.beneficiaryAccount}</div>
                            </div>
                          </div>
                        ))}
                    </ScrollArea>
                    <DialogClose asChild>
                      <Button className="mt-4">Close</Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={handleRemoveDuplicates}>
                  Remove Duplicates
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="globalPayerAccount">Global Payer Account</Label>
              <div className="flex gap-2">
                <Input
                  id="globalPayerAccount"
                  value={globalPayerAccount}
                  onChange={(e) => setGlobalPayerAccount(e.target.value)}
                  placeholder="Enter payer account to apply to all rows"
                />
                <Button onClick={applyGlobalPayerAccount} size="sm">
                  ← Apply All
                </Button>
              </div>
            </div>
          </div>
          
          {/* Search Input and Button */}
          <div className="flex items-end gap-2">
            <div className="w-full">
              <Label htmlFor="search-input">Search Table</Label>
              <Input
                id="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all columns..."
                className="w-full"
              />
            </div>
            <Button onClick={() => setSearchQuery("")} className="w-fit">
              Clear
            </Button>
          </div>
          
          <div className="flex justify-center mb-6 space-x-4">
            <Button onClick={trimAllNames} variant="outline" className="px-6 bg-transparent">
              ✂️ Trim All Names to 32 Characters
            </Button>
            <Button onClick={handleCheckDuplicates} disabled={checkingDuplicates} className="px-6">
              {checkingDuplicates ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                "🔎"
              )}
              Check Duplicates
            </Button>
          </div>

          {hasValidationErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-lg">⚠️</span>
                <span className="font-medium">Validation Errors Found</span>
              </div>
              <p className="text-red-700 mt-1">Please fix the highlighted errors before proceeding to export.</p>
            </div>
          )}

          <DataTable data={filteredData} onUpdateRow={updateRow} />

          <div className="flex justify-end mt-6">
            <Button onClick={handleProceed} disabled={hasErrorsOrDuplicates} className="px-8">
              💾 Proceed to Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}