"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { useState, useRef, useEffect } from "react"

// Define a type for the keys we can update
type UpdatableTransactionFields = keyof Pick<TransactionRow, 
  'reference' | 'valueDate' | 'payerName' | 'payerAccount' | 'amount' | 
  'currency' | 'receiverBIC' | 'beneficiaryAccount' | 'beneficiaryName' | 
  'remittanceInformation' | 'detailsOfCharges'>

interface DataTableProps {
  data: TransactionRow[]
  onUpdateRow: (id: string, field: UpdatableTransactionFields, value: string) => void
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  rowId: string
  field: UpdatableTransactionFields
}

interface PopupEditorState {
  visible: boolean
  rowId: string
  field: UpdatableTransactionFields
  value: string
  originalValue: string
}

export function DataTable({ data, onUpdateRow }: DataTableProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    rowId: "",
    field: "reference",
  })

  const [popupEditor, setPopupEditor] = useState<PopupEditorState>({
    visible: false,
    rowId: "",
    field: "reference",
    value: "",
    originalValue: "",
  })

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }))
    }

    if (contextMenu.visible) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu.visible])

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && popupEditor.visible) {
        handleCancelEdit()
      }
    }

    if (popupEditor.visible) {
      document.addEventListener("keydown", handleEscapeKey)
      return () => document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [popupEditor.visible])

  const handleContextMenu = (e: React.MouseEvent, rowId: string, field: UpdatableTransactionFields) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      rowId,
      field,
    })
  }

  const handleEdit = () => {
    const row = data.find((r) => r.id === contextMenu.rowId)
    if (row) {
      const currentValue = String(row[contextMenu.field] || "")
      setPopupEditor({
        visible: true,
        rowId: contextMenu.rowId,
        field: contextMenu.field,
        value: currentValue,
        originalValue: currentValue,
      })
    }
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  const handleSaveEdit = () => {
    onUpdateRow(popupEditor.rowId, popupEditor.field, popupEditor.value)
    setPopupEditor((prev) => ({ ...prev, visible: false }))
  }

  const handleCancelEdit = () => {
    setPopupEditor((prev) => ({ ...prev, visible: false }))
  }

  const getFieldLabel = (field: UpdatableTransactionFields): string => {
    const labels: Record<UpdatableTransactionFields, string> = {
      reference: "Reference",
      valueDate: "Value Date",
      payerName: "Payer Name",
      payerAccount: "Payer Account",
      amount: "Amount",
      currency: "Currency",
      receiverBIC: "Receiver BIC",
      beneficiaryAccount: "Beneficiary Account",
      beneficiaryName: "Beneficiary Name",
      remittanceInformation: "Remittance Information",
      detailsOfCharges: "Details of Charges",
    }
    return labels[field] || field
  }

  return (
    <div className="overflow-auto border-2 rounded-lg relative h-[600px] w-full">
      <table className="w-full text-lg table-auto">
        <thead className="bg-gray-100 sticky top-0 z-10 border-b-2">
          <tr>
            <th className="p-6 text-left border-r-2 font-semibold w-1/12 text-lg">Reference</th>
            <th className="p-6 text-left border-r-2 font-semibold w-1/12 text-lg">Value Date</th>
            <th className="p-6 text-left border-r-2 font-semibold w-2/12 text-lg">Payer Name</th>
            <th className="p-6 text-left border-r-2 font-semibold w-2/12 text-lg">Payer Account</th>
            <th className="p-6 text-left border-r-2 font-semibold w-1/12 text-lg">Amount</th>
            <th className="p-6 text-left border-r-2 font-semibold w-1/12 text-lg">Currency</th>
            <th className="p-6 text-left border-r-2 font-semibold w-2/12 text-lg">Receiver BIC</th>
            <th className="p-6 text-left border-r-2 font-semibold w-2/12 text-lg">Beneficiary Name</th>
            <th className="p-6 text-left border-r-2 font-semibold w-2/12 text-lg">Beneficiary Account</th>
            <th className="p-6 text-left border-r-2 font-semibold w-2/12 text-lg">Remittance Info</th>
            <th className="p-6 text-left font-semibold w-1/12 text-lg">Charges</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id}
              className={`border-t-2 ${row.isDuplicate ? "bg-yellow-100 border-yellow-200" : row.validationError ? "bg-red-100 border-red-200" : index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
            >
              <td className="p-6 border-r-2">
                <div className="flex items-center gap-1">
                  <Input
                    ref={(el) => { inputRefs.current[`${row.id}-reference`] = el }}
                    value={row.reference}
                    onChange={(e) => onUpdateRow(row.id, "reference", e.target.value)}
                    onContextMenu={(e) => handleContextMenu(e, row.id, "reference")}
                    className="text-lg h-12 w-full font-medium"
                    readOnly
                  />
                </div>
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-valueDate`] = el }}
                  value={row.valueDate}
                  onChange={(e) => onUpdateRow(row.id, "valueDate", e.target.value)}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "valueDate")}
                  className="text-lg h-12 w-full font-medium"
                  readOnly
                />
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-payerName`] = el }}
                  value={row.payerName}
                  onChange={(e) => onUpdateRow(row.id, "payerName", e.target.value)}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "payerName")}
                  className="text-lg h-12 w-full font-medium"
                />
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-payerAccount`] = el }}
                  value={row.payerAccount}
                  onChange={(e) => onUpdateRow(row.id, "payerAccount", e.target.value)}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "payerAccount")}
                  className="text-lg h-12 w-full font-medium"
                />
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-amount`] = el }}
                  type="number"
                  value={row.amount}
                  onChange={(e) => onUpdateRow(row.id, "amount", e.target.value)}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "amount")}
                  className="text-lg h-12 w-full font-medium"
                />
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-currency`] = el }}
                  value={row.currency}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "currency")}
                  className="text-lg h-12 w-full bg-gray-100 font-medium"
                  readOnly
                />
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-receiverBIC`] = el }}
                  value={row.receiverBIC}
                  onChange={(e) => onUpdateRow(row.id, "receiverBIC", e.target.value)}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "receiverBIC")}
                  className="text-lg h-12 w-full font-medium"
                />
              </td>
              <td className="p-6 border-r-2">
                <div className="relative">
                  <Input
                    ref={(el) => { inputRefs.current[`${row.id}-beneficiaryName`] = el }}
                    value={row.beneficiaryName}
                    onChange={(e) => onUpdateRow(row.id, "beneficiaryName", e.target.value)}
                    onContextMenu={(e) => handleContextMenu(e, row.id, "beneficiaryName")}
                    className={`text-lg h-12 w-full font-medium ${row.beneficiaryName.length > 32 ? "border-red-500 bg-red-50" : ""}`}
                    maxLength={32}
                  />
                  {row.beneficiaryName.length > 30 && (
                    <span className="text-sm text-gray-600 absolute -bottom-6 right-0 font-medium">
                      {row.beneficiaryName.length}/32
                    </span>
                  )}
                </div>
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-beneficiaryAccount`] = el }}
                  value={row.beneficiaryAccount}
                  onChange={(e) => onUpdateRow(row.id, "beneficiaryAccount", e.target.value)}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "beneficiaryAccount")}
                  className="text-lg h-12 w-full font-medium"
                />
              </td>
              <td className="p-6 border-r-2">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-remittanceInformation`] = el }}
                  value={row.remittanceInformation}
                  onChange={(e) => onUpdateRow(row.id, "remittanceInformation", e.target.value)}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "remittanceInformation")}
                  className="text-lg h-12 w-full font-medium"
                />
              </td>
              <td className="p-6">
                <Input
                  ref={(el) => { inputRefs.current[`${row.id}-detailsOfCharges`] = el }}
                  value={row.detailsOfCharges}
                  onContextMenu={(e) => handleContextMenu(e, row.id, "detailsOfCharges")}
                  className="text-lg h-12 w-full bg-gray-100 font-medium"
                  readOnly
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 w-full text-left"
          >
            <span className="w-4 h-4">✏️</span>
            Edit
          </button>
        </div>
      )}

      {popupEditor.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit {getFieldLabel(popupEditor.field)}</h3>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-8 w-8 p-0">
                <span className="w-4 h-4">×</span>
              </Button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{getFieldLabel(popupEditor.field)}</label>
              {popupEditor.field === "remittanceInformation" || popupEditor.value.length > 50 ? (
                <Textarea
                  value={popupEditor.value}
                  onChange={(e) => setPopupEditor((prev) => ({ ...prev, value: e.target.value }))}
                  className="w-full min-h-[100px]"
                  placeholder={`Enter ${getFieldLabel(popupEditor.field).toLowerCase()}...`}
                  autoFocus
                />
              ) : (
                <Input
                  value={popupEditor.value}
                  onChange={(e) => setPopupEditor((prev) => ({ ...prev, value: e.target.value }))}
                  className="w-full"
                  placeholder={`Enter ${getFieldLabel(popupEditor.field).toLowerCase()}...`}
                  autoFocus
                />
              )}
              {popupEditor.field === "beneficiaryName" && (
                <div className="text-xs text-gray-500 mt-1">{popupEditor.value.length}/32 characters</div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelEdit} className="px-4 bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="px-4"
                disabled={popupEditor.field === "beneficiaryName" && popupEditor.value.length > 32}
              >
                <span className="w-4 h-4 mr-2">💾</span>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {data.some((row) => row.validationError) && (
        <div className="p-6 bg-red-100 border-t-2 border-red-200">
          <div className="flex items-center gap-2 text-red-900 mb-3">
            <span className="w-5 h-5 text-lg">⚠️</span>
            <span className="font-semibold text-lg">Validation Errors:</span>
          </div>
          {data
            .filter((row) => row.validationError)
            .map((row, index) => (
              <div key={row.id} className="text-base text-red-800 font-medium py-1">
                Row {data.indexOf(row) + 1}: {row.validationError}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}