export interface InlineCodePart {
  text: string;
  code: boolean;
}

/** Parse backtick spans only; leave HTML and other Markdown as literal text. */
export function parseInlineCode(text: string): InlineCodePart[] {
  const parts: InlineCodePart[] = [];
  // Escapes outside code, or a pair of backtick runs of exactly the same length.
  const pattern = /\\([\\`])|(?<!`)(`+)(?!`)([\s\S]*?[^`])\2(?!`)/g;
  let offset = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) parts.push({ text: text.slice(offset, match.index), code: false });
    if (match[1] !== undefined) {
      parts.push({ text: match[1], code: false });
    } else {
      let value = match[3].replace(/\r\n?|\n/g, ' ');
      // Markdown code spans remove one surrounding space, except for all-space spans.
      if (value.startsWith(' ') && value.endsWith(' ') && /[^ ]/.test(value)) value = value.slice(1, -1);
      parts.push({ text: value, code: true });
    }
    offset = match.index + match[0].length;
  }

  if (offset < text.length) parts.push({ text: text.slice(offset), code: false });
  return parts;
}

export function inlineCodeToText(text: string): string {
  return parseInlineCode(text).map((part) => part.text).join('');
}
