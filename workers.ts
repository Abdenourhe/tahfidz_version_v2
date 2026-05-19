/**
 * TAHFIDZ SaaS — Workers BullMQ
 * Lancement : pnpm workers:start
 */

import { startAbsenceWorker, startPaymentWorker } from "./queues";

console.log("🔧 Démarrage des workers TAHFIDZ…");

const absenceWorker = startAbsenceWorker();
const paymentWorker = startPaymentWorker();

absenceWorker.on("completed", (job) =>
  console.log(`✅ [AbsenceWorker] Job ${job.id} terminé`)
);
absenceWorker.on("failed", (job, err) =>
  console.error(`❌ [AbsenceWorker] Job ${job?.id} échoué:`, err.message)
);
paymentWorker.on("completed", (job) =>
  console.log(`✅ [PaymentWorker] Job ${job.id} terminé`)
);

// Arrêt propre
process.on("SIGTERM", async () => {
  console.log("🛑 Arrêt des workers…");
  await absenceWorker.close();
  await paymentWorker.close();
  process.exit(0);
});

console.log("✅ Workers en écoute.");
