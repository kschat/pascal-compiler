import { Token, Source } from '../../framework/frontend';

import { upperFirst, camelCase, flowRight as compose } from 'lodash';
import { PascalTokenType, RESERVED_WORDS } from './token-type';

export const LETTER = /[a-z]/i;
export const LETTER_OR_DIGIT = /(?:[a-z]|\d)+/i;

const pascalCase = compose<string, string, string>(upperFirst, camelCase);

export class PascalToken<V = undefined> extends Token<PascalTokenType> {
  constructor(protected _source: Source) {
    super(_source);
  }
}

export class EofToken extends PascalToken {
  constructor(protected _source: Source) {
    super(_source);
  }

  protected async extract(): Promise<void> { }
}

export class PascalWordToken extends PascalToken {
  constructor(protected _source: Source) {
    super(_source);
  }

  protected async extract(): Promise<void> {
    let currentCharacter = await this._currentCharacter();
    if (!LETTER.test(currentCharacter)) {
      // TODO return ErrorToken instead
      throw new Error(`Validation Error: Word must start with a letter, found "${currentCharacter}"`);
    }

    let text = currentCharacter;
    while (LETTER_OR_DIGIT.test(await this._nextCharacter())) {
      text += await this._currentCharacter();
    }

    this._text = text;
    this._type = RESERVED_WORDS.find((v) => v === text.toUpperCase())
      || PascalTokenType.Identifier;
  }
}