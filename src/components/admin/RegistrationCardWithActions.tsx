"use client"

import { useRef, useState } from "react"
import { Download, Printer } from "lucide-react"
import { RegistrationCard } from "./RegistrationCard"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

interface Props {
  student: any
  inviteUrl?: string | null
  school: { name: string; logo?: string | null; slug?: string; address?: string | null; city?: string | null; phone?: string | null }
}

export function RegistrationCardWithActions({ student, inviteUrl, school }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handlePrint = () => {
    window.open(`/print/registration-card/${student.id}`, "_blank")
  }

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return
    setIsGeneratingPDF(true)
    await new Promise((resolve) => setTimeout(resolve, 100))
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
      const centerX = (pageWidth - imgWidth * ratio) / 2
      pdf.addImage(imgData, "PNG", centerX, 0, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`fiche-inscription-${student.studentCode}.pdf`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Toolbar */}
      {!isGeneratingPDF && (
        <div className="max-w-[210mm] mx-auto mb-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Fiche d&apos;inscription</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-tahfidz-green-dark transition shadow-sm"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm"
            >
              <Printer size={16} /> Imprimer
            </button>
          </div>
        </div>
      )}

      {/* Carte (capturée pour PDF) */}
      <div ref={cardRef}>
        <RegistrationCard student={student} inviteUrl={inviteUrl} school={school} />
      </div>
    </div>
  )
}
