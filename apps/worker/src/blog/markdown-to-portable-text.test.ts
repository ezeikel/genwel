import { describe, expect, it } from 'vitest';
import {
  markdownToPortableText,
  parseInlineMarkdown,
} from './markdown-to-portable-text.js';

type Span = { _type: string; _key: string; text: string; marks?: string[] };
type Block = { _type: string; style: string; children: Span[] };

describe('parseInlineMarkdown', () => {
  it('splits bold, italic and plain runs into marked spans', () => {
    const spans = parseInlineMarkdown(
      'Save **hard** now, *relax* later',
    ) as Span[];

    expect(spans.map((s) => s.text)).toEqual([
      'Save ',
      'hard',
      ' now, ',
      'relax',
      ' later',
    ]);
    expect(spans[1].marks).toEqual(['strong']);
    expect(spans[3].marks).toEqual(['em']);
    expect(spans[0].marks).toBeUndefined();
  });

  it('marks ***bold italic*** with both marks', () => {
    const spans = parseInlineMarkdown('***urgent***') as Span[];
    expect(spans).toHaveLength(1);
    expect(spans[0].marks).toEqual(['strong', 'em']);
  });

  it('returns a single plain span when there is no markup', () => {
    expect(parseInlineMarkdown('plain text')).toEqual([
      { _type: 'span', _key: 'span-0', text: 'plain text' },
    ]);
  });
});

describe('markdownToPortableText', () => {
  it('drops the H1 title but keeps H2s and paragraphs as blocks', () => {
    const blocks = markdownToPortableText(
      ['# Post title', '', '## Section', '', 'First paragraph.'].join('\n'),
    ) as Block[];

    const styles = blocks.map((b) => b.style);
    expect(styles).not.toContain('h1');
    expect(styles).toContain('h2');
    expect(blocks.some((b) => b.children[0]?.text === 'First paragraph.')).toBe(
      true,
    );
  });

  it('joins consecutive lines into one paragraph block', () => {
    const blocks = markdownToPortableText(
      'line one\nline two\n\nsecond para',
    ) as Block[];

    const paragraphs = blocks.filter((b) => b.style === 'normal');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].children[0].text).toBe('line one line two');
  });
});
