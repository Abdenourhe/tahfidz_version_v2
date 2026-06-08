"use client"

import { useRef, useState } from "react"
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

  const handlePrint = () => {
    const originalTheme = theme
    setTheme("light")
    // Attendre que le DOM se mette à jour (next-themes modifie le class de <html>)
    setTimeout(() => {
      window.print()
      // Restaurer le thème après fermeture du dialogue (best effort)
      setTimeout(() => {
        if (originalTheme) setTheme(originalTheme)
      }, 800)
    }, 300)
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
          // Forcer le clone en mode light pour éviter le dark mode dans le PDF
          clonedDoc.documentElement.classList.remove("dark")
          clonedDoc.documentElement.classList.add("light")
          // S'assurer que le fond est blanc
          clonedDoc.body.style.backgroundColor = "#ffffff"
        },
      })
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
