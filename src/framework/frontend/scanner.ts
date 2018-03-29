import { Source } from './source';
import { Token } from './token';

abstract class Scanner<T extends Token> {
  private _currentToken: T;

  constructor(protected _source: Source) { }

  public currentToken(): T {
    return this._currentToken;
  }

  public async nextToken(): Promise<T> {
    return this._currentToken = await this._extractToken();
  }

  public async currentCharacter(): Promise<string> {
    return await this._source.currentChararacter();
  }

  public async nextCharacter(): Promise<string> {
    return await this._source.nextCharacter();
  }

  protected abstract async _extractToken(): Promise<T>;
}

export { Scanner };
