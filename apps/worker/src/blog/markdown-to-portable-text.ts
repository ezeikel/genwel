/**
 * Markdown → Portable Text converter for Sanity blog posts.
 *
 * Extracted verbatim from apps/web/app/actions/blog.ts (the in-web pipeline)
 * so the worker produces byte-identical block output. This is stable formatting
 * code; if you change the parser semantics, change both copies (or hoist into a
 * shared package).
 */

// Parse inline markdown (bold, italic) into Portable Text spans.
export function parseInlineMarkdown(text: string): unknown[] {
  const spans: unknown[] = [];
  let spanIndex = 0;

  // Regex to match ***bold italic***, **bold**, or *italic*.
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match !== null) {
    // Add text before the match.
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) {
        spans.push({
          _type: 'span',
          _key: `span-${spanIndex++}`,
          text: beforeText,
        });
      }
    }

    if (match[2]) {
      // ***bold italic***
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: match[2],
        marks: ['strong', 'em'],
      });
    } else if (match[3]) {
      // **bold**
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: match[3],
        marks: ['strong'],
      });
    } else if (match[4]) {
      // *italic*
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: match[4],
        marks: ['em'],
      });
    }

    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }

  // Add remaining text.
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      spans.push({
        _type: 'span',
        _key: `span-${spanIndex++}`,
        text: remainingText,
      });
    }
  }

  // If no matches, return a simple span.
  if (spans.length === 0) {
    return [{ _type: 'span', _key: 'span-0', text }];
  }

  return spans;
}

// Convert markdown to Portable Text.
export function markdownToPortableText(markdown: string): unknown[] {
  const blocks: unknown[] = [];
  const lines = markdown.split('\n');

  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push({
          _type: 'block',
          _key: `block-${blocks.length}`,
          style: 'normal',
          children: parseInlineMarkdown(text),
        });
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip the title if it starts with # (the title lives in meta already).
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'h2',
        children: parseInlineMarkdown(trimmedLine.slice(3)),
      });
    } else if (trimmedLine.startsWith('### ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'h3',
        children: parseInlineMarkdown(trimmedLine.slice(4)),
      });
    } else if (trimmedLine.startsWith('#### ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'h4',
        children: parseInlineMarkdown(trimmedLine.slice(5)),
      });
    } else if (trimmedLine === '') {
      flushParagraph();
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'normal',
        listItem: 'bullet',
        children: parseInlineMarkdown(trimmedLine.slice(2)),
      });
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'normal',
        listItem: 'number',
        children: parseInlineMarkdown(trimmedLine.replace(/^\d+\.\s/, '')),
      });
    } else if (trimmedLine.startsWith('> ')) {
      flushParagraph();
      blocks.push({
        _type: 'block',
        _key: `block-${blocks.length}`,
        style: 'blockquote',
        children: parseInlineMarkdown(trimmedLine.slice(2)),
      });
    } else {
      currentParagraph.push(trimmedLine);
    }
  }

  flushParagraph();
  return blocks;
}

// Convert a plain-text bio into a single-block Portable Text array for Sanity.
export function bioToPortableText(bio: string): unknown[] {
  return [
    {
      _type: 'block',
      _key: 'bio-0',
      style: 'normal',
      children: [{ _type: 'span', _key: 'bio-span-0', text: bio }],
    },
  ];
}
