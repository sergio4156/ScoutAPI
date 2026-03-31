"use client";

import { useState } from "react";

export default function ManageSubscription() {
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not open billing portal");
      }
    } catch {
      alert("Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleManage}
      disabled={loading}
      className="mt-4 w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 disabled:opacity-50"
    >
      {loading ? "Loading..." : "Manage Subscription"}
    </button>
  );
}
