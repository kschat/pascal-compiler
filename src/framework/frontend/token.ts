import { Source } from './source';

export class Token<T = string, V = {}> {
  protected _type: T;
  protected _text: string;
  protected _value: V;
  public readonly lineNumber: number = this._source.lineNumber;
  public readonly position: number = this._source.currentPosition;

  constructor(protected _source: Source) { }

  public async build(): Promise<this> {
    return await this._extract();
  }

  public get value(): V {
    return this._value;
  }

  public get text(): string {
    return this._text;
  }

  public get type(): T {
    return this._type;
  }

  public get source (): Source {
    return this._source;
  }

  protected async _extract(): Promise<this> {
    this._text = await this._currentCharacter();
    await this._nextCharacter();
    return this;
  }

  protected async _currentCharacter(): Promise<string> {
    return await this._source.currentChararacter();
  }

  protected async _nextCharacter(): Promise<string> {
    return await this._source.nextCharacter();
  }

  protected async _peekCharacter(): Promise<string> {
    return await this._source.peekCharacter();
  }
}
