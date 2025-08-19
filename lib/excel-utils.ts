import * as XLSX from "xlsx"
import type { TransactionRow } from "@/app/page"

// Bank mapping with Arabic names and BIC codes
export const BANK_MAPPING: Record<string, string[]> = {
  "اسيا الاسلامي": ["UCFXIQBA005"],
  "الطيف الاسلامي": ["AINIIQBA001", "AINIIQBA017"],
  "الشرق الاوسط": ["IMEBIQBA781"],
  "العراقي الاسلامي": ["IRIBIQBA724"],
  الراجح: ["RJHBIQBA731"],
  الرشيد: ["RDBAIQB1046"],
  الرافدين: ["RAFBIQB1098"],
  التنمية: ["IDBQIQBA001", "IDBQIQBA011", "IDBQIQBA010", "IDBQIQBA013", "IDBQIQBA021", "IDBQIQBA022"],
  "الأهلي العراقي": ["NBIQIQBA850", "NBIQIQBA853", "NBIQIQBA863", "NBIQIQBA859", "NBIQIQBA864", "NBIQIQBA865"],
  النهرين: ["NIBIIQBA001"],
  الزراعي: ["AGRIIQBA721"],
  اشور: ["AIBIIQBA994", "AIBIIQBA988", "AIBIIQBA995"],
  "التجارة العراقي": [
    "TRIQIQBA979",
    "TRIQIQBA976",
    "TRIQIQBA982",
    "TRIQIQBA983",
    "TRIQIQBA991",
    "TRIQIQBA986",
    "TRIQIQBA995",
    "TRIQIQBA993",
    "TRIQIQBA997",
  ],
}

// Arabic month names
const ARABIC_MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
]

