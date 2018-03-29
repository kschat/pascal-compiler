import { BufferedReader } from '../utility';
import { MessageEmitter, MessageHandler, MessageListener, MessageTypes, MessageType } from '../message/message-emitter';

class Source {
  public static readonly EOL: string = '\n';
  public static readonly EOF: string = '';

  public lineNumber: number = 0;
  public currentPosition: number = -2;

  private _line?: string;

  protected _messageHandler: MessageHandler = new MessageHandler();

  constructor(private readonly _reader: BufferedReader) { }

  public async currentChararacter(): Promise<string> {
    if (this.currentPosition === -2) {
      await this._readLine();
      return await this.nextCharacter();
    }
    else if (this._line === undefined) {
      return Source.EOF;
    }
    else if (this.currentPosition === -1 || this.currentPosition === this._line.length) {
      return Source.EOL;
    }
    else if (this.currentPosition > this._line.length) {
      await this._readLine();
      return await this.nextCharacter();
    }
    else {
      return this._line.charAt(this.currentPosition);
    }
  }

  public async nextCharacter(): Promise<string> {
    this.currentPosition += 1;
    return await this.currentChararacter();
  }

  public async peekCharacter(): Promise<string> {
    await this.currentChararacter();
    if (this._line === undefined) {
      return Source.EOF;
    }

    const nextPosition = this.currentPosition + 1;
    return nextPosition < this._line.length
      ? this._line.charAt(nextPosition)
      : Source.EOL;
  }

  public close(): void {
    return this._reader.close();
  }

  private async _readLine(): Promise<string> {
    this._line = await this._reader.readLine();
    this.currentPosition = -1;
    if (this._line === undefined) {
      return Source.EOF;
    }

    this.lineNumber += 1;
    this.sendMessage({
      type: MessageType.SourceLine,
      lineNumber: this.lineNumber,
      line: this._line
    });

    return this._line;
  }

  public addMessageListener(listener: MessageListener): void {
    this._messageHandler.addListener(listener);
  }

  public removeMessageListener(listener: MessageListener): void {
    this._messageHandler.removeListener(listener);
  }

  public sendMessage(message: MessageTypes): void {
    this._messageHandler.sendMessage(message);
  }
}

export { Source };
