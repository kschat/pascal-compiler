import { sortBy } from 'lodash';

export interface SymbolTableStack {
  readonly currentNestingLevel: number;
  readonly localSymbolTable: SymbolTable;
  enterLocal(name: string): SymbolTableEntry;
  lookupLocal(name: string): SymbolTableEntry | undefined;
  lookup(name: string): SymbolTableEntry | undefined;
}

export interface SymbolTable {
  readonly nestingLevel: number;
  readonly sortedEntries: SymbolTableEntry[];
  enter(name: string): SymbolTableEntry;
  lookup(name: string): SymbolTableEntry | undefined;
}

export interface SymbolTableEntry {
  readonly name: string;
  readonly symbolTable: SymbolTable;
  readonly lineNumbers: number[];
  appendLineNumber(lineNumber: number): number[];
  setAttribute<T extends {}>(key: SymbolTableKey, attribute: T): T;
  getAttribute(key: SymbolTableKey): {} | undefined;
}

export interface SymbolTableKey { }

export class GenericSymbolTableStack implements SymbolTableStack {
  private _currentNestingLevel: number = 0;
  private _stack: SymbolTable[] = [
    createSymbolTable(this._currentNestingLevel)
  ];

  public get currentNestingLevel(): number {
    return this._currentNestingLevel;
  }

  public get localSymbolTable(): SymbolTable {
    const symbolTable = this._stack[this.currentNestingLevel];
    if (!symbolTable) {
      throw new Error('FATAL ERROR: I forgot how to implement a stack');
    }

    return symbolTable;
  }

  public enterLocal(name: string): SymbolTableEntry {
    return this.localSymbolTable.enter(name);
  }

  public lookupLocal(name: string): SymbolTableEntry | undefined {
    return this.localSymbolTable.lookup(name);
  }

  // TODO provide better implementation
  public lookup(name: string): SymbolTableEntry | undefined {
    let nestingLevel = this.currentNestingLevel;
    while (nestingLevel >= 0) {
      const entry = this._stack[nestingLevel].lookup(name);
      if (entry) {
        return entry;
      }

      nestingLevel += 1;
    }

    return undefined;
  }
}

export class GenericSymbolTable implements SymbolTable {
  private readonly _entries = new Map<string, SymbolTableEntry>();
  private _sortedEntries: SymbolTableEntry[] = [];
  private _sortedEntriesStale = false;

  constructor (public readonly nestingLevel: number) { }

  public get sortedEntries(): SymbolTableEntry[] {
    if (!this._sortedEntriesStale) {
      return this._sortedEntries;
    }

    this._sortedEntriesStale = false;
    return this._sortedEntries = sortBy([...this._entries.values()], 'name');
  }

  public enter(name: string): SymbolTableEntry {
    const entry = createSymbolTableEntry(name, this);
    const entriesSize = this._entries.size;
    this._entries.set(name, entry);
    this._sortedEntriesStale = entriesSize !== this._entries.size;

    return entry;
  }

  public lookup(name: string): SymbolTableEntry | undefined {
    return this._entries.get(name);
  }
}

export class GenericSymbolTableEntry implements SymbolTableEntry {
  public readonly lineNumbers: number[] = [];
  private readonly _attributes = new Map<SymbolTableKey, {}>();

  constructor (
    public readonly name: string,
    public readonly symbolTable: SymbolTable
  ) { }

  public appendLineNumber(lineNumber: number): number[] {
    this.lineNumbers.push(lineNumber);
    return this.lineNumbers;
  }

  public setAttribute<T extends {}>(key: SymbolTableKey, attribute: T): T {
    this._attributes.set(key, attribute);
    return attribute;
  }

  public getAttribute(key: SymbolTableKey): {} | undefined {
    return this._attributes.get(key);
  }
}

export const createSymbolTableStack = (): SymbolTableStack => {
  return new GenericSymbolTableStack();
};

export const createSymbolTable = (nestingLevel: number): SymbolTable => {
  return new GenericSymbolTable(nestingLevel);
};

export const createSymbolTableEntry = (name: string, symbolTable: SymbolTable): SymbolTableEntry => {
  return new GenericSymbolTableEntry(name, symbolTable);
};
