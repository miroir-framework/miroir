import { JzodObject, jzodToTsCode } from "@miroir-framework/jzod-ts";

import * as fs from "fs";

export async function generateZodSchemaFileFromJzodSchema(
  jzodObject: JzodObject,
  targetFileName: string,
  jzodSchemaVariableName:string,
) {
  // console.log("generateZodSchemaFileFromJzodSchema called!");
 
  const newFileContentsNotFormated = jzodToTsCode(jzodObject, true, jzodSchemaVariableName)
  const newFileContents = `import { JzodObject, jzodObject } from "@miroir-framework/jzod-ts";
${newFileContentsNotFormated}
`;

  if (targetFileName && fs.existsSync(targetFileName)) {
    const oldFileContents = fs.readFileSync(targetFileName).toString()
    if (newFileContents != oldFileContents)  {
      console.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
      fs.writeFileSync(targetFileName,newFileContents);
    } else {
      console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
    }
  } else {
    fs.writeFileSync(targetFileName,newFileContents);
  }
}
