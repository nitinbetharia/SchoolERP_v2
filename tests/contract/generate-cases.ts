/**
 * Generates a skeleton test case list from api/openapi_rest_grouped_66.yaml
 * so teams can fill tokens/params incrementally.
 */
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const specPath = path.join(process.cwd(), "api", "openapi_rest_grouped_66.yaml");
const outPath = path.join(process.cwd(), "tests", "contract", "cases.generated.json");

const doc: any = yaml.load(fs.readFileSync(specPath, "utf-8"));
const paths = doc.paths || {};

const cases = [];
for (const pth of Object.keys(paths)) {
  const methods = paths[pth];
  for (const method of Object.keys(methods)) {
    const op = methods[method];
    const activityId = op["x-activity-id"] || "UNKNOWN";
    cases.push({
      activityId,
      name: op.summary || `${method.toUpperCase()} ${pth}`,
      method: method.toUpperCase(),
      path: pth,
      headers: {},
      expect: [200, 400],
      validateAgainstOpenAPI: false
    });
  }
}

fs.writeFileSync(outPath, JSON.stringify({
  _comment: "Auto-generated from OpenAPI. Copy entries into cases.json and edit as needed.",
  generatedAt: new Date().toISOString(),
  baseUrl: "http://localhost:3000/api/v1",
  cases
}, null, 2));

console.log("Generated:", outPath);
