import { upperFirst, camelCase, flowRight as compose } from 'lodash';

import { PascalTokenType, RESERVED_WORDS } from './token-type';
import { PascalError, UnexpectedTokenError, UnexpectedEofError } from './errors';
import { Token, Source } from '../../framework/frontend';

export const LETTER = /[a-z]/i;
export const LETTER_OR_DIGIT = /(?:[a-z]|\d)+/i;

const pascalCase = compose<string, string, string>(upperFirst, camelCase);

export class PascalToken<V = {}> extends Token<PascalTokenType, V> { }

export class EofToken extends PascalToken {
  protected async _extract(): Promise<this> { 
    this._text = Source.EOF;
    this._type = PascalTokenType.EndOfFile;
    return this;
  }
}

export class PascalErrorToken extends PascalToken<PascalError> {
  public static convertToken(token: PascalToken, error: PascalError): PascalErrorToken {
    return new PascalErrorToken(token.source, error, token.text);
  }

  constructor(
    _source: Source, 
    protected _value: PascalError, 
    protected _text: string
  ) {
    super(_source);
    this._type = PascalTokenType.Error;
  }

  protected async _extract(): Promise<this> { 
    return this;
  }
}

export class PascalWordToken extends PascalToken {
  protected async _extract(): Promise<this> {
    const currentCharacter = await this._currentCharacter();
    if (!LETTER.test(currentCharacter)) {
      throw new UnexpectedTokenError(this);
    }

    let text = currentCharacter;
    while (LETTER_OR_DIGIT.test(await this._nextCharacter())) {
      text += await this._currentCharacter();
    }

    this._text = text;
    this._type = RESERVED_WORDS.find((v) => v === text.toUpperCase())
      || PascalTokenType.Identifier;
    
    return this;
  }
}

export class PascalStringToken extends PascalToken<string> {
  protected async _extract(): Promise<this> { 
    let currentCharacter = await this._currentCharacter();
    if (currentCharacter !== '\'') {
      throw new UnexpectedTokenError(this);
    }

    let text = currentCharacter;
    let atEndOfString = false;
    while (!atEndOfString) {
      text += currentCharacter = await this._nextCharacter();

      if (currentCharacter === Source.EOF) {
        throw new UnexpectedEofError(this);
      }

      if (currentCharacter === '\'') {
        const nextCharacter = await this._nextCharacter();
        atEndOfString = nextCharacter !== '\'';
        if (!atEndOfString) {
          text += nextCharacter;
        }
      }
    }

    this._type = PascalTokenType.String;
    this._text = text;
    this._value = text.slice(1, -1);

    return this;
  }
}
