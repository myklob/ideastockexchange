"use client";

import PortfolioView from "@/components/PortfolioView";

export default function PortfolioPage() {
  // In production, userId comes from auth. Using demo user for now.
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
      <p className="text-sm text-[var(--neutral)] mb-8">
        Your positions, P&L, and ROI. Performance is measured by capital returns, not social approval.
      </p>
      <PortfolioView userId="demo-user" />
    </div>
  );
}
