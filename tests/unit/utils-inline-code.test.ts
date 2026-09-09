import { describe, expect, it } from 'vitest';
import { inlineCodeToText, parseInlineCode, type InlineCodePart } from '../../src/utils/inline-code';

const plain = (text: string) => ({ text, code: false });
const code = (text: string) => ({ text, code: true });

describe('parseInlineCode', () => {
  it.each<[string, InlineCodePart[]]>([
    ['', []],
    ['Plain text', [plain('Plain text')]],
    ['Use `nohirescd` and `tidalv1`.', [plain('Use '), code('nohirescd'), plain(' and '), code('tidalv1'), plain('.')]],
    ['`code`', [code('code')]],
    ['`code` suffix', [code('code'), plain(' suffix')]],
    ['``use `backticks` here``', [code('use `backticks` here')]],
    ['```a``b`c```', [code('a``b`c')]],
    ['`` ` ``', [code('`')]],
    ['` two words `', [code('two words')]],
    ['`  padded  `', [code(' padded ')]],
    ['`   `', [code('   ')]],
    ['` left`', [code(' left')]],
    ['`right `', [code('right ')]],
    ['`a\r\nb\nc\rd`', [code('a b c d')]],
    ['`a\tb`', [code('a\tb')]],
    ['Unmatched `tick', [plain('Unmatched `tick')]],
    ['Mismatched ``ticks`', [plain('Mismatched ``ticks`')]],
    ['``', [plain('``')]],
    ['````', [plain('````')]],
    ['`unfinished then ``valid``', [plain('`unfinished then '), code('valid')]],
    ['\\`literal\\`', [plain('`'), plain('literal'), plain('`')]],
    ['\\\\`code`', [plain('\\'), code('code')]],
    ['`a\\`', [code('a\\')]],
    ['**bold** [link](https://example.com) <b>HTML</b>', [plain('**bold** [link](https://example.com) <b>HTML</b>')]],
    ['`<script>alert("x")</script> & text`', [code('<script>alert("x")</script> & text')]],
  ])('parses %j without enabling other markup', (input, expected) => {
    expect(parseInlineCode(input)).toEqual(expected);
  });
});

describe('inlineCodeToText', () => {
  it('removes code delimiters for plain-text metadata while preserving surrounding text', () => {
    expect(inlineCodeToText('Use `lyrics` with ``a `literal` tick``.')).toBe('Use lyrics with a `literal` tick.');
  });

  it('preserves unmatched ticks and handles empty input', () => {
    expect(inlineCodeToText('Keep this `')).toBe('Keep this `');
    expect(inlineCodeToText('')).toBe('');
  });
});
