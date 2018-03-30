import { PascalToken } from './tokens';

type ConstructorFunction<T = {}> = new (...args: any[]) => T;

export class PascalError extends Error {
  constructor (
    public message: string,
    public status: number = 0,
    public token?: PascalToken
  ) {
    super(message);
   }
}

type PascalErrorClass = new (_token?: PascalToken) => PascalError;

const createPascalError = (message: string, status?: number): PascalErrorClass => {
  return class extends PascalError {
    constructor (_token?: PascalToken) {
      super(message, status, _token);
    }
  };
};

export const AlreadyForwardedError = createPascalError('Already specified in FORWARD');
export const IdentifierRedefinedError = createPascalError('Redefined identifier');
export const IdentifierUndefinedError = createPascalError('Undefined identifier');
export const IncompatibleAssignmentError = createPascalError('Incompatible assignments');
export const IncompatibleTypesError = createPascalError('Incompatible types');
export const InvalidAssignmentError = createPascalError('Invalid assignment statement');
export const InvalidCharacterError = createPascalError('Invalid character');
export const InvalidConstantError = createPascalError('Invalid constant');
export const InvalidExponentError = createPascalError('Invalid exponent');
export const InvalidExpressionError = createPascalError('Invalid expression');
export const InvalidFieldError = createPascalError('Invalid field');
export const InvalidFractionError = createPascalError('Invalid fraction');
export const InvalidIdentifierUsageError = createPascalError('Invalid identifier usage');
export const InvalidIndexTypeError = createPascalError('Invalid index type');
export const InvalidNumberError = createPascalError('Invalid number');
export const InvalidStatementError = createPascalError('Invalid statement');
export const InvalidSubrangeTypeError = createPascalError('Invalid subrange type');
export const InvalidTargetError = createPascalError('Invalid assignment target');
export const InvalidTypeError = createPascalError('Invalid type');
export const InvalidVarParamError = createPascalError('Invalid VAR parameter');
export const MinGtMaxError = createPascalError('Min limit greater than max limit');
export const MissingBeginError = createPascalError('Missing BEGIN');
export const MissingColonError = createPascalError('Missing :');
export const MissingColonEqualsError = createPascalError('Missing :=');
export const MissingCommaError = createPascalError('Missing ,');
export const MissingConstantError = createPascalError('Missing constant');
export const MissingDoError = createPascalError('Missing DO');
export const MissingDotDotError = createPascalError('Missing ..');
export const MissingEndError = createPascalError('Missing END');
export const MissingEqualsError = createPascalError('Missing =');
export const MissingForControlError = createPascalError('Invalid FOR control variable');
export const MissingIdentifierError = createPascalError('Missing identifier');
export const MissingLeftBracketError = createPascalError('Missing [');
export const MissingRightBracketError = createPascalError('Missing ]');
export const MissingOfError = createPascalError('Missing OF');
export const MissingDotError = createPascalError('Missing .');
export const MissingProgramError = createPascalError('Missing PROGRAM');
export const MissingRightParenError = createPascalError('Missing )');
export const MissingSemicolonError = createPascalError('Missing ;');
export const MissingThenError = createPascalError('Missing THEN');
export const MissingToDowntoError = createPascalError('Missing TO or DOWNTO');
export const MissingUntilError = createPascalError('Missing UNTIL');
export const MissingVariableError = createPascalError('Missing variable');
export const CaseConstantReusedError = createPascalError('CASE constant reused');
export const NotConstantIdentifierError = createPascalError('Not a constant identifier');
export const NotRecordVariableError = createPascalError('Not a record variable');
export const NotTypeIdentifierError = createPascalError('Not a type identifier');
export const RangeIntegerError = createPascalError('Integer literal out of range');
export const RangeRealError = createPascalError('Real literal out of range');
export const StackOverflowError = createPascalError('Stack overflow');
export const TooManyLevelsError = createPascalError('Nesting level too deep');
export const TooManySubscriptsError = createPascalError('Too many subscripts');
export const UnexpectedEofError = createPascalError('Unexpected end of file');
export const UnexpectedTokenError = createPascalError('Unexpected token');
export const UnimplementedError = createPascalError('Unimplemented feature');
export const UnrecognizableError = createPascalError('Unrecognizable input');
export const WrongNumberOfParamsError = createPascalError('Wrong number of actual parameters');

// Fatal errors
export const IoError = createPascalError('Object I/O error', -101);
export const TooManyErrorsError = createPascalError('Too many syntax errors', -102);
