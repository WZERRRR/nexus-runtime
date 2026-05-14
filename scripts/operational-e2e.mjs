import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://127.0.0.1:3010";
const PROJECT_ROOT = "C:/Projects/nexus-runtime-os";
const RUNTIME_DB = "C:/Projects/nexus-runtime-os/server/data/runtime_persistence.db";
const PROJECT_ID = "P-103";

const results = [];
let devProc = null;

function pass(name, detail = "") {
  const line = `PASS | ${name}${detail ? ` | ${detail}` : ""}`;
  results.push(line);
  console.log(line);
}

function fail(name, detail = "") {
  const line = `FAIL | ${name}${detail ? ` | ${detail}` : ""}`;
  results.push(line);
  console.error(line);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  return { ok: res.ok, status: res.status, data, text };
}

async function waitForHealth(timeoutMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetchJson(`${BASE_URL}/api/health`);
      if (r.ok && r.data?.status === "ok") return true;
    } catch {}
    await sleep(700);
  }
  return false;
}

function ensureLocalManifest() {
  const db = new Database("C:/Projects/nexus-runtime-os/server/data/nexus_runtime_v2.db");
  const row = db.prepare("SELECT * FROM runtime_projects WHERE id = ?").get(PROJECT_ID);
  if (!row) throw new Error("P-103 not found in runtime_projects");
  const runtimePath = "C:/Projects/nexus-runtime-os";
  db.prepare("UPDATE runtime_projects SET runtime_path = ?, runtime_type = ?, env = ? WHERE id = ?")
    .run(runtimePath, "local-runtime", "Development", PROJECT_ID);
  db.close();

  const manifestPath = path.join(runtimePath, "nexus.runtime.json");
  const manifest = {
    project_id: PROJECT_ID,
    runtime_name: row.name || "Nexus Dev Workflow",
    runtime_path: runtimePath,
    runtime_type: "local-runtime",
    environment: "Development",
    runtime_host: "localhost",
    runtime_mode: "dev",
    pm2_runtime: row.pm2_runtime || "nexus-dev",
    node_id: row.node_id || "LOCAL-01",
    git_repo: row.repo || "nexus/dev-workflow",
    git_branch: row.git_branch || "main",
    pm2_process: row.runtime_process || "nexus-dev-fe",
    runtime_port: row.runtime_port || 3010,
    workspace_root: runtimePath,
    ssh_entry_path: runtimePath,
    governance_level: row.governance_level || "Standard",
    nexus_version: "2.1.0",
    last_synced: new Date().toISOString(),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

function tamperPayload(approvalId) {
  const db = new Database(RUNTIME_DB);
  const row = db.prepare("SELECT payload_json FROM runtime_pending_mutations WHERE approval_id = ?").get(approvalId);
  if (!row?.payload_json) {
    db.close();
    return false;
  }
  db.prepare("UPDATE runtime_pending_mutations SET payload_json = ? WHERE approval_id = ?")
    .run(String(row.payload_json) + "tamper", approvalId);
  db.close();
  return true;
}

async function run() {
  try {
    ensureLocalManifest();
    pass("LOCAL_PROFILE_SETUP", "P-103 + manifest ready");
  } catch (e) {
    fail("LOCAL_PROFILE_SETUP", e.message);
    process.exitCode = 1;
    return;
  }

  devProc = spawn("npm.cmd", ["run", "dev"], {
    cwd: PROJECT_ROOT,
    shell: true,
    stdio: "ignore",
  });

  const ready = await waitForHealth();
  if (!ready) {
    fail("SERVER_READY", "Health endpoint timeout");
    process.exitCode = 1;
    return;
  }
  pass("SERVER_READY");

  let runtimeId = PROJECT_ID;
  try {
    const projRes = await fetchJson(`${BASE_URL}/api/runtime/projects`);
    const p = (projRes.data?.data || []).find((x) => String(x.id) === PROJECT_ID);
    runtimeId = String(p?.runtime_id || p?.id || PROJECT_ID);
    pass("PROJECT_CONTEXT", `runtimeId=${runtimeId}, projectId=${PROJECT_ID}`);
  } catch (e) {
    fail("PROJECT_CONTEXT", e.message);
    process.exitCode = 1;
    return;
  }

  const approveBody = {
    status: "APPROVED",
    reviewed_by: "RuntimeOperator",
    reason: "Operational E2E automated approval",
  };

  try {
    const p1 = await fetchJson(`${BASE_URL}/api/runtime/terminal/exec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "echo OP_TEST_ONE",
        projectId: PROJECT_ID,
        requested_by: "RuntimeOperator",
        risk_level: "high",
      }),
    });
    const approvalId1 = p1.data?.data?.requestedApprovalId;
    if (p1.data?.data?.status !== "PENDING_APPROVAL" || !approvalId1) throw new Error("Expected PENDING_APPROVAL");
    pass("PENDING_APPROVAL_CREATE", approvalId1);

    const a1 = await fetchJson(`${BASE_URL}/api/runtime/${encodeURIComponent(runtimeId)}/approvals/${encodeURIComponent(approvalId1)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(approveBody),
    });
    if (!a1.ok || !a1.data?.success) throw new Error("Approval update failed");
    pass("AUTO_EXECUTE_AFTER_APPROVAL");

    const r1 = await fetchJson(`${BASE_URL}/api/runtime/${encodeURIComponent(runtimeId)}/approvals/${encodeURIComponent(approvalId1)}/replay`, {
      method: "POST",
    });
    if (!r1.ok || !r1.data?.success) throw new Error("Replay failed");
    pass("REPLAY_EXECUTION");
  } catch (e) {
    fail("FLOW_APPROVAL_REPLAY", e.message);
    process.exitCode = 1;
    return;
  }

  try {
    const p2 = await fetchJson(`${BASE_URL}/api/runtime/terminal/exec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "echo OP_TEST_TWO",
        projectId: PROJECT_ID,
        requested_by: "RuntimeOperator",
        risk_level: "high",
      }),
    });
    const approvalId2 = p2.data?.data?.requestedApprovalId;
    if (!approvalId2) throw new Error("Second pending approval not created");

    const tampered = tamperPayload(approvalId2);
    if (!tampered) throw new Error("Tamper setup failed (payload row missing)");

    const a2 = await fetchJson(`${BASE_URL}/api/runtime/${encodeURIComponent(runtimeId)}/approvals/${encodeURIComponent(approvalId2)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(approveBody),
    });
    if (!a2.ok || !a2.data?.success) throw new Error("Second approval update failed");

    const replay = await fetchJson(`${BASE_URL}/api/runtime/${encodeURIComponent(runtimeId)}/approvals/${encodeURIComponent(approvalId2)}/replay`, {
      method: "POST",
    });
    const blocked = !replay.ok && (replay.text || "").includes("Payload integrity validation failed");
    if (!blocked) throw new Error(`Expected integrity block, got status=${replay.status}`);
    pass("PAYLOAD_INTEGRITY_GATE");
  } catch (e) {
    fail("FLOW_INTEGRITY_GATE", e.message);
    process.exitCode = 1;
    return;
  }

  try {
    const rows = await fetchJson(`${BASE_URL}/api/runtime/${encodeURIComponent(runtimeId)}/pending-mutations`);
    if (!rows.ok || !rows.data?.success) throw new Error("pending-mutations endpoint failed");
    pass("PENDING_MUTATION_FEED", `count=${(rows.data?.data || []).length}`);
  } catch (e) {
    fail("PENDING_MUTATION_FEED", e.message);
    process.exitCode = 1;
    return;
  }
}

run()
  .catch((e) => {
    fail("UNHANDLED", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (devProc && !devProc.killed) devProc.kill("SIGTERM");
    await sleep(200);
    console.log("\n=== Operational E2E Report ===");
    for (const line of results) console.log(line);
  });
