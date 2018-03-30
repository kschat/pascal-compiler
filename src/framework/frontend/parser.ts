import { MessageEmitter, MessageHandler, MessageListener, MessageTypes } from '../message/message-emitter';
import { SymbolTableStack, IntermediateCode, createSymbolTableStack } from '../intermediate';
import { Scanner } from './scanner';
import { Token } from './token';

export abstract class Parser<T extends Token = Token> implements MessageEmitter {
  protected _symbolTableStack: SymbolTableStack = createSymbolTableStack();
  protected _messageHandler: MessageHandler = new MessageHandler();
  protected _intermediateCode?: IntermediateCode = undefined;

  constructor(protected _scanner: Scanner<T>) { }

  public get intermediateCode(): IntermediateCode | undefined {
    return this._intermediateCode;
  }

  public get symbolTableStack(): SymbolTableStack {
    return this._symbolTableStack;
  }

  public abstract async parse(): Promise<void>;

  public abstract getErrorCount(): number;

  public currentToken(): T {
    return this._scanner.currentToken();
  }

  public async nextToken(): Promise<T> {
    return await this._scanner.nextToken();
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
