"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, CheckCircle, X, Plus } from "lucide-react"

interface FileUploaderProps {
  onFilesUploaded: (templateFile: File, dataFiles: File[]) => void
  onError: (error: string) => void
}

export function FileUploader({ onFilesUploaded, onError }: FileUploaderProps) {
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [dataFiles, setDataFiles] = useState<File[]>([])
  const templateInputRef = useRef<HTMLInputElement>(null)
  const dataInputRef = useRef<HTMLInputElement>(null)

  const validateExcelFile = (file: File): boolean => {
    const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]
    return validTypes.includes(file.type) || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
  }

  const handleTemplateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!validateExcelFile(file)) {
        onError("Please select a valid Excel file (.xlsx or .xls)")
        return
      }
      setTemplateFile(file)
      onError("")
    }
  }

  const handleDataFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      const invalidFiles = files.filter((file) => !validateExcelFile(file))
      if (invalidFiles.length > 0) {
        onError("Please select only valid Excel files (.xlsx or .xls)")
        return
      }
      setDataFiles((prev) => [...prev, ...files])
      onError("")
      // Reset input value to allow selecting the same file again
      if (dataInputRef.current) {
        dataInputRef.current.value = ""
      }
    }
  }

  const removeDataFile = (index: number) => {
    setDataFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProceed = () => {
    if (!templateFile || dataFiles.length === 0) {
      onError("Please select a template file and at least one data file")
      return
    }
    onFilesUploaded(templateFile, dataFiles)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Master Template File
          </CardTitle>
          <CardDescription>
            Upload the master Excel template file (format.xlsx) with the required column structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-32 border-2 border-dashed bg-transparent"
              onClick={() => templateInputRef.current?.click()}
            >
              <div className="text-center">
                {templateFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium">{templateFile.name}</p>
                      <p className="text-sm text-gray-500">{(templateFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Click to upload template file</p>
                    <p className="text-sm text-gray-500">Excel files only</p>
                  </div>
                )}
              </div>
            </Button>
            <input
              ref={templateInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleTemplateFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Data Files for Combining ({dataFiles.length})
          </CardTitle>
          <CardDescription>Upload multiple Excel files to combine into a master file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-20 border-2 border-dashed bg-transparent"
              onClick={() => dataInputRef.current?.click()}
            >
              <div className="text-center">
                <Plus className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <p>Add Data Files</p>
                <p className="text-sm text-gray-500">Excel files only</p>
              </div>
            </Button>

            {dataFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {dataFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDataFile(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={dataInputRef}
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleDataFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2 flex justify-center">
        <Button
          onClick={handleProceed}
          disabled={!templateFile || dataFiles.length === 0}
          className="px-8 py-3 text-lg"
        >
          Combine Files & Process Data
        </Button>
      </div>
    </div>
  )
}
