import { JzodObject, jzodToTsCode } from "@miroir-framework/jzod-ts";

import * as fs from "fs";
import { getLoggerName, LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { packageName, cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"Server");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export async function generateZodSchemaFileFromJzodSchema(
  jzodObject: JzodObject,
  targetFileName: string,
  jzodSchemaVariableName:string,
) {
  // log.log("generateZodSchemaFileFromJzodSchema called!");
 
  const newFileContentsNotFormated = jzodToTsCode(jzodObject, true, jzodSchemaVariableName)
  const newFileContents = `import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
${newFileContentsNotFormated}
`;

  if (targetFileName && fs.existsSync(targetFileName)) {
    const oldFileContents = fs.readFileSync(targetFileName).toString()
    if (newFileContents != oldFileContents)  {
      log.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
      fs.writeFileSync(targetFileName,newFileContents);
    } else {
      log.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
    }
  } else {
    fs.writeFileSync(targetFileName,newFileContents);
  }
}
