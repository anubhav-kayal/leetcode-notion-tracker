const LANGUAGE_MAP: Record<string, string> = {
  python3: 'python',
  python: 'python',
  cpp: 'c++',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  golang: 'go',
  rust: 'rust',
  c: 'c',
  csharp: 'c#',
  ruby: 'ruby',
  swift: 'swift',
  kotlin: 'kotlin',
  scala: 'scala',
  php: 'php',
  dart: 'plain text',
  racket: 'plain text',
  erlang: 'plain text',
  elixir: 'plain text',
}

export function toNotionLanguage(leetcodeLang: string): string {
  return LANGUAGE_MAP[leetcodeLang] ?? 'plain text'
}
