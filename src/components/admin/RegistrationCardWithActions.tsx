"use client"

import { useRef, useState, useEffect } from "react"
import { Download, Printer } from "lucide-react"
import { RegistrationCard } from "./RegistrationCard"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { useTheme } from "next-themes"

interface Props {
  student: any
  inviteUrl?: string | null
  school: { name: string; logo?: string | null; slug?: string; address?: string | null; city?: string | null; phone?: string | null }
}

export function RegistrationCardWithActions({ student, inviteUrl, school }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { theme, setTheme } = useTheme()

  // Gestion robuste du thème pour l'impression navigateur
  useEffect(() => {
    const handleBeforePrint = () => setTheme("light")
    const handleAfterPrint = () => {
      if (theme) setTheme(theme)
    }
    window.addEventListener("beforeprint", handleBeforePrint)
    window.addEventListener("afterprint", handleAfterPrint)
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint)
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [theme, setTheme])

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
      const pageHeight = pdf.internal.pageSize.getHeight() // 297 mm
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Forcer la largeur à 210mm, ajuster la hauteur proportionnellement
      const ratio = pageWidth / imgWidth
      const scaledHeight = imgHeight * ratio

      // Si ça dépasse en hauteur, on réduit pour tenir sur 1 page
      if (scaledHeight > pageHeight) {
        const fitRatio = pageHeight / imgHeight
        const fitWidth = imgWidth * fitRatio
        const centerX = (pageWidth - fitWidth) / 2
        pdf.addImage(imgData, "PNG", centerX, 0, fitWidth, pageHeight)
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, scaledHeight)
      }

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

      {/* Carte (capturée pour PDF) */}
      <div ref={cardRef}>
        <RegistrationCard student={student} inviteUrl={inviteUrl} school={school} />
      </div>
    </div>
  )
}
