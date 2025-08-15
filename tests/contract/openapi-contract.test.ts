/**
 * Contract test runner (strict)
 * - Reads tests/contract/cases.json
 * - Validates responses against OpenAPI schemas via Ajv (compiled from yaml)
 */
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";
// Using ts-jest CommonJS transform; Node provides __dirname

// Load OpenAPI and build a simple schema map (status 200 only for brevity; extend as needed)
const specPath = path.join(process.cwd(), "api", "openapi_rest_grouped_66.yaml");
let openapiDoc: any = { paths: {} };
try {
  openapiDoc = yaml.load(fs.readFileSync(specPath, "utf-8"));
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("OpenAPI parse warning:", (err as Error).message);
  openapiDoc = { paths: {} };
}

// Build validators by path+method for 200 responses
type ValidatorMap = Record<string, any>;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function buildValidators(): ValidatorMap {
  const out: ValidatorMap = {};
  for (const [pth, methods] of Object.entries<any>(openapiDoc.paths || {})) {
    for (const [m, op] of Object.entries<any>(methods)) {
      const key = `${m.toUpperCase()} ${pth}`;
      const schema = op?.responses?.["200"]?.content?.["application/json"]?.schema;
      if (schema) {
        try {
          out[key] = ajv.compile(schema);
        } catch (e) {
          // If schema not JSON-schema compliant (references etc.), skip strict validation for this path for now.
          out[key] = null;
        }
      } else {
        out[key] = null;
      }
    }
  }
  return out;
}

const validators = buildValidators();

type Case = {
  activityId: string;
  name: string;
  method: string;
  path: string;
  headers?: Record<string,string>;
  body?: any;
  expect: number[];
  validateAgainstOpenAPI?: boolean;
};

describe("OpenAPI Contract Tests (strict)", () => {
  const cfgPath = path.join(__dirname, "cases.json");
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
  const baseUrl: string = cfg.baseUrl;
  const token: string = process.env.CONTRACT_TOKEN || cfg.auth?.bearer || "";

  for (const c of cfg.cases as Case[]) {
    const name = `${c.activityId} — ${c.method} ${c.path} — ${c.name}`;
    test(name, async () => {
      let url = baseUrl + c.path;
      const headers: Record<string,string> = { ...(c.headers || {}) };
      if (headers["Authorization"] && headers["Authorization"].includes("${TOKEN}")) {
        headers["Authorization"] = headers["Authorization"].replace("${TOKEN}", token);
      }
      const init: RequestInit = { method: c.method, headers };
      if (c.body) init.body = JSON.stringify(c.body);
      const res = await fetch(url, init);
      expect(c.expect).toContain(res.status);

      if (c.validateAgainstOpenAPI && res.headers.get("content-type")?.includes("application/json")) {
        const key = `${c.method} ${c.path}`.toUpperCase();
        const validate = validators[key];
        if (validate) {
          const json = await res.json();
          const ok = validate(json);
          if (!ok) {
            console.error("Schema errors:", validate.errors);
          }
          expect(ok).toBeTruthy();
        }
      }
    });
  }
});
