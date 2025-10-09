/**
 * Remove markdown formatting from text (asterisks for bold/italic)
 * and clean up extra whitespace
 */
export function cleanMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Remove bold markdown (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic markdown (*text* or _text_)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

/**
 * Clean markdown from an array of strings
 */
export function cleanMarkdownArray(items: string[]): string[] {
  return items.map(item => cleanMarkdown(item));
}
