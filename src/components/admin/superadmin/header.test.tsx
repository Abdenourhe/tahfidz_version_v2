import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SuperAdminHeader } from "./header";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

import { signOut } from "next-auth/react";

describe("SuperAdminHeader", () => {
  it("affiche le titre", () => {
    render(<SuperAdminHeader dark={false} onToggleDark={() => {}} />);
    expect(screen.getByText("TAHFIDZ — Super Admin")).toBeInTheDocument();
  });

  it("affiche le bouton mode sombre quand dark=false", () => {
    render(<SuperAdminHeader dark={false} onToggleDark={() => {}} />);
    expect(screen.getByText("Sombre")).toBeInTheDocument();
  });

  it("affiche le bouton mode clair quand dark=true", () => {
    render(<SuperAdminHeader dark={true} onToggleDark={() => {}} />);
    expect(screen.getByText("Clair")).toBeInTheDocument();
  });

  it("appelle onToggleDark au clic", () => {
    const toggle = vi.fn();
    render(<SuperAdminHeader dark={false} onToggleDark={toggle} />);
    fireEvent.click(screen.getByText("Sombre"));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("appelle signOut au clic sur déconnexion", () => {
    render(<SuperAdminHeader dark={false} onToggleDark={() => {}} />);
    fireEvent.click(screen.getByText("Deconnexion"));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
