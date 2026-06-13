// src/lib/pdf-thumbnail-client.ts
// Helpers client pour générer une vignette à partir de la première page d'un PDF.

let pdfjsModule: typeof import("pdfjs-dist") | null = null

async function getPdfjs() {
  if (pdfjsModule) return pdfjsModule
  const mod = await import("pdfjs-dist")
  if (typeof window !== "undefined") {
    // Utilisation du worker hébergé sur CDN pour simplifier le bundling Next.js.
    // En cas d'indisponibilité, la fonction de génération retombera sur l'icône par défaut.
    mod.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`
  }
  pdfjsModule = mod
  return mod
}

interface GenerateOptions {
  /** Largeur cible de la vignette (hauteur ajustée selon le ratio du PDF). */
  width?: number
  /** Qualité JPEG (0-1). */
  quality?: number
}

export interface PdfThumbnailResult {
  dataUrl: string
  numPages: number
}

/**
 * Génère une data URL JPEG de la première page d'un PDF et retourne le nombre total de pages.
 * Accepte une URL, un ArrayBuffer ou un File.
 */
export async function generatePdfThumbnail(
  source: string | ArrayBuffer | File,
  options: GenerateOptions = {}
): Promise<PdfThumbnailResult> {
  const { width = 256, quality = 0.85 } = options
  const pdfjs = await getPdfjs()

  const docSource = source instanceof File ? await source.arrayBuffer() : source
  const docParams = typeof docSource === "string" ? { url: docSource } : { data: docSource }
  const pdf = await pdfjs.getDocument(docParams).promise
  const page = await pdf.getPage(1)
  const originalViewport = page.getViewport({ scale: 1 })
  const scale = width / originalViewport.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Impossible d'obtenir le contexte canvas")

  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))

  await page.render({ canvas: null, canvasContext: ctx, viewport }).promise
  return {
    dataUrl: canvas.toDataURL("image/jpeg", quality),
    numPages: pdf.numPages,
  }
}
