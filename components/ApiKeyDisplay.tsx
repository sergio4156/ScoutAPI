"use client";

import { useState } from "react";

export default function ApiKeyDisplay({ keyPreview }: { keyPreview: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(keyPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-3">
        <code className="flex-1 truncate text-sm text-gray-700">
          {keyPreview}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-300"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Keep your API key secret. Do not share it publicly.
      </p>
    </div>
  );
}
