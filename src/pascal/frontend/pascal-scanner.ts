import { Scanner, Source } from '../../framework/frontend';
import { InvalidCharacterError } from './errors';
import { SYMBOLS } from './token-type';

import {
  LETTER,
  DIGIT,
  PascalWordToken,
  PascalToken,
  EofToken,
  PascalStringToken,
  PascalErrorToken,
  PascalSymbolToken,
  PascalNumberToken
} from './tokens';

const WHITESPACE = /\s/;

export class PascalScanner extends Scanner<PascalToken> {
  protected async _extractToken(): Promise<PascalToken> {
    const currentCharacter = await this._skipWhitespaceAndComments();
    if (currentCharacter === Source.EOF) {
      return await new EofToken(this._source).build();
    }
    else if (LETTER.test(currentCharacter)) {
      return await new PascalWordToken(this._source).build();
    }
    else if (currentCharacter === '\'') {
      return await new PascalStringToken(this._source).build();
    }
    else if (SYMBOLS.find((v) => v.startsWith(currentCharacter))) {
      return await new PascalSymbolToken(this._source).build();
    }
    else if (DIGIT.test(currentCharacter)) {
      return await new PascalNumberToken(this._source).build();
    }

    await this.nextCharacter();
    return await new PascalErrorToken(
      this._source,
      new InvalidCharacterError(),
      currentCharacter
    ).build();
  }

  private async _skipWhitespaceAndComments(): Promise<string> {
    let currentCharacter = await this.currentCharacter();
    while (WHITESPACE.test(currentCharacter) || currentCharacter === '{') {
      await this._skipWhitespace();
      currentCharacter = await this._skipComment();
    }

    return currentCharacter;
  }

  private async _skipWhitespace(): Promise<string> {
    let currentCharacter = await this.currentCharacter();
    if (!WHITESPACE.test(currentCharacter)) {
      return currentCharacter;
    }

    while (WHITESPACE.test(await this.nextCharacter())) { }
    return await this.currentCharacter();
  }

  private async _skipComment(): Promise<string> {
    const currentCharacter = await this.currentCharacter();
    if (currentCharacter !== '{') {
      return currentCharacter;
    }

    while (await this.nextCharacter() !== '}') { }
    return await this.nextCharacter();
  }
}
