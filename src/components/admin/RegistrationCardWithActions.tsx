"use client"

import { useRef, useState, useEffect } from "react"
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

  // Gestion du thème pour l'impression navigateur — manipulation DOM directe (instantanée)
  useEffect(() => {
    let originalClass = ""
    const handleBeforePrint = () => {
      originalClass = document.documentElement.className
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }
    const handleAfterPrint = () => {
      document.documentElement.className = originalClass
    }
    window.addEventListener("beforeprint", handleBeforePrint)
    window.addEventListener("afterprint", handleAfterPrint)
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint)
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return
    setIsGeneratingPDF(true)
    await new Promise((resolve) => setTimeout(resolve, 100))
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.classList.remove("dark")
          clonedDoc.documentElement.classList.add("light")
          clonedDoc.body.style.backgroundColor = "#ffffff"
        },
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()   // 210 mm
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Forcer la largeur à 210mm (pleine page A4)
      const ratio = pageWidth / imgWidth
      const scaledHeight = imgHeight * ratio
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, scaledHeight)
      pdf.save(`fiche-inscription-${student.studentCode}.pdf`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="bg-gray-100 py-8 print:py-0 print:bg-white">
      {/* Toolbar — cachée en print */}
      {!isGeneratingPDF && (
        <div className="admin-no-print max-w-[210mm] mx-auto mb-4 px-4 flex justify-between items-center">
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

      {/* Carte (capturée pour PDF) — wrapper max-w pour que html2canvas ait la bonne taille */}
      <div ref={cardRef} className="max-w-[210mm] mx-auto">
        <RegistrationCard student={student} inviteUrl={inviteUrl} school={school} />
      </div>
    </div>
  )
}