export function generateReference(): string {
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

export function getCurrentDateFormatted(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}${month}${day}`
}

export function validateBICAccount(receiverBIC: string, beneficiaryAccount: string): string | undefined {
  if (!receiverBIC || !beneficiaryAccount) return undefined

  if (receiverBIC.length < 8) {
    return "Receiver BIC must be at least 8 characters"
  }

  let bicCode: string
  if (receiverBIC.length === 8) {
    // For 8-character BIC codes, extract first 4 characters and last 3 characters
    bicCode = receiverBIC.substring(0, 4) + receiverBIC.substring(5, 8)
  } else if (receiverBIC.length >= 11) {
    if (receiverBIC.startsWith("RAFB")) {
      // For RAFB, extract the bank code from beneficiary account instead of BIC
      // This handles cases where BIC and account have different suffixes
      const bankCodeMatch = beneficiaryAccount.match(/RAFB\d{3}/)
      if (bankCodeMatch) {
        bicCode = bankCodeMatch[0]
        // Always return undefined (valid) for RAFB if we find the pattern
        return undefined
      } else {
        bicCode = receiverBIC.substring(0, 4) + receiverBIC.substring(8, 11)
      }
    } else {
      bicCode = receiverBIC.substring(0, 4) + receiverBIC.substring(8, 11)
    }
  } else if (receiverBIC.length >= 10) {
    // For 10-character BIC codes, extract chars 0-3 and 6-9
    bicCode = receiverBIC.substring(0, 4) + receiverBIC.substring(6, 9)
  } else {
    // For 9-character BIC codes, extract chars 0-3 and 5-8
    bicCode = receiverBIC.substring(0, 4) + receiverBIC.substring(5, 8)
  }

  // Check if the extracted BIC code appears in the beneficiary account
  if (!beneficiaryAccount.toUpperCase().includes(bicCode.toUpperCase())) {
    return `BIC code "${bicCode}" not found in beneficiary account`
  }

  return undefined
}

// Helper function to normalize names
export function normalizeName(name: string): string {
  // Use a regular expression to remove non-printable characters and replace multiple spaces with a single space
  return name.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim()
}

const isFuzzyMatch = (name1: string, name2: string): boolean => {
  const normalizedName1 = normalizeName(name1)
  const normalizedName2 = normalizeName(name2)

  const words1 = normalizedName1.split(/\s+/).filter(Boolean)
  const words2 = normalizedName2.split(/\s+/).filter(Boolean)

  if (words1.length === 0 || words2.length === 0) {
    return false
  }

  const normalizedWords1 = new Set(words1.map((word) => word.toLowerCase()))
  const normalizedWords2 = new Set(words2.map((word) => word.toLowerCase()))

  // Check if all words from the shorter name are present in the longer name
  if (normalizedWords1.size <= normalizedWords2.size) {
    return Array.from(normalizedWords1).every((word) => normalizedWords2.has(word))
  } else {
    return Array.from(normalizedWords2).every((word) => normalizedWords1.has(word))
  }
}

export function findDuplicates(data: TransactionRow[]): TransactionRow[] {
  const duplicatesMap = new Map<string, number[]>()
  const duplicates = new Set<string>()

  data.forEach((row, index) => {
    // Use a simplified key for initial grouping before fuzzy name matching
    const key = `${row.payerAccount}-${row.amount}-${row.beneficiaryAccount}`
    if (!duplicatesMap.has(key)) {
      duplicatesMap.set(key, [])
    }
    duplicatesMap.get(key)?.push(index)
  })

  // Iterate through groups to find duplicates based on fuzzy name matching
  duplicatesMap.forEach((indices) => {
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        const row1 = data[indices[i]]
        const row2 = data[indices[j]]
        if (
          isFuzzyMatch(row1.payerName, row2.payerName) ||
          isFuzzyMatch(row1.beneficiaryName, row2.beneficiaryName)
        ) {
          duplicates.add(row1.id)
          duplicates.add(row2.id)
        }
      }
    }
  })

  return data.map((row) => ({
    ...row,
    isDuplicate: duplicates.has(row.id),
  }))
}

export function findDuplicateDetails(data: TransactionRow[]): string[] {
  const duplicatesMap = new Map<string, number[]>()
  const originalIndices = data.map((row) => row.id)
  
  data.forEach((row, index) => {
    if (row.isDuplicate) {
      const key = `${row.payerName}-${row.payerAccount}-${row.amount}-${row.beneficiaryAccount}`
      if (!duplicatesMap.has(key)) {
        duplicatesMap.set(key, [])
      }
      duplicatesMap.get(key)?.push(originalIndices.indexOf(row.id) + 1)
    }
  })

  const details: string[] = []
  duplicatesMap.forEach((lineNumbers, key) => {
    const rows = lineNumbers.join(", ")
    details.push(`Duplicate entry found in rows: ${rows}`)
  })

  return details
}


export async function processExcelFile(file: File): Promise<TransactionRow[]> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error("Invalid file object provided"))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        // Skip header row and process data
        const rows = jsonData.slice(1) as any[][]

        const processedData: TransactionRow[] = rows
          .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
          .map((row, index) => {
            const transactionRow: TransactionRow = {
              id: `row-${index}`,
              reference: generateReference(),
              valueDate: getCurrentDateFormatted(),
              payerName: row[2] || "",
              payerAccount: row[3] || "",
              amount: row[4] || "",
              currency: "IQD",
              receiverBIC: row[6] || "",
              beneficiaryAccount: row[8] || "", // Now gets account codes from column 8
              beneficiaryName: normalizeName(row[7] || ""), // Now gets Arabic names from column 7
              remittanceInformation: row[9] || "",
              detailsOfCharges: "SLEV",
              isDuplicate: false, // Default value
            }

            // Validate BIC/Account matching
            const validationError = validateBICAccount(transactionRow.receiverBIC, transactionRow.beneficiaryAccount)
            if (validationError) {
              transactionRow.validationError = validationError
            }

            // Validate beneficiary name length
            if (normalizeName(transactionRow.beneficiaryName).length > 32) {
              transactionRow.validationError = "Beneficiary name exceeds 32 characters"
            }

            return transactionRow
          })

        resolve(processedData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

export async function processMultipleExcelFiles(files: File[]): Promise<TransactionRow[]> {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error("No valid files provided for processing")
  }

  const allData: TransactionRow[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    if (!file || !(file instanceof File)) {
      throw new Error(`Invalid file object at position ${i + 1}`)
    }

    try {
      const fileData = await processExcelFile(file)
      allData.push(...fileData)
    } catch (error) {
      throw new Error(`Failed to process file: ${file.name}`)
    }
  }

  // Re-generate unique IDs for combined data
  const combinedData = allData.map((row, index) => ({
    ...row,
    id: `combined-row-${index}`,
  }))

  return findDuplicates(combinedData)
}

export function groupByBank(data: TransactionRow[]): Record<string, TransactionRow[]> {
  const groups: Record<string, TransactionRow[]> = {}

  // Create reverse mapping from BIC to bank name with partial matching
  const bicToBankMap: Record<string, string> = {}
  Object.entries(BANK_MAPPING).forEach(([bankName, bicCodes]) => {
    bicCodes.forEach((bic) => {
      // Store both full BIC and 8-character version for matching
      bicToBankMap[bic] = bankName
      if (bic.length > 8) {
        bicToBankMap[bic.substring(0, 8)] = bankName
      }
    })
  })

  data.forEach((row) => {
    let bankName = bicToBankMap[row.receiverBIC]

    // If no exact match, try partial matching
    if (!bankName) {
      for (const [fullBic, name] of Object.entries(bicToBankMap)) {
        if (fullBic.startsWith(row.receiverBIC) || row.receiverBIC.startsWith(fullBic.substring(0, 8))) {
          bankName = name
          break
        }
      }
    }

    bankName = bankName || "Unknown Bank"

    if (!groups[bankName]) {
      groups[bankName] = []
    }
    groups[bankName].push(row)
  })

  return groups
}

export async function exportToExcel(bankName: string, data: TransactionRow[]): Promise<void> {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()

  // Prepare data for export
  const exportData = [
    [
      "Reference",
      "Value Date",
      "Payer Name",
      "Payer Account",
      "Amount",
      "Currency",
      "Receiver BIC",
      "Beneficiary Name",
      "Beneficiary Account",
      "Remittance Information",
      "Details of Charges",
    ],
    ...data.map((row) => [
      row.reference,
      row.valueDate,
      row.payerName,
      row.payerAccount,
      row.amount,
      row.currency,
      row.receiverBIC,
      row.beneficiaryName,
      row.beneficiaryAccount,
      row.remittanceInformation,
      row.detailsOfCharges,
    ]),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(exportData)
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions")

  // Generate filename with Arabic month
  const currentMonth = ARABIC_MONTHS[new Date().getMonth()]
  const filename = `الشركة العامة لنقل الطاقة الكهربائية ${bankName} ${currentMonth} 2025.xlsx`

  try {
    // Create blob and trigger download for browser environment
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    throw new Error("Failed to export Excel file")
  }
}