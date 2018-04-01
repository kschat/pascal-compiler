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
  MissingColonEqualsError,
  MissingRightParenError,
  MissingSemicolonError,
  UnexpectedEofError
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

    return token;
  }
}

export class StatementParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    const token = this.currentToken();

    const statementNode = await (async () => {
      switch (token.type) {
      case PascalTokenType.Begin:
        return await new CompoundStatementParser(this._scanner).parseNode();

      case PascalTokenType.Identifier:
        return await new AssignmentStatementParser(this._scanner).parseNode();

      default:
        await this._tryNextToken();
        return createIntermediateCodeNode(ICodeType.Noop);
      }
    })();

    statementNode.setAttribute(IntermediateCodeKey.Line, token.lineNumber);
    return statementNode;
  }

  public async parseList(terminator: PascalTokenType): Promise<IntermediateCodeNode[]> {
    let list = [await this.parseNode()];
    let token = this.currentToken();

    while (token.type !== terminator && token.type !== PascalTokenType.EndOfFile) {
      if (token.type === PascalTokenType.Semicolon) {
        await this._tryNextToken();
      }
      else {
        this._ERROR_HANDLER.flag(token, new MissingSemicolonError(), this);
      }

      list = list.concat(await this.parseNode());
      token = this.currentToken();
    }

    if (token.type === PascalTokenType.EndOfFile) {
      this._ERROR_HANDLER.flag(token, new UnexpectedEofError(), this);
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
    const children = await new StatementParser(this._scanner).parseList(PascalTokenType.End);
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

    const symbolEntry = this.symbolTableStack.lookupOrEnter(token.text.toLowerCase());
    symbolEntry.appendLineNumber(token.lineNumber);

    const varNode = createIntermediateCodeNode(ICodeType.Variable);
    varNode.setAttribute(IntermediateCodeKey.Id, symbolEntry);
    node.addChild(varNode);

    token = await this._tryNextToken();
    if (token.type === PascalTokenType.ColonEquals) {
      await this._tryNextToken();
    }
    else {
      this._ERROR_HANDLER.flag(token, new MissingColonEqualsError(), this);
    }

    const expression = await new ExpressionParser(this._scanner).parseNode();
    node.addChild(expression);

    return node;
  }
}

export class ExpressionParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    const simpleExpressionParser = new SimpleExpressionParser(this._scanner);
    const simpleExpressionNode = await simpleExpressionParser.parseNode();
    let operatorType = this._extractOperatorType(this.currentToken());

    if (!operatorType) {
      return simpleExpressionNode;
    }

    await this._tryNextToken();
    const expressionNode = createIntermediateCodeNode(operatorType);
    expressionNode.addChild(simpleExpressionNode);
    expressionNode.addChild(await simpleExpressionParser.parseNode());

    return expressionNode;
  }

  private _extractOperatorType(token: PascalToken) {
    switch (token.type) {
    case PascalTokenType.Equals: return ICodeType.Eq;
    case PascalTokenType.NotEquals: return ICodeType.Ne;
    case PascalTokenType.LessThan: return ICodeType.Lt;
    case PascalTokenType.LessEquals: return ICodeType.Le;
    case PascalTokenType.GreaterThan: return ICodeType.Gt;
    case PascalTokenType.GreaterEquals: return ICodeType.Ge;
    default: return undefined;
    }
  }
}

export class SimpleExpressionParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    const leadingSign = this._extractLeadingSign(this.currentToken());
    if (leadingSign) {
      await this._tryNextToken();
    }

    const termParser = new TermParser(this._scanner);
    const termNode = await termParser.parseNode();

    let operatorType = this._extractOperatorType(this.currentToken());
    if (!operatorType) {
      return termNode;
    }

    await this._tryNextToken();
    let simpleExpressionNode = createIntermediateCodeNode(operatorType);
    simpleExpressionNode.addChild(termNode);
    simpleExpressionNode.addChild(await termParser.parseNode());

    while (operatorType = this._extractOperatorType(this.currentToken())) {
      const temp = simpleExpressionNode;
      await this._tryNextToken();

      simpleExpressionNode = createIntermediateCodeNode(operatorType);
      simpleExpressionNode.addChild(temp);
      simpleExpressionNode.addChild(await termParser.parseNode());
    }

    return simpleExpressionNode;
  }

  private _extractOperatorType(token: PascalToken) {
    switch (token.type) {
    case PascalTokenType.Plus: return ICodeType.Add;
    case PascalTokenType.Minus: return ICodeType.Subtract;
    case PascalTokenType.Or: return ICodeType.Or;
    default: return undefined;
    }
  }

  private _extractLeadingSign(token: PascalToken) {
    switch (token.type) {
    case PascalTokenType.Plus: return ICodeType.Add;
    case PascalTokenType.Minus: return ICodeType.Subtract;
    default: return undefined;
    }
  }
}

export class TermParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    const factorParser = new FactorParser(this._scanner);
    const factorNode = await factorParser.parseNode();
    let operatorType = this._extractOperatorType(this.currentToken());

    if (!operatorType) {
      return factorNode;
    }

    await this._tryNextToken();
    let termNode = createIntermediateCodeNode(operatorType);
    termNode.addChild(factorNode);
    termNode.addChild(await factorParser.parseNode());

    while (operatorType = this._extractOperatorType(this.currentToken())) {
      const temp = termNode;
      await this._tryNextToken();

      termNode = createIntermediateCodeNode(operatorType);
      termNode.addChild(temp);
      termNode.addChild(await factorParser.parseNode());
    }

    return termNode;
  }

  private _extractOperatorType(token: PascalToken) {
    switch (token.type) {
    case PascalTokenType.Star: return ICodeType.Multiply;
    case PascalTokenType.Slash: return ICodeType.FloatDivide;
    case PascalTokenType.Div: return ICodeType.IntegerDivide;
    case PascalTokenType.Mod: return ICodeType.Mod;
    case PascalTokenType.And: return ICodeType.And;
    default: return undefined;
    }
  }
}

export class FactorParser extends PascalParserTd {
  public async parseNode(): Promise<IntermediateCodeNode> {
    let node = createIntermediateCodeNode(ICodeType.Noop);
    const token = this.currentToken();

    switch (token.type) {
    case PascalTokenType.Identifier:
      node = createIntermediateCodeNode(ICodeType.Variable);
      node.setAttribute(IntermediateCodeKey.Name, token.text);
      break;

    case PascalTokenType.Integer:
      node = createIntermediateCodeNode(ICodeType.IntegerConstant);
      node.setAttribute(IntermediateCodeKey.Value, token.value);
      break;

    case PascalTokenType.Real:
      node = createIntermediateCodeNode(ICodeType.RealConstant);
      node.setAttribute(IntermediateCodeKey.Value, token.value);
      break;

    case PascalTokenType.String:
      node = createIntermediateCodeNode(ICodeType.StringConstant);
      node.setAttribute(IntermediateCodeKey.Value, token.value);
      break;

    case PascalTokenType.Not:
      await this._tryNextToken();
      node = createIntermediateCodeNode(ICodeType.Not);
      node.addChild(await this.parseNode());
      break;

    case PascalTokenType.LeftParen:
      await this._tryNextToken();
      node = await new ExpressionParser(this._scanner).parseNode();
      if (this.currentToken().type !== PascalTokenType.RightParen) {
        this._ERROR_HANDLER.flag(token, new MissingRightParenError(), this);
      }
      break;

    default:
      this._ERROR_HANDLER.flag(token, new UnexpectedTokenError(), this);
      break;
    }

    await this._tryNextToken();
    return node;
  }
}
