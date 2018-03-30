import { resolve as pResolve } from 'path';
import * as yargs from 'yargs';
import { createReadStream } from 'fs';
import { merge } from 'lodash';
import * as Table from 'cli-table2';

import { BackendOperation, createBackend } from './backend/backend-factory';
import { Backend } from '../framework/backend';
import { Parser, Source } from '../framework/frontend';
import { IntermediateCode, SymbolTable } from '../framework/intermediate';
import { BufferedReader } from '../framework/utility';
import { createParser, ParserLanguage, ParserType } from './frontend/frontend-factory';
import { MessageType, MessageTypes } from '../framework/message/message-emitter';
import { SyntaxErrorMessage } from '../framework/message/messages';

import { 
  ParserSummaryMessage, 
  InterpreterSummaryMessage, 
  CompilerSummaryMessage, 
  SourceLineMessage, 
  TokenMessage 
} from '../framework/message/messages';

const TABLE_CONFIG: Table.TableConstructorOptions = {
  chars: {
    top: '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    bottom: '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    left: '',
    'left-mid': '',
    mid: '',
    'mid-mid': '',
    right: '',
    'right-mid': '',
    middle: '   '
  },
  style: {
    'padding-left': 0,
    'padding-right': 0
  }
};

const formatParserSummary = (message: ParserSummaryMessage) => {
  const seconds = (message.elapsedMilliseconds / 1000).toFixed(2);
  const table = new Table(TABLE_CONFIG) as Table.HorizontalTable;
  table.push(
    [{ colSpan: 2, content: '\nPARSER SUMMARY' }],
    [message.lineNumber, 'source lines.'],
    [message.errorCount, 'syntax errors.'],
    [seconds, 'seconds total parsing time.']
  );

  return String(table);
};

const formatInterpreterSummary = (message: InterpreterSummaryMessage) => {
  const seconds = (message.elapsedMilliseconds / 1000).toFixed(2);
  const table = new Table(TABLE_CONFIG) as Table.HorizontalTable;
  table.push(
    [{ colSpan: 2, content: '\nINTERPRETER SUMMARY' }],
    [message.executionCount, 'statements executed.'],
    [message.runtimeErrors, 'runtime errors.'],
    [seconds, 'seconds total execution time.']
  );

  return String(table);
};

const formatCompilerSummary = (message: CompilerSummaryMessage) => {
  const seconds = (message.elapsedMilliseconds / 1000).toFixed(2);
  const table = new Table(TABLE_CONFIG) as Table.HorizontalTable;
  table.push(
    [{ colSpan: 2, content: '\nCOMPILER SUMMARY' }],
    [message.instructionCount, 'instructions generated.'],
    [seconds, 'seconds total code generation time.']
  );

  return String(table);
};

const formatSourceLine = (message: SourceLineMessage) => {
  const config = merge({}, TABLE_CONFIG, { colWidths: [4, null] });
  const table = new Table(config) as Table.HorizontalTable;
  table.push(
    [String(message.lineNumber), message.line.replace(/\n$/, '')]
  );

  return String(table);
};

const formatToken = (message: TokenMessage) => {
  const config = merge({}, TABLE_CONFIG, { colWidths: [15, null] });
  const table = new Table(config) as Table.HorizontalTable;
  table.push([
    `>>> ${message.tokenType}`, 
    `line=${message.lineNumber}, pos=${message.position}, text=${message.text}`
  ]);

  if (message.value) {
    table.push(['>>>', `value=${message.value}`]);
  }

  return String(table);
};

const formatSyntaxError = (message: SyntaxErrorMessage) => {
  const text = message.text ? `[at "${message.text}"]` : '';
  const config = merge({}, TABLE_CONFIG, { colWidths: [4, null] });
  const table = new Table(config) as Table.HorizontalTable;
  table.push(
    ['', `${'-'.repeat(Math.max(message.position - 1, 0))}^`],
    ['***', `${message.errorMessage} ${text}`]
  );

  return String(table);
};

interface PascalFlags {
  readonly intermediate: boolean;
  readonly crossReference: boolean;
}

class Pascal {
  private _parser: Parser;
  private _source: Source;
  private _intermediateCode?: IntermediateCode;
  private _symbolTable?: SymbolTable;
  private _backend: Backend;

  constructor(operation: BackendOperation, path: string, flags: PascalFlags) {
    this._source = new Source(new BufferedReader(createReadStream(path)));
    this._source.addMessageListener(this._messageHandler);

    this._parser = createParser(ParserLanguage.Pascal, ParserType.TopDown, this._source);
    this._parser.addMessageListener(this._messageHandler);

    this._backend = createBackend(operation);
    this._backend.addMessageListener(this._messageHandler);
  }

  public async run(): Promise<void> {
    await this._parser.parse();
    this._source.close();
    this._intermediateCode = this._parser.intermediateCode;
    this._symbolTable = this._parser.symbolTable;
    this._backend.process(this._intermediateCode as IntermediateCode, this._symbolTable as SymbolTable);
  }

  private _messageHandler(message: MessageTypes): void {
    switch (message.type) {
      case MessageType.SourceLine:
        return console.log(formatSourceLine(message));

      case MessageType.ParserSummary:
        return console.log(formatParserSummary(message));

      case MessageType.InterpreterSummary:
        return console.log(formatInterpreterSummary(message));

      case MessageType.CompilerSummary:
        return console.log(formatCompilerSummary(message));
      
      case MessageType.Token:
        return console.log(formatToken(message));

      case MessageType.SyntaxError:
        return console.log(formatSyntaxError(message));
    }
  }
}

const positionalPath = (yargs: yargs.Argv) => yargs.positional('path', {
  describe: 'Path to the source file',
  type: 'string',
  coerce: pResolve
});

const argv = yargs
  .command({
    command: 'compile <path>',
    describe: 'Compile source',
    builder: () => positionalPath(yargs),
    handler: (argv) => {
      argv.operation = BackendOperation.Compile;
    }
  })
  .command({
    command: 'execute <path>',
    describe: 'Execute source',
    builder: () => positionalPath(yargs),
    handler: (argv) => {
      argv.operation = BackendOperation.Execute;
    }
  })
  .demandCommand(1, 1, 'Expected $1 but got $0', 'Only one command allowed')
  .option('intermediate', {
    alias: 'i',
    type: 'boolean',
    default: false,
    global: true
  })
  .option('cross-reference', {
    alias: 'x',
    type: 'boolean',
    default: false,
    global: true
  })
  .strict()
  .argv;

new Pascal(argv.operation, argv.path, {
  intermediate: argv.intermediate,
  crossReference: argv.crossReference
}).run();
