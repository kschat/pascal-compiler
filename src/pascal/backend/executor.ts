import { Backend } from '../../framework/backend';
import { SymbolTable, IntermediateCode } from '../../framework/intermediate';
import { MessageType } from '../../framework/message/messages';

class Executor extends Backend {
  public process(iCode: IntermediateCode, symbolTable: SymbolTable): void {
    this._TIMER.start();
    const executionCount = 0;
    const runtimeErrors = 0;

    this.sendMessage({
      executionCount,
      runtimeErrors,
      type: MessageType.InterpreterSummary,
      elapsedMilliseconds: this._TIMER.elaspedMilliseconds()
    });
    this._TIMER.stop();
  }
}

export { Executor };
