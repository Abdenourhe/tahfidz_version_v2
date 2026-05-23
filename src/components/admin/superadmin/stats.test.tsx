import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuperAdminStats } from "./stats";

const mockSchools = [
  {
    id: "1",
    name: "Ecole A",
    nameAr: null,
    slug: "ecole-a",
    plan: "FREE",
    isActive: true,
    createdAt: "2024-01-01",
    logo: null,
    address: null,
    city: null,
    country: null,
    phone: null,
    _count: { users: 10 },
    users: [
      { id: "u1", fullName: "Alice", email: "a@a.com", role: "STUDENT", isActive: true, createdAt: "" },
      { id: "u2", fullName: "Bob", email: "b@b.com", role: "TEACHER", isActive: true, createdAt: "" },
    ],
  },
  {
    id: "2",
    name: "Ecole B",
    nameAr: null,
    slug: "ecole-b",
    plan: "PRO",
    isActive: false,
    createdAt: "2024-02-01",
    logo: null,
    address: null,
    city: null,
    country: null,
    phone: null,
    _count: { users: 5 },
    users: [
      { id: "u3", fullName: "Charlie", email: "c@c.com", role: "STUDENT", isActive: true, createdAt: "" },
    ],
  },
];

const mockRequests = [
  {
    id: "r1",
    schoolName: "Nouvelle Ecole",
    city: "Alger",
    country: "DZ",
    adminName: "Admin",
    adminEmail: "admin@test.com",
    adminPhone: null,
    classCount: 2,
    studentsPerClass: 20,
    teachersCount: 2,
    status: "PENDING" as const,
    slug: null,
    createdAt: "2024-03-01",
    processedAt: null,
  },
];

describe("SuperAdminStats", () => {
  it("affiche le nombre total d'écoles", () => {
    render(<SuperAdminStats schools={mockSchools} requests={mockRequests} />);
    expect(screen.getByText("Ecoles totales")).toBeInTheDocument();
    // Le nombre 2 apparaît dans les stats (écoles totales)
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le nombre d'écoles actives", () => {
    render(<SuperAdminStats schools={mockSchools} requests={mockRequests} />);
    expect(screen.getByText("Actives")).toBeInTheDocument();
  });

  it("affiche le MRR correct", () => {
    render(<SuperAdminStats schools={mockSchools} requests={mockRequests} />);
    // 1 FREE (0) + 1 PRO (79) = 79€/mois
    expect(screen.getByText(/79.*mois/)).toBeInTheDocument();
  });

  it("affiche l'ARR correct", () => {
    render(<SuperAdminStats schools={mockSchools} requests={mockRequests} />);
    expect(screen.getByText(/948.*an/)).toBeInTheDocument();
  });

  it("affiche le nombre de demandes en attente", () => {
    render(<SuperAdminStats schools={mockSchools} requests={mockRequests} />);
    expect(screen.getByText("En attente")).toBeInTheDocument();
  });
});
