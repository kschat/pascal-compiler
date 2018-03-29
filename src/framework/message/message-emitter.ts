import { EventEmitter } from 'events';
import { MessageType, MessageTypes } from './messages';

export type ConstructorFunction<T = {}> = new (...args: any[]) => T;

export interface MessageListener {
  (message: MessageTypes): void;
}

export interface MessageEmitter {
  addMessageListener(listener: MessageListener): void;
  removeMessageListener(listener: MessageListener): void;
  sendMessage(message: MessageTypes): void;
}

export class MessageHandler {
  private readonly _eventName: symbol = Symbol('MessageHandler event name');
  private _emitter: EventEmitter = new EventEmitter();

  constructor() { }

  addListener(listener: MessageListener): this {
    this._emitter.addListener(this._eventName, listener);
    return this;
  }

  removeListener(listener: MessageListener): this {
    this._emitter.removeListener(this._eventName, listener);
    return this;
  }

  public sendMessage(message: MessageTypes): this {
    this._emitter.emit(this._eventName, message);
    return this;
  }
}

export { MessageType, MessageTypes };
