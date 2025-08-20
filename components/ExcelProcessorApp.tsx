"use client"

import { useState } from "react"
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react"
import { FileUploader } from "@/components/file-uploader"
import { DataProcessor } from "@/components/data-processor"
import { ExportManager } from "@/components/export-manager"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TransactionRow } from "@/lib/types"

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

  const steps = [
    { id: "upload", labelEn: "Upload Files", labelAr: "رفع الملفات", icon: Upload },
    { id: "process", labelEn: "Process Data", labelAr: "معالجة البيانات", icon: FileSpreadsheet },
    { id: "export", labelEn: "Export Results", labelAr: "تصدير النتائج", icon: Download },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">معالج بيانات المعاملات المالية</h1>
          <p className="text-lg text-gray-600">Financial Transaction Data Processor</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Tracker */}
        <div className="flex justify-center mb-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {steps.map(({ id, labelEn, labelAr, icon: Icon }, index) => {
              const isActive = step === id
              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-sm transition-colors duration-200 ${
                    isActive ? "bg-blue-600 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex flex-col text-sm text-center">
                    <span className="font-semibold">{`${index + 1}. ${labelEn}`}</span>
                    <span className="text-xs opacity-80">{labelAr}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Views */}
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
