/**
 * TAHFIDZ SaaS — Phase 5 : Jobs BullMQ
 *
 * Queues :
 *  - absence-alerts  → notifie les parents par WhatsApp/email dès une absence
 *  - payment-reminders → relance automatique J+3, J+7, J+30
 *  - weekly-report   → résumé hebdo par enseignant (cron)
 *
 * Prérequis : Redis (Upstash ou Railway Redis)
 * REDIS_URL dans .env
 */

import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// ─── Connexion Redis ──────────────────────────────────────────────────────────

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null, // requis pour BullMQ
});

// ─── Définitions des queues ───────────────────────────────────────────────────

export const absenceQueue = new Queue("absence-alerts", { connection });
export const paymentQueue = new Queue("payment-reminders", { connection });
export const reportQueue  = new Queue("weekly-report",    { connection });

// ─── Types de jobs ────────────────────────────────────────────────────────────

export type AbsenceJobData = {
  schoolId:    string;
  studentId:   string;
  studentName: string;
  className:   string;
  date:        string; // ISO
  guardianPhone?: string;
  guardianEmail?: string;
};

export type PaymentReminderData = {
  schoolId:    string;
  paymentId:   string;
  studentName: string;
  feeLabel:    string;
  amountDue:   number;
  currency:    string;
  guardianPhone?: string;
  guardianEmail?: string;
};

// ─── Producteurs ─────────────────────────────────────────────────────────────

/**
 * Enregistre une alerte d'absence.
 * Délai de 5 min pour laisser le temps de corriger une erreur de saisie.
 */
export async function enqueueAbsenceAlert(data: AbsenceJobData) {
  return absenceQueue.add("notify", data, {
    delay:    5 * 60 * 1000, // 5 minutes
    attempts: 3,
    backoff:  { type: "exponential", delay: 60_000 },
    removeOnComplete: { age: 7 * 24 * 3600 },
    removeOnFail:     { age: 30 * 24 * 3600 },
  });
}

/**
 * Enregistre une relance de paiement avec délai configurable.
 */
export async function enqueuePaymentReminder(data: PaymentReminderData, delayDays: number) {
  return paymentQueue.add("remind", data, {
    delay:    delayDays * 24 * 60 * 60 * 1000,
    attempts: 2,
    backoff:  { type: "fixed", delay: 3_600_000 }, // retry 1h après
    removeOnComplete: { age: 14 * 24 * 3600 },
  });
}

/**
 * Planifie un rapport hebdo pour tous les enseignants d'une école.
 * Appelé via cron Next.js ou Vercel Cron.
 */
export async function scheduleWeeklyReport(schoolId: string) {
  return reportQueue.add("generate", { schoolId }, {
    repeat:   { pattern: "0 7 * * 1" }, // lundi 7h
    attempts: 2,
  });
}

// ─── Workers (à lancer dans un process séparé) ────────────────────────────────

/**
 * Worker absence — envoie SMS WhatsApp Business API ou email.
 * Activer en production : `node workers/absence.worker.js`
 */
export function startAbsenceWorker() {
  return new Worker(
    "absence-alerts",
    async (job: Job<AbsenceJobData>) => {
      const { studentName, className, date, guardianPhone, guardianEmail } = job.data;

      const message = `Bonjour, votre enfant ${studentName} était absent(e) en classe ${className} le ${new Date(date).toLocaleDateString("fr-MA")}. Pour toute question, contactez l'école.`;

      if (guardianPhone) {
        await sendWhatsApp(guardianPhone, message);
      }
      if (guardianEmail) {
        await sendEmail(guardianEmail, `Absence de ${studentName}`, message);
      }

      console.info(`[AbsenceWorker] Notifié pour ${studentName}`);
    },
    { connection, concurrency: 10 }
  );
}

export function startPaymentWorker() {
  return new Worker(
    "payment-reminders",
    async (job: Job<PaymentReminderData>) => {
      const { studentName, feeLabel, amountDue, currency, guardianPhone, guardianEmail } = job.data;

      const message = `Rappel : le paiement de ${amountDue} ${currency} pour « ${feeLabel} » de ${studentName} est en attente. Merci de régulariser votre situation.`;

      if (guardianPhone) await sendWhatsApp(guardianPhone, message);
      if (guardianEmail) await sendEmail(guardianEmail, `Rappel paiement — ${feeLabel}`, message);

      console.info(`[PaymentWorker] Relance envoyée pour ${studentName}`);
    },
    { connection, concurrency: 5 }
  );
}

// ─── Stubs de transport (à brancher sur votre fournisseur) ────────────────────

async function sendWhatsApp(phone: string, message: string) {
  // Brancher : Twilio, 360dialog, Meta Cloud API
  // await twilioClient.messages.create({ from: "whatsapp:+...", to: `whatsapp:${phone}`, body: message })
  console.info(`[WhatsApp → ${phone}]`, message.slice(0, 60));
}

async function sendEmail(to: string, subject: string, body: string) {
  // Brancher : Resend, SendGrid, Postmark
  // await resend.emails.send({ from: "noreply@tahfidz.app", to, subject, text: body })
  console.info(`[Email → ${to}] ${subject}`);
}
