"use client";

import type React from "react";

export const CATEGORY_OPTIONS = [
  { value: "forex-basics", label: "Forex Basics" },
  { value: "trading-psychology", label: "Trading Psychology" },
  { value: "risk-management", label: "Risk Management" },
  { value: "trading-strategies", label: "Trading Strategies" },
  { value: "uae-markets-regulation", label: "UAE Markets & Regulation" },
  { value: "crypto-trading", label: "Crypto Trading" },
  { value: "stock-markets", label: "Stock Markets" },
];

export type SeoValues = {
  metaTitle: string;
  metaDescription: string;
  canonicalOverride: string;
  ogImage: string;
  noindex: boolean;
  focusKeyword: string;
  schemaOverride: string;
};

export const EMPTY_SEO: SeoValues = {
  metaTitle: "",
  metaDescription: "",
  canonicalOverride: "",
  ogImage: "",
  noindex: false,
  focusKeyword: "",
  schemaOverride: "",
};

const LIMITS = { metaTitle: 60, metaDescription: 155 };

function Counter({ value, limit }: { value: string; limit: number }) {
  const n = value.length;
  const tone = n === 0 ? "text-gray-400" : n > limit ? "text-red-600" : "text-gray-500";
  return (
    <span className={`text-xs tabular-nums ${tone}`}>
      {n}/{limit}
      {n > limit ? " — will be truncated in results" : ""}
    </span>
  );
}

const input =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const label = "block text-sm font-medium text-gray-700 mb-2";

export function SeoFields({
  seo,
  category,
  fallbackTitle,
  fallbackDescription,
  onSeoChange,
  onCategoryChange,
}: {
  seo: SeoValues;
  category: string;
  fallbackTitle: string;
  fallbackDescription: string;
  onSeoChange: (next: SeoValues) => void;
  onCategoryChange: (next: string) => void;
}) {
  const set = <K extends keyof SeoValues>(key: K, value: SeoValues[K]) =>
    onSeoChange({ ...seo, [key]: value });

  const schemaError = (() => {
    if (!seo.schemaOverride.trim()) return "";
    try {
      JSON.parse(seo.schemaOverride);
      return "";
    } catch (e) {
      return (e as Error).message;
    }
  })();

  return (
    <details className="border border-gray-200 rounded-lg bg-white" open>
      <summary className="cursor-pointer px-4 py-3 font-medium text-gray-800 select-none">
        SEO
      </summary>

      <div className="px-4 pb-5 space-y-5 border-t border-gray-100 pt-5">
        <div>
          <label className={label}>Category</label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={input}
          >
            <option value="">Auto-detect from tags</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Decides which category hub this post appears on. Leave on auto-detect
            unless it lands in the wrong one.
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className={label + " mb-0"}>Meta title</label>
            <Counter value={seo.metaTitle} limit={LIMITS.metaTitle} />
          </div>
          <input
            type="text"
            value={seo.metaTitle}
            onChange={(e) => set("metaTitle", e.target.value)}
            placeholder={fallbackTitle || "Falls back to the post title"}
            className={input}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className={label + " mb-0"}>Meta description</label>
            <Counter value={seo.metaDescription} limit={LIMITS.metaDescription} />
          </div>
          <textarea
            rows={3}
            value={seo.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            placeholder={fallbackDescription || "Falls back to the post description"}
            className={input}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label}>Focus keyword</label>
            <input
              type="text"
              value={seo.focusKeyword}
              onChange={(e) => set("focusKeyword", e.target.value)}
              placeholder="forex trading course dubai"
              className={input}
            />
            <p className="text-xs text-gray-500 mt-1">
              Internal tracking only. Never rendered on the page.
            </p>
          </div>

          <div>
            <label className={label}>Social image URL</label>
            <input
              type="url"
              value={seo.ogImage}
              onChange={(e) => set("ogImage", e.target.value)}
              placeholder="Falls back to the post image"
              className={input}
            />
          </div>
        </div>

        <div>
          <label className={label}>Canonical URL override</label>
          <input
            type="url"
            value={seo.canonicalOverride}
            onChange={(e) => set("canonicalOverride", e.target.value)}
            placeholder="Leave empty — the post canonicals to itself"
            className={input}
          />
          <p className="text-xs text-gray-500 mt-1">
            Only set this when the same article is published elsewhere and that
            copy should rank instead. A wrong value removes this post from search.
          </p>
        </div>

        <div>
          <label className={label}>Schema override (JSON-LD)</label>
          <textarea
            rows={4}
            value={seo.schemaOverride}
            onChange={(e) => set("schemaOverride", e.target.value)}
            placeholder="Advanced. Replaces the generated BlogPosting schema."
            className={input + " font-mono text-xs"}
          />
          {schemaError ? (
            <p className="text-xs text-red-600 mt-1">
              Not valid JSON — {schemaError}. The post will not save until this is
              fixed or cleared.
            </p>
          ) : null}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={seo.noindex}
            onChange={(e) => set("noindex", e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-gray-700">
              Hide from search engines
            </span>
            <span className="block text-xs text-gray-500">
              The post stays live and reachable by link, but drops out of Google.
            </span>
          </span>
        </label>
      </div>
    </details>
  );
}

/** Blocks save on an invalid schema override rather than storing broken JSON. */
export function seoIsValid(seo: SeoValues): boolean {
  if (!seo.schemaOverride.trim()) return true;
  try {
    JSON.parse(seo.schemaOverride);
    return true;
  } catch {
    return false;
  }
}
