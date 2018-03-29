import { Scanner, Source } from '../../framework/frontend';
import { LETTER, PascalWordToken, PascalToken, EofToken } from './tokens';

class PascalScanner extends Scanner<PascalToken> {
  constructor(protected _source: Source) {
    super(_source);
  }

  protected async _extractToken(): Promise<PascalToken> {
    const currentCharacter = await this.currentCharacter();
    if (currentCharacter === Source.EOF) {
      return await new EofToken(this._source).init();
    }
    else if (LETTER.test(currentCharacter)) {
      const a = await new PascalWordToken(this._source).init();
      return a;
    }

    return await new PascalToken(this._source).init();
  }
}

export { PascalScanner };
