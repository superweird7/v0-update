"use client"

import { useState } from "react"
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react"
import { FileUploader } from "@/components/file-uploader"
import { DataProcessor } from "@/components/data-processor"
import { ExportManager } from "@/components/export-manager"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface TransactionRow {
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

export default function ExcelProcessorApp() {
  const [step, setStep] = useState<"upload" | "process" | "export">("upload")
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [dataFiles, setDataFiles] = useState<File[]>([])
  const [processedData, setProcessedData] = useState<TransactionRow[]>([])
  const [error, setError] = useState<string>("")

  const handleFilesUploaded = (template: File, files: File[]) => {
    setTemplateFile(template)
    setDataFiles(files)
    setStep("process")
    setError("")
  }

  const handleDataProcessed = (data: TransactionRow[]) => {
    setProcessedData(data)
    setStep("export")
  }

  const handleBackToUpload = () => {
    setStep("upload")
    setTemplateFile(null)
    setDataFiles([])
    setProcessedData([])
    setError("")
  }

  const handleBackToProcess = () => {
    setStep("process")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">معالج بيانات المعاملات المالية</h1>
          <p className="text-lg text-gray-600">Financial Transaction Data Processor</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                step === "upload" ? "bg-blue-600 text-white" : "bg-white text-gray-600"
              }`}
            >
              <Upload className="w-5 h-5" />
              <span>1. Upload Files</span>
            </div>
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                step === "process" ? "bg-blue-600 text-white" : "bg-white text-gray-600"
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>2. Process Data</span>
            </div>
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                step === "export" ? "bg-blue-600 text-white" : "bg-white text-gray-600"
              }`}
            >
              <Download className="w-5 h-5" />
              <span>3. Export Results</span>
            </div>
          </div>
        </div>

        {step === "upload" && <FileUploader onFilesUploaded={handleFilesUploaded} onError={setError} />}

        {step === "process" && templateFile && dataFiles.length > 0 && (
          <DataProcessor
            templateFile={templateFile}
            dataFiles={dataFiles}
            onDataProcessed={handleDataProcessed}
            onBack={handleBackToUpload}
            onError={setError}
          />
        )}

        {step === "export" && processedData.length > 0 && (
          <ExportManager data={processedData} onBack={handleBackToProcess} onError={setError} />
        )}
      </div>
    </div>
  )
}