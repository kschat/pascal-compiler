import { MessageEmitter, MessageHandler, MessageListener, MessageTypes } from '../message/message-emitter';
import { SymbolTableStack, IntermediateCode } from '../intermediate';
import { PerformanceTimer } from '../utility';

abstract class Backend implements MessageEmitter {
  protected _symbolTableStack: SymbolTableStack;
  protected _intermediateCode?: IntermediateCode = undefined;
  protected _messageHandler: MessageHandler = new MessageHandler();
  protected readonly _TIMER = new PerformanceTimer();

  public abstract process(iCode: IntermediateCode, symbolTableStack: SymbolTableStack): void;

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

export { Backend };
