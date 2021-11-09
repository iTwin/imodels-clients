import { OperationsBaseOptions } from "../base/OperationsBase";
import { iModelsApiUrlFormatter } from "./iModelsApiUrlFormatter";

export interface OperationOptions extends OperationsBaseOptions {
  urlFormatter: iModelsApiUrlFormatter;
}
