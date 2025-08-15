// Verify tracker <-> OpenAPI consistency.
// Fails if any activity in tracker is missing from OpenAPI (x-activity-id) or vice versa.
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import xlsx from "xlsx";

const specPath = path.join(process.cwd(), "api", "openapi_rest_grouped_66.yaml");
const trackerPathXlsx = path.join(process.cwd(), "docs", "tracker", "school_erp_master_implementation_tracker_extended.xlsx");
const trackerPathXlsxFallback = path.join(process.cwd(), "docs", "tracker", "school_erp_master_implementation_tracker.xlsx");

const spec = yaml.load(fs.readFileSync(specPath, "utf-8")) as any;

// Collect activity IDs from OpenAPI
const apiIds = new Set<string>();
for (const p in spec.paths) {
  for (const m in spec.paths[p]) {
    const op = spec.paths[p][m];
    if (op && op["x-activity-id"]) apiIds.add(String(op["x-activity-id"]).trim());
  }
}

function readTracker(p: string) {
  const wb = xlsx.readFile(p);
  // assume first sheet has "Unique Code" column
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(ws);
  return rows;
}

let trackerRows: any[] | null = null;
if (fs.existsSync(trackerPathXlsx)) trackerRows = readTracker(trackerPathXlsx);
else if (fs.existsSync(trackerPathXlsxFallback)) trackerRows = readTracker(trackerPathXlsxFallback);
else {
  console.error("Tracker file not found in docs/tracker");
  process.exit(2);
}

const trackerIds = new Set<string>(trackerRows.map(r => String(r["Unique Code"]).trim()));
// Compare
const missingInApi = [...trackerIds].filter(id => !apiIds.has(id));
const missingInTracker = [...apiIds].filter(id => !trackerIds.has(id));

if (missingInApi.length || missingInTracker.length) {
  console.error("✖ Inconsistency detected");
  if (missingInApi.length) console.error("  Tracker IDs missing in OpenAPI:", missingInApi);
  if (missingInTracker.length) console.error("  OpenAPI IDs missing in Tracker:", missingInTracker);
  process.exit(1);
} else {
  console.log("✔ Tracker and OpenAPI activity IDs are consistent.");
}
