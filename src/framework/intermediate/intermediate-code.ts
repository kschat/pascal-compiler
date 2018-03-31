import { values } from 'lodash';

export interface IntermediateCode {
  root: IntermediateCodeNode;
}

export interface IntermediateCodeNode {
  parent?: IntermediateCodeNode;
  readonly type: string;
  readonly children: IntermediateCodeNode[];
  addChild(child: IntermediateCodeNode): IntermediateCodeNode;
  setAttribute<U extends {}>(key: string, attribute: U): U;
  getAttribute(key: string): {} | undefined;
  copy(): IntermediateCodeNode;
}

export enum IntermediateCodeKey {
  Line = 'LINE',
  Id = 'ID',
  Value = 'VALUE',
}

export enum GenericIntermediateCodeType {
  // Program structure
  Program = 'PROGRAM',
  Procedure = 'PROCEDURE',
  Function = 'FUNCTION',

  // Statements
  Compound = 'COMPOUND',
  Assign = 'ASSIGN',
  Loop = 'LOOP',
  Test = 'TEST',
  Call = 'CALL',
  Parameters = 'PARAMETERS',
  If = 'IF',
  Select = 'SELECT',
  SelectBranch = 'SELECT_BRANCH',
  SelectConstants = 'SELECT_CONSTANTS',
  Noop = 'NOOP',

  // Relational operators
  Eq = 'EQ',
  Ne = 'NE',
  Lt = 'LT',
  Le = 'LE',
  Gt = 'GT',
  Ge = 'GE',
  Not = 'NOT',

  // Additive operators
  Add = 'ADD',
  Subtract = 'SUBTRACT',
  Or = 'OR',
  Negate = 'NEGATE',

  // Multiplicative operators
  Multiply = 'MULTIPLY',
  IntegerDivide = 'INTEGER_DIVIDE',
  FloatDivide = 'FLOAT_DIVIDE',
  Mod = 'MOD',
  And = 'AND',

  // Operands
  Variable = 'VARIABLE',
  Subscript = 'SUBSCRIPT',
  Field = 'FIELD',
  IntegerConstant = 'INTEGER_CONSTANT',
  RealConstant = 'REAL_CONSTANT',
  StringConstant = 'STRING_CONSTANT',
  BooleanConstant = 'BOOLEAN_CONSTANT',
}

class GenericIntermediateCode implements IntermediateCode {
  private _root: IntermediateCodeNode;

  public get root(): IntermediateCodeNode {
    return this._root;
  }

  public set root(value: IntermediateCodeNode) {
    this._root = value;
  }
}

class GenericIntermediateCodeNode implements IntermediateCodeNode {
  private _attributes = new Map<IntermediateCodeKey, {}>();
  private _children: IntermediateCodeNode[] = [];
  private _parent?: IntermediateCodeNode;

  constructor(public readonly type: GenericIntermediateCodeType) { }

  public get children(): IntermediateCodeNode[] {
    return this._children;
  }

  public set parent(value: IntermediateCodeNode | undefined) {
    this._parent = value;
  }

  public get parent(): IntermediateCodeNode | undefined {
    return this._parent;
  }

  public addChild(child: IntermediateCodeNode): IntermediateCodeNode {
    this._children.push(child);
    child.parent = this;
    return child;
  }

  public setAttribute<T extends {}>(key: IntermediateCodeKey, attribute: T): T {
    this._attributes.set(key, attribute);
    return attribute;
  }

  public getAttribute(key: IntermediateCodeKey): {} | undefined {
    return this._attributes.get(key);
  }

  public copy(): IntermediateCodeNode {
    const copy = createIntermediateCodeNode(this.type);
    copy.parent = this.parent;
    [...this._attributes.entries()].forEach(([key, value]) => {
      copy.setAttribute(key, value);
    });

    return copy;
  }
}

export const createIntermediateCode = (): IntermediateCode => {
  return new GenericIntermediateCode();
};

export const createIntermediateCodeNode = (type: GenericIntermediateCodeType): IntermediateCodeNode => {
  return new GenericIntermediateCodeNode(type);
};
