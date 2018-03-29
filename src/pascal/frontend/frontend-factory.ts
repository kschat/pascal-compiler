import { Source, Parser } from '../../framework/frontend';
import { PascalParserTd } from './pascal-parser-td';
import { PascalScanner } from './pascal-scanner';

export enum ParserLanguage {
  Pascal = 'PASCAL'
}

export enum ParserType {
  TopDown = 'TOP_DOWN'
}

export const createParser = (language: ParserLanguage, type: ParserType, source: Source): Parser => {
  if (language !== ParserLanguage.Pascal) {
    throw new Error(`Invalid language: ${language}`);
  }

  if (type !== ParserType.TopDown) {
    throw new Error(`Invalid type: ${type}`);
  }

  return new PascalParserTd(new PascalScanner(source));
};
