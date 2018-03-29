import { Parser } from '../../framework/frontend';
import { MessageType } from '../../framework/message/message-emitter';
import { PerformanceTimer } from '../../framework/utility';
import { EofToken, PascalToken } from './tokens';

class PascalParserTd extends Parser<PascalToken> {
  private readonly _TIMER = new PerformanceTimer();

  public async parse(): Promise<void> {
    let token: PascalToken;
    this._TIMER.start();

    while (!((token = await this.nextToken()) instanceof EofToken)) { }

    this.sendMessage({
      type: MessageType.ParserSummary,
      lineNumber: token.lineNumber,
      errorCount: this.getErrorCount(),
      elapsedMilliseconds: this._TIMER.elaspedMilliseconds()
    });

    this._TIMER.stop();
  }

  public getErrorCount(): number {
    return 0;
  }
}

export { PascalParserTd };
