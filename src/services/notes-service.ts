import { Note } from '../domain/types';

export class NotesService {
  /**
   * Extracts note blocks from text.
   * Looks for markdown code blocks with "note" language identifier:
   * ```note
   * [Label]
   * content
   * ```
   */
  extractNotes(text: string): string[] {
    const notes: string[] = [];

    // Regex to match ```note blocks
    // Matches: ```note\n<content>\n```
    const noteBlockRegex = /```note\s*\n([\s\S]*?)\n```/g;

    let match;
    while ((match = noteBlockRegex.exec(text)) !== null) {
      const noteContent = match[1].trim();
      if (noteContent) {
        notes.push(noteContent);
      }
    }

    return notes;
  }

  /**
   * Formats notes for injection into prompts.
   * Each note is wrapped in its own ```note block.
   */
  formatNotesForContext(notes: Note[]): string {
    if (notes.length === 0) {
      return '';
    }

    const formattedNotes = notes
      .map((note) => `\`\`\`note\n${note.content}\n\`\`\``)
      .join('\n\n');

    return `Previous notes from earlier stages:\n\n${formattedNotes}\n\n---\n\n`;
  }
}
