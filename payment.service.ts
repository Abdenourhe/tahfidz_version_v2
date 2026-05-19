/**
 * TAHFIDZ SaaS — Phase 4 : PaymentService
 *
 * Fonctionnalités :
 *  - Enregistrement de paiement avec référence unique
 *  - Vérification du solde dû par élève/frais
 *  - Liste des impayés (pour relances)
 *  - Génération de données de reçu (PDF en Phase 5)
 *  - Rapport financier mensuel par école
 */

import { tenantClient } from "@/lib/prisma-tenant";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";

// ─── Validation ──────────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  studentId:  z.string().cuid(),
  feeId:      z.string().cuid(),
  amountPaid: z.number().positive(),
  method:     z.nativeEnum(PaymentMethod),
  reference:  z.string().max(100).optional(),
  paidAt:     z.coerce.date().default(() => new Date()),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

export class PaymentService {
  private db: ReturnType<typeof tenantClient>;

  constructor(private schoolId: string) {
    this.db = tenantClient(schoolId);
  }

  /**
   * Enregistre un paiement et le marque CONFIRMED si amountPaid >= fee.amount.
   */
  async record(input: CreatePaymentInput) {
    const data = CreatePaymentSchema.parse(input);

    // Charger le frais pour valider le montant
    const fee = await this.db.fee.findFirst({ where: { id: data.feeId } });
    if (!fee) throw new Error("Frais introuvable");

    const isFullPayment = data.amountPaid >= Number(fee.amount);

    const payment = await this.db.payment.create({
      data: {
        studentId:  data.studentId,
        feeId:      data.feeId,
        amountPaid: data.amountPaid,
        currency:   fee.currency,
        method:     data.method,
        reference:  data.reference ?? this.generateRef(),
        status:     isFullPayment ? "CONFIRMED" : "PENDING",
        paidAt:     data.paidAt,
      },
      include: {
        student: { select: { fullName: true } },
        fee:     { select: { label: true, amount: true, period: true } },
      },
    });

    return payment;
  }

  /**
   * Solde dû par un élève pour un frais donné sur une période.
   * Somme tous les CONFIRMED, compare au montant attendu × occurrences.
   */
  async balanceDue(studentId: string, feeId: string, occurrences = 1) {
    const [fee, payments] = await Promise.all([
      this.db.fee.findFirst({ where: { id: feeId } }),
      this.db.payment.findMany({
        where: { studentId, feeId, status: "CONFIRMED" },
      }),
    ]);

    if (!fee) throw new Error("Frais introuvable");

    const totalDue  = Number(fee.amount) * occurrences;
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const balance   = totalDue - totalPaid;

    return { totalDue, totalPaid, balance, isPaid: balance <= 0 };
  }

  /**
   * Liste des élèves avec paiements en attente ou solde impayé.
   * Utilisé pour les relances automatiques (Phase 5).
   */
  async unpaidList(feeId?: string) {
    const where = feeId
      ? { status: "PENDING" as PaymentStatus, feeId }
      : { status: "PENDING" as PaymentStatus };

    return this.db.payment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        student: { select: { fullName: true, guardianPhone: true, guardianEmail: true } },
        fee:     { select: { label: true, amount: true } },
      },
    });
  }

  /**
   * Données structurées pour générer un reçu PDF (Phase 5 : Puppeteer/React PDF).
   */
  async receiptData(paymentId: string) {
    const payment = await this.db.payment.findFirst({
      where:   { id: paymentId, status: "CONFIRMED" },
      include: {
        student: { select: { fullName: true } },
        fee:     { select: { label: true, amount: true, currency: true, period: true } },
      },
    });
    if (!payment) throw new Error("Paiement confirmé introuvable");

    return {
      receiptNumber: `REC-${payment.id.slice(0, 8).toUpperCase()}`,
      date:          payment.paidAt ?? payment.createdAt,
      studentName:   payment.student.fullName,
      feeLabel:      payment.fee.label,
      feePeriod:     payment.fee.period,
      amountPaid:    Number(payment.amountPaid),
      currency:      payment.fee.currency,
      method:        payment.method,
      reference:     payment.reference,
    };
  }

  /**
   * Rapport financier mensuel : total encaissé, ventilé par frais et par méthode.
   */
  async monthlyReport(year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month, 0, 23, 59, 59);

    const payments = await this.db.payment.findMany({
      where: { status: "CONFIRMED", paidAt: { gte: from, lte: to } },
      include: { fee: { select: { label: true } } },
    });

    const total = payments.reduce((s, p) => s + Number(p.amountPaid), 0);

    // Ventilation par frais
    const byFee: Record<string, { label: string; count: number; amount: number }> = {};
    for (const p of payments) {
      const key = p.feeId;
      if (!byFee[key]) byFee[key] = { label: p.fee.label, count: 0, amount: 0 };
      byFee[key].count++;
      byFee[key].amount += Number(p.amountPaid);
    }

    // Ventilation par méthode
    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amountPaid);
    }

    return {
      year, month, total,
      count:    payments.length,
      byFee:    Object.values(byFee),
      byMethod,
    };
  }

  // ── Privé ─────────────────────────────────────────────────────────────────

  private generateRef(): string {
    return `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
}
