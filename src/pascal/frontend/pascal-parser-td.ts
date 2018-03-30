import { Parser } from '../../framework/frontend';
import { MessageType } from '../../framework/message/message-emitter';
import { PerformanceTimer } from '../../framework/utility';
import { EofToken, PascalToken, PascalErrorToken } from './tokens';
import { PascalTokenType } from './token-type';
import { PascalErrorHandler } from './error-handler';
import { PascalError } from './errors';
import { LookupScope } from '../../framework/intermediate';

export class PascalParserTd extends Parser<PascalToken> {
  private readonly _TIMER = new PerformanceTimer();
  private readonly _ERROR_HANDLER = new PascalErrorHandler();

  public async parse(): Promise<void> {
    this._TIMER.start();

    let token: PascalToken;
    while (!((token = await this._tryNextToken()) instanceof EofToken)) {
      if (!(token instanceof PascalErrorToken)) {
        this.sendMessage({
          type: MessageType.Token,
          tokenType: token.type,
          lineNumber: token.lineNumber,
          position: token.position,
          text: token.text,
          value: token.value
        });
      }
      else {
        this._ERROR_HANDLER.flag(
          token,
          token.value,
          this
        );
      }

      if (token.type === PascalTokenType.Identifier) {
        const name = token.text.toLowerCase();
        const symbolEntry = this.symbolTableStack.lookupOrEnter(name, {
          scope: LookupScope.All
        });

        symbolEntry.appendLineNumber(token.lineNumber);
      }
    }

    this.sendMessage({
      type: MessageType.ParserSummary,
      lineNumber: token.lineNumber,
      errorCount: this.getErrorCount(),
      elapsedMilliseconds: this._TIMER.elaspedMilliseconds()
    });

    this._TIMER.stop();
  }

  public getErrorCount(): number {
    return this._ERROR_HANDLER.errorCount;
  }

  private async _tryNextToken(): Promise<PascalToken> {
    return await this.nextToken().catch((error: Error) => {
      if (!(error instanceof PascalError) || !error.token) {
        throw error;
      }

      return PascalErrorToken.convertToken(error.token, error);
    });
  }
}
