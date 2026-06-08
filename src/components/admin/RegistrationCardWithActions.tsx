"use client"

import { useRef, useState } from "react"
import { Download, Printer } from "lucide-react"
import { RegistrationCardPrintTemplate } from "./RegistrationCardPrintTemplate"
import { RegistrationCard } from "./RegistrationCard"
import { useLanguage } from "@/contexts/LanguageContext"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

interface Props {
  student: any
  inviteUrl?: string | null
  school: { name: string; logo?: string | null; slug?: string; address?: string | null; city?: string | null; phone?: string | null }
}

export function RegistrationCardWithActions({ student, inviteUrl, school }: Props) {
  const { useT } = useLanguage()
  const t = (key: string) => useT("printCard", key)
  const templateRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handlePrint = () => {
    const style = document.createElement("style")
    style.id = "print-override-style"
    style.innerHTML = `
      @media print {
        @page { margin: 0; }
        body > * { visibility: hidden !important; }
        #registration-card-print-container {
          visibility: visible !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 99999 !important;
        }
        #registration-card-print-container * { visibility: visible !important; }
      }
    `
    document.head.appendChild(style)
    window.print()
    setTimeout(() => {
      document.getElementById("print-override-style")?.remove()
    }, 1000)
  }

  const handleDownloadPDF = async () => {
    if (!templateRef.current) return
    setIsGeneratingPDF(true)
    await new Promise((resolve) => setTimeout(resolve, 200))
    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = pageWidth / imgWidth
      const scaledHeight = imgHeight * ratio
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, scaledHeight)
      pdf.save(`fiche-inscription-${student.studentCode}.pdf`)
    } catch (err) {
      console.error("[PDF ERROR]", err)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="bg-gray-100 py-8 print:py-0 print:bg-white">
      {/* Toolbar — cachée en print */}
      {!isGeneratingPDF && (
        <div className="admin-no-print max-w-[210mm] mx-auto mb-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">{t("title")}</h1>
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
              <Printer size={16} /> {t("print")}
            </button>
          </div>
        </div>
      )}

      {/* Carte écran (affichage normal) */}
      <RegistrationCard student={student} inviteUrl={inviteUrl} school={school} />

      {/* Template print/PDF — rendu hors écran mais capturable par html2canvas */}
      <div
        id="registration-card-print-container"
        ref={templateRef}
        style={{ position: "fixed", left: 0, top: 0, zIndex: -1, pointerEvents: "none" }}
      >
        <RegistrationCardPrintTemplate student={student} inviteUrl={inviteUrl} school={school} />
      </div>
    </div>
  )
}
