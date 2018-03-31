import { MessageEmitter, MessageHandler, MessageListener, MessageTypes } from '../message/message-emitter';
import { SymbolTableStack, IntermediateCode, createSymbolTableStack, createIntermediateCode } from '../intermediate';
import { Scanner } from './scanner';
import { Token } from './token';

export abstract class Parser<T extends Token = Token> implements MessageEmitter {
  // Ideally we use DI instead of making these static...
  protected static _symbolTableStack: SymbolTableStack = createSymbolTableStack();
  protected static _intermediateCode: IntermediateCode = createIntermediateCode();
  protected static _messageHandler: MessageHandler = new MessageHandler();

  constructor(protected _scanner: Scanner<T>) { }

  public get intermediateCode(): IntermediateCode {
    return Parser._intermediateCode;
  }

  public get symbolTableStack(): SymbolTableStack {
    return Parser._symbolTableStack;
  }

  public abstract async parse(): Promise<IntermediateCode>;

  public abstract getErrorCount(): number;

  public currentToken(): T {
    return this._scanner.currentToken();
  }

  public async nextToken(): Promise<T> {
    return await this._scanner.nextToken();
  }

  public addMessageListener(listener: MessageListener): void {
    Parser._messageHandler.addListener(listener);
  }

  public removeMessageListener(listener: MessageListener): void {
    Parser._messageHandler.removeListener(listener);
  }

  public sendMessage(message: MessageTypes): void {
    Parser._messageHandler.sendMessage(message);
  }
}
