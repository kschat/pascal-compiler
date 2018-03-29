import { CodeGenerator } from "./code-generator";
import { Executor } from "./executor";

export enum BackendOperation {
  Compile = 'COMPILE',
  Execute = 'EXECUTE'
}

export const createBackend = (operation: BackendOperation) => {
  switch (operation) {
    case BackendOperation.Compile: return new CodeGenerator();
    case BackendOperation.Execute: return new Executor();
    default: throw new Error(`Invalid operation: ${operation}`);
  }
};
