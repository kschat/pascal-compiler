import { Source } from './source';

export class Token<T = string, V = undefined> {
  protected _type: T;
  protected _text: string;
  protected _value?: V;
  public readonly lineNumber: number = this._source.lineNumber;
  public readonly position: number = this._source.currentPosition;

  constructor(protected _source: Source) { }

  public async init(): Promise<this> {
    await this.extract();
    return this;
  }

  public get value(): V | undefined {
    return this._value;
  }

  public get text(): string {
    return this._text;
  }

  public get type(): T {
    return this._type;
  }

  protected async extract(): Promise<void> {
    this._text = await this._currentCharacter();
    this._value = undefined;
    this._nextCharacter();
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
