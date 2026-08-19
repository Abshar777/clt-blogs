/**
 * Quill (and pasted content) can save a blank line as a fully empty <p></p>.
 * An empty block has no line box, so its margins collapse through it and the
 * intended blank line disappears on render. <p><br></p> has a line box (from
 * the <br>) and renders the gap. Normalize on save so stored content is
 * unambiguous regardless of how it was authored.
 */
export function normalizeBlogContent(html: string): string {
  return html.replace(/<p>(?:\s|&nbsp;|&#160;)*<\/p>/gi, "<p><br></p>")
}
