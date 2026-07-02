"use client";

import dynamic from "next/dynamic";

// The real editor (Quill + quill-table-better) is client-only — those libs
// reference `document` at import time and must not run during SSR.
const RichTextEditorInner = dynamic(() => import("./rich-text-editor-inner"), {
  ssr: false,
  loading: () => (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 text-zinc-500 text-sm">
      Loading editor…
    </div>
  ),
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return <RichTextEditorInner value={value} onChange={onChange} />;
}
