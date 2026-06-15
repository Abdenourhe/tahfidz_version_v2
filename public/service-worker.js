// public/service-worker.js
// Service worker pour les notifications push Web

self.addEventListener("push", (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: "TAHFIDZ", body: event.data.text() }
  }

  const title = data.title || "TAHFIDZ"
  const options = {
    body: data.body || "Nouvelle notification",
    tag: data.tag || "default",
    data: {
      url: data.url || "/",
    },
    requireInteraction: false,
  }
  if (data.icon) options.icon = data.icon
  if (data.badge) options.badge = data.badge

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("pushsubscriptionchange", (event) => {
  // L'abonnement a été renouvelé par le navigateur. On ne peut pas le renvoyer
  // automatiquement sans la clé VAPID côté client, donc on notifie l'utilisateur.
  event.waitUntil(
    self.registration.showNotification("TAHFIDZ", {
      body: "Veuillez réactiver les notifications dans les paramètres.",
      tag: "subscription-change",
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
