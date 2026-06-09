"use client"

import { useRef, useState, useEffect } from "react"
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
    await new Promise((resolve) => setTimeout(resolve, 300))

    const el = templateRef.current
    const originalStyles = {
      position: el.style.position,
      left: el.style.left,
      top: el.style.top,
      zIndex: el.style.zIndex,
      pointerEvents: el.style.pointerEvents,
      opacity: el.style.opacity,
      visibility: el.style.visibility,
    }

    try {
      // Positionner hors écran mais rendu pour forcer le calcul des polices et du layout
      el.style.position = "absolute"
      el.style.left = "-9999px"
      el.style.top = "0"
      el.style.zIndex = "auto"
      el.style.pointerEvents = "auto"
      el.style.opacity = "1"
      el.style.visibility = "visible"

      // Attendre que les polices (notamment les polices arabes) soient chargées
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }
      await new Promise((resolve) => setTimeout(resolve, 200))

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
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
      // Restaurer les styles originaux
      el.style.position = originalStyles.position
      el.style.left = originalStyles.left
      el.style.top = originalStyles.top
      el.style.zIndex = originalStyles.zIndex
      el.style.pointerEvents = originalStyles.pointerEvents
      el.style.opacity = originalStyles.opacity
      el.style.visibility = originalStyles.visibility
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

      {/* Template print/PDF — rendu uniquement côté client pour éviter l'hydratation mismatch */}
      {mounted && (
        <div
          id="registration-card-print-container"
          ref={templateRef}
          style={{ position: "fixed", left: 0, top: 0, zIndex: -1, pointerEvents: "none" }}
        >
          <RegistrationCardPrintTemplate student={student} inviteUrl={inviteUrl} school={school} />
        </div>
      )}
    </div>
  )
}
