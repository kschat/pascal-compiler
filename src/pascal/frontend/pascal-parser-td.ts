import { Parser } from '../../framework/frontend';
import { MessageType } from '../../framework/message/message-emitter';
import { PerformanceTimer } from '../../framework/utility';
import { EofToken, PascalToken, PascalErrorToken } from './tokens';
import { PascalTokenType } from './token-type';
import { PascalErrorHandler } from './error-handler';

import {
  PascalError,
  UnexpectedTokenError,
  MissingDotError,
  MissingBeginError,
  MissingEndError,
  MissingIdentifierError,
  MissingColonEqualsError
} from './errors';

import {
  LookupScope,
  IntermediateCodeNode,
  createIntermediateCodeNode,
  GenericIntermediateCodeType as ICodeType,
  IntermediateCode,
  IntermediateCodeKey
} from '../../framework/intermediate';

export class PascalParserTd extends Parser<PascalToken> {
  private readonly _TIMER = new PerformanceTimer();
  // TODO make static
  protected readonly _ERROR_HANDLER = new PascalErrorHandler();

  public async parse(): Promise<IntermediateCode> {
    this._TIMER.start();

    let token = await this._tryNextToken();
    if (token.type === PascalTokenType.Begin) {
      this.intermediateCode.root = await new StatementParser(this._scanner).parseNode();

      token = this.currentToken();
      if (token.type !== PascalTokenType.Dot) {
        this._ERROR_HANDLER.flag(token, new MissingDotError(), this);
      }
    }
    else {
      this._ERROR_HANDLER.flag(token, new UnexpectedTokenError(), this);
    }

    this.sendMessage({
      type: MessageType.ParserSummary,
      lineNumber: token.lineNumber,
      errorCount: this.getErrorCount(),
      elapsedMilliseconds: this._TIMER.elaspedMilliseconds()
    });

    this._TIMER.stop();

    return this.intermediateCode;
  }

  public getErrorCount(): number {
    return this._ERROR_HANDLER.errorCount;
  }

  protected async _tryNextToken(): Promise<PascalToken> {
    const token = await this.nextToken().catch((error: Error) => {
      if (!(error instanceof PascalError) || !error.token) {
        throw error;
      }

      const errorToken = PascalErrorToken.convertToken(error.token, error);
      this._ERROR_HANDLER.flag(errorToken, errorToken.value, this);
      return errorToken;
    });

    // TODO move message sending and symbol table entry logic elsewhere
    if (token.type !== PascalTokenType.Error) {
      this.sendMessage({
        type: MessageType.Token,
        tokenType: token.type,
        lineNumber: token.lineNumber,
        position: token.position,
        text: token.text,
        value: token.value
      });
    }

    if (token.type === PascalTokenType.Identifier) {
      const name = token.text.toLowerCase();
      const symbolEntry = this.symbolTableStack.lookupOrEnter(name, {
        scope: LookupScope.All
      });

      symbolEntry.appendLineNumber(token.lineNumber);
    }

    return token;
  }
}

export class StatementParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    const token = this.currentToken();

    switch (token.type) {
    case PascalTokenType.Begin:
      return await new CompoundStatementParser(this._scanner).parseNode();

    case PascalTokenType.Identifier:
      return await new AssignmentStatementParser(this._scanner).parseNode();

    default:
      await this._tryNextToken();
      return createIntermediateCodeNode(ICodeType.Noop);
    }
  }

  public async parseList(): Promise<IntermediateCodeNode[]> {
    let list = [await this.parseNode()];
    let token = this.currentToken();

    while (token.type === PascalTokenType.Semicolon) {
      await this._tryNextToken();
      list = list.concat(await this.parseList());
      token = this.currentToken();
    }

    return list;
  }
}

export class CompoundStatementParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    const node = createIntermediateCodeNode(ICodeType.Compound);
    let token = this.currentToken();
    if (token.type !== PascalTokenType.Begin) {
      this._ERROR_HANDLER.flag(token, new MissingBeginError(), this);
    }

    await this._tryNextToken();
    const children = await new StatementParser(this._scanner).parseList();
    children.forEach((child) => node.addChild(child));

    token = this.currentToken();
    if (token.type !== PascalTokenType.End) {
      this._ERROR_HANDLER.flag(token, new MissingEndError(), this);
      return node;
    }

    await this._tryNextToken();
    return node;
  }
}

export class AssignmentStatementParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    const node = createIntermediateCodeNode(ICodeType.Assign);
    let token = this.currentToken();

    if (token.type !== PascalTokenType.Identifier) {
      this._ERROR_HANDLER.flag(token, new MissingIdentifierError(), this);
    }

    const varNode = createIntermediateCodeNode(ICodeType.Variable);
    varNode.setAttribute(IntermediateCodeKey.Name, token.text);
    node.addChild(varNode);

    token = await this._tryNextToken();
    if (token.type !== PascalTokenType.ColonEquals) {
      this._ERROR_HANDLER.flag(token, new MissingColonEqualsError(), this);
    }

    const expression = await new ExpressionParser(this._scanner).parseNode();
    node.addChild(expression);

    return node;
  }
}

// TODO implement expression parsing
export class ExpressionParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    while ((await this._tryNextToken()).type !== PascalTokenType.Semicolon) { }
    return createIntermediateCodeNode(ICodeType.Noop);
  }
}
