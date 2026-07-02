// Loaded only on the client (via dynamic ssr:false in rich-text-editor.tsx).
// Quill and quill-table-better touch `document` at import time, so they must
// never be imported during SSR.
import ReactQuill, { Quill } from "react-quill-new";
import QuillTableBetter from "quill-table-better";
import "react-quill-new/dist/quill.snow.css";
import "quill-table-better/dist/quill-table-better.css";

// Register the table module once. Quill.register is idempotent with overwrite.
Quill.register(
  {
    "modules/table-better": QuillTableBetter,
  },
  true,
);

interface RichTextEditorInnerProps {
  value: string;
  onChange: (value: string) => void;
}

const modules = {
  // Disable Quill's built-in (unusable) table module; table-better replaces it.
  table: false,
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link", "image"],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["table-better"],
    ["clean"],
  ],
  "table-better": {
    language: "en_US",
    menus: ["column", "row", "merge", "table", "cell", "wrap", "copy", "delete"],
    toolbarTable: true,
  },
  keyboard: {
    bindings: QuillTableBetter.keyboardBindings,
  },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "code-block",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "align",
  "color",
  "background",
  // table-better formats
  "table",
  "table-better",
  "table-cell-block",
  "table-th-block",
];

export default function RichTextEditorInner({
  value,
  onChange,
}: RichTextEditorInnerProps) {
  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-primary/50 transition-colors overflow-hidden">
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme="snow"
        placeholder="Unfold your narrative here..."
        className="text-zinc-200"
      />
    </div>
  );
}
