/**
 * Unit tests for stripReasoningTokens (src/lib/agents/model.ts).
 *
 * Regression lock for the overnight dev-server incident on 2026-04-08 where
 * a reasoning model (MiniMax) emitted `<thinking>...</thinking>` instead of
 * the `<think>` variant the old discovery-agent regex matched. The raw prose
 * leaked into JSON.parse and failed. These tests ensure the central helper
 * handles all common reasoning-tag variants, including tags with attributes,
 * mixed case, and multiple blocks.
 */

import { describe, it, expect } from 'vitest';
import { stripReasoningTokens } from '@/lib/agents/model';

describe('stripReasoningTokens', () => {
  it('strips a plain <think> block', () => {
    const input = '<think>reasoning prose</think>{"ok": true}';
    expect(stripReasoningTokens(input)).toBe('{"ok": true}');
  });

  it('strips a <thinking> block (the overnight bug variant)', () => {
    const input = '<thinking>long chain of thought\nacross lines</thinking>\n{"ok": true}';
    expect(stripReasoningTokens(input)).toBe('{"ok": true}');
  });

  it('strips a <reasoning> block', () => {
    const input = '<reasoning>step by step</reasoning>{"ok": true}';
    expect(stripReasoningTokens(input)).toBe('{"ok": true}');
  });

  it('strips tags with attributes like <think foo="bar">', () => {
    const input = '<think foo="bar" baz="qux">reasoning</think>{"ok": true}';
    expect(stripReasoningTokens(input)).toBe('{"ok": true}');
  });

  it('is case-insensitive', () => {
    const input = '<THINK>upper</THINK>{"ok": true}';
    expect(stripReasoningTokens(input)).toBe('{"ok": true}');
  });

  it('strips multiple reasoning blocks non-greedily', () => {
    const input =
      '<think>first</think>{"a": 1}<thinking>second</thinking>{"b": 2}';
    expect(stripReasoningTokens(input)).toBe('{"a": 1}{"b": 2}');
  });

  it('strips blocks that span many lines', () => {
    const input =
      '<think>\nline 1\nline 2\nline 3\n</think>\n{"ok": true}';
    expect(stripReasoningTokens(input)).toBe('{"ok": true}');
  });

  it('trims surrounding whitespace after stripping', () => {
    const input = '   <think>prose</think>\n\n  {"ok": true}   ';
    expect(stripReasoningTokens(input)).toBe('{"ok": true}');
  });

  it('passes clean JSON through unchanged', () => {
    const input = '{"findings": ["a", "b"], "assumptions": ["c"]}';
    expect(stripReasoningTokens(input)).toBe(input);
  });

  it('returns empty string when input is only a reasoning block', () => {
    expect(stripReasoningTokens('<think>only reasoning</think>')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(stripReasoningTokens('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(stripReasoningTokens('   \n\t   ')).toBe('');
  });

  it('does NOT cross-match tags with mismatched openers and closers', () => {
    // Backreference \1 means <think>...</reasoning> should not match as one block.
    // Neither side closes the other, so neither is stripped.
    const input = '<think>a</reasoning>{"ok": true}';
    expect(stripReasoningTokens(input)).toBe(input.trim());
  });

  it('preserves markdown content outside reasoning tags', () => {
    const input =
      '<think>draft</think>\n# PRD\n\n## Problem\n\nThe thing is broken.';
    expect(stripReasoningTokens(input)).toBe(
      '# PRD\n\n## Problem\n\nThe thing is broken.',
    );
  });

  it('handles real-world reasoning model output with JSON trailing the thought', () => {
    const input = `<thinking>
The brief mentions a recruitment consultancy so the division is likely biab.
Let me draft the findings.
</thinking>
{
  "findings": ["biab fits best"],
  "assumptions": ["consultant role"],
  "open_questions": ["which tier?"]
}`;
    const result = stripReasoningTokens(input);
    expect(result.startsWith('{')).toBe(true);
    expect(result.endsWith('}')).toBe(true);
    expect(result).not.toContain('<thinking>');
    expect(result).not.toContain('draft the findings');
  });
});
