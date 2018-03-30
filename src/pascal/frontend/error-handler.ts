import { PascalToken } from './tokens';
import { PascalError } from './errors';
import { Parser } from '../../framework/frontend/parser';
import { MessageType } from '../../framework/message/messages';
import { TooManyErrorsError } from './errors';

export class PascalErrorHandler {
  private static readonly MAX_ERRORS = 25;
  private _errorCount = 0;

  public get errorCount(): number {
    return this._errorCount;
  }

  public flag(token: PascalToken, error: PascalError, parser: Parser): void {
    this._errorCount += 1;
    parser.sendMessage({
      type: MessageType.SyntaxError,
      lineNumber: token.lineNumber,
      position: token.position,
      text: token.text,
      errorMessage: error.message
    });

    if (this._errorCount >= PascalErrorHandler.MAX_ERRORS) {
      return this.abort(new TooManyErrorsError(), parser);
    }
  }

  public abort(error: PascalError, parser: Parser): void {
    parser.sendMessage({
      type: MessageType.SyntaxError,
      lineNumber: 0,
      position: 0,
      text: '',
      errorMessage: `FATAL ERROR: ${error.message}`
    });

    return process.exit(error.status);
  }
}
