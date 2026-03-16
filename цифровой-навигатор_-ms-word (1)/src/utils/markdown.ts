/**
 * Simple utility to parse basic markdown-like syntax to HTML.
 * Handles **bold**, *italic*, and \n newlines.
 */
export const parseMarkdown = (text: string): string => {
  if (!text) return '';

  return text
    // Handle bold: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Handle italic: *text* -> <em>$1</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Handle newlines: \n -> <br />
    .replace(/\n/g, '<br />');
};
