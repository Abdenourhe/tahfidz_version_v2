"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Video, AlertCircle, Clock, ArrowLeft, ExternalLink, Users, Calendar } from "lucide-react"

export function RoomContent() {
  const searchParams = useSearchParams()
  const meetingID = searchParams?.get("meetingID") || ""
  const name = searchParams?.get("name") || ""
  const joinUrl = searchParams?.get("joinUrl") || ""

  const [elapsed, setElapsed] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":")
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        {/* Carte principale */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video size={32} className="text-tahfidz-green" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Halaqa Online
          </h1>
          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-4">
            <AlertCircle size={16} />
            <span>Mode démonstration</span>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Le serveur BigBlueButton n&apos;est pas configuré. La salle de visioconférence ne peut pas être lancée en conditions réelles.
          </p>

          <div className="bg-gray-800 rounded-xl p-4 text-left space-y-3 text-sm mb-6">
            <div className="flex items-center gap-2 text-gray-500">
              <Users size={16} className="text-gray-400" />
              <span className="text-gray-400 font-medium">Participant :</span>
              <span className="text-gray-300">{name || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-400 font-medium">Session :</span>
              <span className="text-gray-300 truncate">{meetingID || joinUrl || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={16} className="text-gray-400" />
              <span className="text-gray-400 font-medium">Heure :</span>
              <span className="text-gray-300">{currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={16} className="text-tahfidz-green" />
              <span className="text-gray-400 font-medium">Temps écoulé :</span>
              <span className="text-tahfidz-green font-mono">{formatTime(elapsed)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition"
            >
              <ArrowLeft size={16} />
              Retour
            </button>
            <a
              href="https://docs.bigbluebutton.org/administration/install/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-medium transition"
            >
              <ExternalLink size={16} />
              Guide d&apos;installation BBB
            </a>
          </div>
        </div>

        {/* Instructions de configuration */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-white mb-3">Pour activer les visioconférences</h2>
          <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
            <li>Installez un serveur BigBlueButton ou souscrivez à un hébergeur BBB.</li>
            <li>Ajoutez ces variables d&apos;environnement :</li>
          </ol>
          <div className="mt-3 bg-gray-950 rounded-lg p-3 font-mono text-xs text-gray-500 space-y-1">
            <p>BBB_SERVER_URL=https://votre-serveur-bbb.com/bigbluebutton</p>
            <p>BBB_SECRET=votre-shared-secret-bbb</p>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Redémarrez ensuite l&apos;application pour que la configuration soit prise en compte.
          </p>
        </div>
      </div>
    </div>
  )
}
