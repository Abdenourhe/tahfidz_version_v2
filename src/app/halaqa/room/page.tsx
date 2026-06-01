import { Suspense } from "react"
import { Video } from "lucide-react"
import { RoomContent } from "./RoomContent"

export const dynamic = "force-dynamic"

export default function HalaqaRoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Video size={32} className="text-tahfidz-green" />
          </div>
          <h1 className="text-xl font-bold text-white">Chargement...</h1>
        </div>
      </div>
    }>
      <RoomContent />
    </Suspense>
  )
}
