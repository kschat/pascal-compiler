import { values } from 'lodash';

export enum PascalTokenType {
  Identifier = 'IDENTIFIER',
  Integer = 'INTEGER',
  Real = 'REAL',
  String = 'STRING',
  Error = 'ERROR',
  EndOfFile = 'END_OF_FILE',

  // Reserved words
  And = 'AND',
  Array = 'ARRAY',
  Begin = 'BEGIN',
  Case = 'CASE',
  Const = 'CONST',
  Div = 'DIV',
  Do = 'DO',
  Downto = 'DOWNTO',
  Else = 'ELSE',
  End = 'END',
  File = 'FILE',
  For = 'FOR',
  Function = 'FUNCTION',
  Goto = 'GOTO',
  If = 'IF',
  In = 'IN',
  Label = 'LABEL',
  Mod = 'MOD',
  Nil = 'NIL',
  Not = 'NOT',
  Of = 'OF',
  Or = 'OR',
  Packed = 'PACKED',
  Procedure = 'PROCEDURE',
  Program = 'PROGRAM',
  Record = 'RECORD',
  Repeat = 'REPEAT',
  Set = 'SET',
  Then = 'THEN',
  To = 'TO',
  Type = 'TYPE',
  Until = 'UNTIL',
  Var = 'VAR',
  While = 'WHILE',
  With = 'WITH',

  // Symbols
  Plus = '+',
  Minus = '-',
  Star = '*',
  Slash = '/',
  ColonEquals = ':=',
  Dot = '.',
  Comma = ',',
  Semicolon = ';',
  Colon = ':',
  Quote = '\'',
  Equals = '=',
  NotEquals = '<>',
  LessThan = '<',
  LessEquals = '<=',
  GreaterThan = '>',
  GreaterEquals = '>=',
  LeftParen = '(',
  RightParen = ')',
  LeftBracket = '[',
  RightBracket = ']',
  LeftBrace = '{',
  RightBrace = '}',
  UpCaret = '^',
  DotDot = '..',
}

const PASCAL_TOKEN_VALUES = values<typeof PascalTokenType>(PascalTokenType);
const RESERVED_WORD_START_INDEX = PASCAL_TOKEN_VALUES.indexOf(PascalTokenType.And);
const RESERVED_WORD_END_INDEX = PASCAL_TOKEN_VALUES.indexOf(PascalTokenType.With);
const SYMBOL_START_INDEX = PASCAL_TOKEN_VALUES.indexOf(PascalTokenType.Plus);
const SYMBOL_END_INDEX = PASCAL_TOKEN_VALUES.indexOf(PascalTokenType.DotDot);

export const RESERVED_WORDS = PASCAL_TOKEN_VALUES.filter((_, index) => {
  return index >= RESERVED_WORD_START_INDEX && index <= RESERVED_WORD_END_INDEX;
});

export const SYMBOLS = PASCAL_TOKEN_VALUES.filter((_, index) => {
  return index >= SYMBOL_START_INDEX && index <= SYMBOL_END_INDEX;
});
