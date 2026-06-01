"use client"

import { useSearchParams } from "next/navigation"
import { Video, AlertCircle } from "lucide-react"

export function RoomContent() {
  const searchParams = useSearchParams()
  const meetingID = searchParams?.get("meetingID") || ""
  const name = searchParams?.get("name") || ""

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
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
          Le serveur BigBlueButton n&apos;est pas configuré. La salle de visioconférence ne peut pas être lancée.
        </p>
        <div className="bg-gray-800 rounded-lg p-4 text-left space-y-2 text-sm">
          <p className="text-gray-500">
            <span className="text-gray-400 font-medium">Session :</span> {meetingID}
          </p>
          <p className="text-gray-500">
            <span className="text-gray-400 font-medium">Participant :</span> {name}
          </p>
        </div>
        <p className="text-xs text-gray-600 mt-6">
          Pour activer les visioconférences, ajoutez les variables d&apos;environnement{" "}
          <code className="text-gray-500">BBB_SERVER_URL</code> et{" "}
          <code className="text-gray-500">BBB_SECRET</code>.
        </p>
      </div>
    </div>
  )
}
