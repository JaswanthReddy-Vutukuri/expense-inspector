import { Pipe, PipeTransform } from '@angular/core';

/**
 * Lightweight markdown-to-HTML pipe for AI chat messages.
 * Handles: **bold**, *italic*, `code`, bullet lists, numbered lists, newlines.
 * No external dependencies — keeps bundle small.
 */
@Pipe({ name: 'simpleMarkdown', standalone: true })
export class SimpleMarkdownPipe implements PipeTransform {
  transform(text: string): string {
    if (!text) return '';

    let html = this.escapeHtml(text);

    // Code blocks (``` ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/20 rounded px-2 py-1.5 my-1 text-xs overflow-x-auto"><code>$2</code></pre>');

    // Inline code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 py-0.5 rounded text-xs">$1</code>');

    // Bold (**...**)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic (*...*)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Bullet lists (lines starting with - or •)
    html = html.replace(/^[\-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-1">$1</ul>');

    // Numbered lists (lines starting with 1. 2. etc.)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

    // Newlines to <br> (but not inside <pre> or <ul>)
    html = html.replace(/\n/g, '<br>');

    // Clean up <br> inside block elements
    html = html.replace(/<br><ul/g, '<ul');
    html = html.replace(/<\/ul><br>/g, '</ul>');
    html = html.replace(/<br><pre/g, '<pre');
    html = html.replace(/<\/pre><br>/g, '</pre>');

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
