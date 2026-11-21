/** Split the box's text into typed answers, one per line. */
export function stdinLines(text: string): string[] {
  if (text === '') return []
  return text.replace(/\r\n/g, '\n').split('\n')
}
