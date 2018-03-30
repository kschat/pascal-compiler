import { Backend } from '../../framework/backend';
import { SymbolTableStack, IntermediateCode } from '../../framework/intermediate';
import { MessageType } from '../../framework/message/messages';

class CodeGenerator extends Backend {
  public process(iCode: IntermediateCode, symbolTableStack: SymbolTableStack): void {
    this._TIMER.start();
    const instructionCount = 0;

    this.sendMessage({
      instructionCount,
      type: MessageType.CompilerSummary,
      elapsedMilliseconds: this._TIMER.elaspedMilliseconds()
    });
    this._TIMER.stop();
  }
}

export { CodeGenerator };
