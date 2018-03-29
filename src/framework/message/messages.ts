export enum MessageType {
  SourceLine = 'SOURCE_LINE',
  SyntaxError = 'SYNTAX_ERROR',
  ParserSummary = 'PARSER_SUMMARY',
  InterpreterSummary = 'INTERPRETER_SUMMARY',
  CompilerSummary = 'COMPILER_SUMMARY',
  Miscellaneous = 'MISCELLANEOUS',
  Token = 'TOKEN',
  Assign = 'ASSIGN',
  Fetch = 'FETCH',
  Breakpoint = 'BREAKPOINT',
  RuntimeError = 'RUNTIME_ERROR',
  Call = 'CALL',
  Return = 'RETURN',
}

interface Message<T extends MessageType> {
  type: T;
}

export interface SourceLineMessage extends Message<MessageType.SourceLine> {
  lineNumber: number;
  line: string;
}

export interface SyntaxErrorMessage extends Message<MessageType.SyntaxError> {
  bar: number;
}

export interface ParserSummaryMessage extends Message<MessageType.ParserSummary> {
  lineNumber: number;
  errorCount: number;
  elapsedMilliseconds: number;
}

export interface CompilerSummaryMessage extends Message<MessageType.CompilerSummary> {
  instructionCount: number;
  elapsedMilliseconds: number;
}

export interface InterpreterSummaryMessage extends Message<MessageType.InterpreterSummary> {
  executionCount: number;
  runtimeErrors: number;
  elapsedMilliseconds: number;
}

export type MessageTypes = SourceLineMessage
  | SyntaxErrorMessage
  | ParserSummaryMessage
  | CompilerSummaryMessage
  | InterpreterSummaryMessage;
