import { ReadLine, createInterface } from 'readline';
import { isEmpty } from 'lodash';

export class BufferedReader {
  private static readonly BUFFER_SIZE: number = 10;

  private _reader: ReadLine;
  private _currentLine?: string = undefined;
  private _bufferedLines: string[] = [];
  private _closed: boolean = false;

  constructor(private readonly _inputStream: NodeJS.ReadableStream) { }

  public async readLine(): Promise<string | undefined> {
    if (!isEmpty(this._bufferedLines)) {
      return this._popLine();
    }

    if (this._closed) {
      return undefined;
    }

    this._reader = this._reader || this._constructReader(this._inputStream);
    return await new Promise<string>((resolve) => {
      this._reader.once('pause', () => resolve(this._popLine()));
      this._reader.resume();
    });
  }

  public close(): void {
    this._reader.close();
  }

  private _popLine(): string {
    return `${this._bufferedLines.splice(0, 1)[0]}\n`;
  }

  private _constructReader(_inputStream: NodeJS.ReadableStream): ReadLine {
    const reader = createInterface({
      input: _inputStream,
      terminal: false,
      historySize: 0
    });

    reader.on('line', (line) => {
      this._bufferedLines.push(line);
      if (this._bufferedLines.length >= BufferedReader.BUFFER_SIZE) {
        reader.pause();
      }
    });

    reader.on('close', () => this._closed = true);

    return reader;
  }

}
