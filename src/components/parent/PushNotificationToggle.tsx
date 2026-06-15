"use client"

import { useState, useEffect, useCallback } from "react"
import { useT } from "@/contexts/LanguageContext"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setSubscribed(!!subscription)
    } catch (e) {
      console.error(e)
      setSubscribed(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false)
      return
    }
    setSupported(true)

    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => checkSubscription())
      .catch((err) => console.error("[SW REGISTER]", err))
      .finally(() => setLoading(false))
  }, [checkSubscription])

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") return false

      const res = await fetch("/api/notifications/vapid-public-key")
      const data = await res.json()
      if (!data.publicKey) return false

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      })

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys?.p256dh,
            auth: subscription.toJSON().keys?.auth,
          },
        }),
      })

      setSubscribed(true)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }
      setSubscribed(false)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  return { supported, subscribed, loading, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

interface Props {
  className?: string
}

export default function PushNotificationToggle({ className }: Props) {
  const t = useT("pushNotifications")
  const { supported, subscribed, loading, subscribe, unsubscribe } = usePushNotifications()
  const [busy, setBusy] = useState(false)

  if (!supported) return null

  const toggle = async () => {
    setBusy(true)
    if (subscribed) await unsubscribe()
    else await subscribe()
    setBusy(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={busy || loading}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50",
        subscribed
          ? "bg-tahfidz-green-light dark:bg-emerald-900/30 text-tahfidz-green"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
        className
      )}
    >
      {busy || loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : subscribed ? (
        <Bell size={14} />
      ) : (
        <BellOff size={14} />
      )}
      <span>
        {subscribed ? t("enabled") : t("disabled")}
      </span>
    </button>
  )
}
