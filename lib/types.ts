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