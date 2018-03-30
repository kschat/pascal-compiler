import {
  flowRight as compose,
  upperFirst,
  camelCase,
  reduce,
  isSafeInteger,
  isFinite
} from 'lodash';

import { PascalTokenType, RESERVED_WORDS, SYMBOLS } from './token-type';
import { Token, Source } from '../../framework/frontend';
import { RangeRealError } from './errors';

import {
  PascalError,
  UnexpectedTokenError,
  UnexpectedEofError,
  UnrecognizableError,
  InvalidNumberError,
  RangeIntegerError
} from './errors';

export const LETTER = /[a-z]/i;
export const LETTER_OR_DIGIT = /(?:[a-z]|\d)+/i;
export const DIGIT = /[0-9]/;
export const EXPONENT = /e/i;
export const NUMBER_SIGN = /\+|\-/;

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

export class PascalSymbolToken extends PascalToken {
  protected async _extract(): Promise<this> {
    const currentCharacter = await this._currentCharacter();
    if (!SYMBOLS.find((v) => v.startsWith(currentCharacter))) {
      throw new UnexpectedTokenError(this);
    }

    const twoCharacterSymbol = `${currentCharacter}${await this._nextCharacter()}`;
    this._text = await (async () => {
      switch (twoCharacterSymbol) {
      case PascalTokenType.DotDot:
      case PascalTokenType.ColonEquals:
      case PascalTokenType.LessEquals:
      case PascalTokenType.NotEquals:
      case PascalTokenType.GreaterEquals:
        await this._nextCharacter();
        return twoCharacterSymbol;

      default:
        return currentCharacter;
      }
    })();

    const type = SYMBOLS.find((v) => v === this._text);
    if (!type) {
      throw new UnrecognizableError(this);
    }

    this._type = type;

    return this;
  }
}

export class PascalNumberToken extends PascalToken<number> {
  // TODO clean up
  protected async _extract(): Promise<this> {
    let currentCharacter = await this._currentCharacter();
    if (!DIGIT.test(currentCharacter)) {
      throw new UnexpectedTokenError(this);
    }

    let wholeDigits = '';
    let fractionDigits = '';
    let exponentDigits = '';
    let sign = '+';

    let text = wholeDigits = await this._extractUnsignedInteger();
    let type = PascalTokenType.Integer;

    currentCharacter = await this._currentCharacter();
    if (currentCharacter === '.') {
      const nextCharacter = await this._peekCharacter();
      if (nextCharacter === '.') {
        this._type = type;
        this._text = text;
        this._value = this._computeIntegerValue(this._text);
        return this;
      }

      if (DIGIT.test(nextCharacter)) {
        await this._nextCharacter();
        type = PascalTokenType.Real;
        fractionDigits = await this._extractUnsignedInteger();
        text += `.${fractionDigits}`;
        currentCharacter = await this._currentCharacter();
      }
    }

    if (EXPONENT.test(currentCharacter)) {
      type = PascalTokenType.Real;
      text += currentCharacter;

      currentCharacter = await this._nextCharacter();
      if (NUMBER_SIGN.test(currentCharacter)) {
        text += sign = currentCharacter;
        currentCharacter = await this._nextCharacter();
      }

      if (!DIGIT.test(currentCharacter)) {
        throw new InvalidNumberError(this);
      }

      text += exponentDigits = await this._extractUnsignedInteger();
    }

    this._type = type;
    this._text = text;
    this._value = this._type === PascalTokenType.Real
      ? this._computeFloatValue(wholeDigits, fractionDigits, exponentDigits, sign)
      : this._computeIntegerValue(this._text);

    return this;
  }

  private async _extractUnsignedInteger(): Promise<string> {
    let currentCharacter = await this._currentCharacter();
    let unsignedInteger = currentCharacter;

    while (DIGIT.test(currentCharacter = await this._nextCharacter())) {
      unsignedInteger += currentCharacter;
    }

    return unsignedInteger;
  }

  private _computeIntegerValue(digits: string): number {
    const integerValue = reduce(digits, (acc, digit) => {
      return 10 * acc + Number(digit);
    }, 0);

    if (!isSafeInteger(integerValue)) {
      throw new RangeIntegerError(this);
    }

    return integerValue;
  }

  private _computeFloatValue(
    wholeDigits: string,
    fractionDigits: string,
    exponentDigits: string,
    sign: string
  ): number {
    let digits = wholeDigits;
    let exponentValue = this._computeIntegerValue(exponentDigits);
    if (sign === '-') {
      exponentValue = -exponentValue;
    }

    exponentValue -= fractionDigits.length;
    digits += fractionDigits;

    let floatValue = reduce(digits, (acc, digit) => {
      return 10 * acc + Number(digit);
    }, 0);

    if (exponentValue !== 0) {
      floatValue *= Math.pow(10, exponentValue);
    }

    // TODO properly detect over/under flow
    if (!isFinite(floatValue)) {
      throw new RangeRealError(this);
    }

    return floatValue;
  }
}
