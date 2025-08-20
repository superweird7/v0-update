"use client"

import dynamic from "next/dynamic"

const ExcelProcessorApp = dynamic(() => import("@/components/ExcelProcessorApp"), { ssr: false })

export default function Page() {
  return <ExcelProcessorApp />
}
