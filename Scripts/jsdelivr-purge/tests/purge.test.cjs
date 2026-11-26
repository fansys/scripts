// Last updated: 2026-11-26 23:12
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { setTimeout: sleep } = require("node:timers/promises");
const { test } = require("node:test");
const { collectTargets, selectTargets, parseArgs, purgeTarget, runBatch, main } = require("../purge.cjs");

const CDN = "https://cdn.jsdelivr.net/gh/fansys/scripts@main/";
const target = { path: "Scripts/g1-acq/icon.png", url: CDN + "Scripts/g1-acq/icon.png" };
const pathname = new URL(target.url).pathname;
const finished = detail => ({ status: "finished", paths: { [pathname]: detail } });
const success = () => finished({ throttled: false, providers: { CF: true, FY: true } });
const response = data => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jsdelivr-purge-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const platform of ["QuantumultX", "Loon", "Shadowrocket"]) fs.mkdirSync(path.join(root, platform));
  fs.mkdirSync(path.join(root, "Scripts", "sample"), { recursive: true });
  fs.writeFileSync(path.join(root, "Scripts", "sample", "a b.js"), "// fixture");
  fs.writeFileSync(path.join(root, "Loon", "sample.plugin"), `${CDN}Scripts/sample/a%20b.js#xp_boost=true\nhttps://example.com/external.js\n`);
  fs.writeFileSync(path.join(root, "QuantumultX", "sample.conf"), `${CDN}Scripts/sample/a%20b.js#xp_boost=false\n`);
  return root;
}

test("discovers new subscriptions and referenced assets without including unreferenced files", t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, "Scripts/sample/icon.png"), "icon fixture");
  fs.writeFileSync(path.join(root, "Scripts/sample/build.cjs"), "// not a CDN dependency");
  fs.writeFileSync(path.join(root, "Shadowrocket/other.sgmodule"), `${CDN}Scripts/sample/icon.png\n${CDN}Scripts/sample/a%20b.js\n`);
  const targets = collectTargets(root);
  assert.equal(targets.filter(item => /^(QuantumultX|Loon|Shadowrocket)\//.test(item.path)).length, 3);
  assert.equal(targets.filter(item => item.path.endsWith("/icon.png")).length, 1);
  assert.equal(targets.filter(item => item.path.endsWith(".js")).length, 1);
  assert.equal(targets.length, 5);
  assert.ok(!targets.some(item => item.path.endsWith("build.cjs")));
  assert.deepEqual([...targets.find(item => item.path.endsWith("a b.js")).plugins].sort(), ["other", "sample"]);
  assert.equal(new Set(targets.map(item => item.url)).size, targets.length);
  assert.ok(targets.every(item => !item.url.includes("#") && !item.path.includes("/tests/")));
});

test("deduplicates shared references, strips arguments and encodes filenames", t => {
  const targets = collectTargets(fixture(t));
  assert.equal(targets.length, 3);
  const script = targets.find(item => item.path === "Scripts/sample/a b.js");
  assert.equal(script.url, CDN + "Scripts/sample/a%20b.js");
  assert.deepEqual([...script.plugins], ["sample"]);
});

test("missing dependencies fail before any purge request", async t => {
  const root = fixture(t);
  fs.unlinkSync(path.join(root, "Scripts/sample/a b.js"));
  await assert.rejects(main([], { root, purge() { assert.fail("must not request"); } }), /ENOENT/);
});

test("plugin and directory filters form a union; unknown selectors fail", t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, "Loon/other.plugin"), "#!name=other\n");
  const targets = collectTargets(root);
  const selected = selectTargets(targets, parseArgs(["--plugin", "sample", "Loon", "Loon/"]));
  assert.deepEqual(selected.map(item => item.path).sort(), [
    "Loon/other.plugin", "Loon/sample.plugin", "QuantumultX/sample.conf", "Scripts/sample/a b.js"
  ].sort());
  assert.equal(new Set(selected.map(item => item.path)).size, selected.length);
  assert.equal(selectTargets(targets, parseArgs(["./Scripts/sample/"])).length, 1);
  assert.throws(() => selectTargets(targets, parseArgs(["--plugin", "missing"])), /未找到插件/);
  assert.throws(() => selectTargets(targets, parseArgs(["Loon", "missing"])), /未匹配/);
});

test("invalid CLI options cannot silently trigger a full purge", () => {
  for (const args of [["--plugin"], ["--plugin", "../foo"], ["--concurrency", "0"], ["--concurrency", "2x"], ["--concurrency"], ["--unknown"]]) {
    assert.throws(() => parseArgs(args));
  }
});

test("dry run and help never call the purge API", async t => {
  const root = fixture(t);
  const logs = [];
  const options = { root, log: line => logs.push(line), purge() { assert.fail("must not request"); } };
  assert.equal(await main(["--dry-run"], options), 0);
  assert.equal(logs.filter(line => line.startsWith(CDN)).length, 3);
  assert.equal(await main(["--help"], { ...options, root: "/does-not-exist" }), 0);
});

test("purges the exact file URL and requires successful provider results", async () => {
  const result = await purgeTarget(target, { fetchImpl: async (url, options) => {
    assert.equal(url, "https://purge.jsdelivr.net" + pathname);
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return response(success());
  } });
  assert.equal(result.ok, true);
});

test("pending tasks are polled without submitting the purge again", async () => {
  const calls = [];
  const result = await purgeTarget(target, {
    wait: async () => {},
    fetchImpl: async url => {
      calls.push(url);
      return response(calls.length === 1 ? { status: "pending", id: "task-123" } : success());
    }
  });
  assert.equal(result.ok, true);
  assert.deepEqual(calls, ["https://purge.jsdelivr.net" + pathname, "https://purge.jsdelivr.net/status/task-123"]);
});

test("HTTP 200 is not success for throttling, partial failures or malformed results", async () => {
  for (const data of [
    finished({ throttled: true }),
    finished({ throttled: false, providers: { CF: true, FY: false } }),
    finished({ throttled: false, providers: { CF: true, FY: null } }),
    finished({ throttled: false, providers: {} }),
    finished({ providers: { CF: true } }),
    { status: "finished", paths: {} },
    { status: "pending", id: "../bad" },
    null
  ]) {
    assert.equal((await purgeTarget(target, { fetchImpl: async () => response(data) })).ok, false);
  }
});

test("HTTP errors, invalid JSON and network errors are reported as failures", async () => {
  for (const fetchImpl of [
    async () => new Response("rate limited", { status: 429 }),
    async () => new Response("failed", { status: 503 }),
    async () => new Response("not JSON"),
    async () => { throw new Error("network down"); }
  ]) {
    const result = await purgeTarget(target, { fetchImpl });
    assert.equal(result.ok, false);
    assert.ok(result.error);
  }
});

test("pending tasks have a total deadline", async () => {
  const result = await purgeTarget(target, {
    timeout: 10,
    pollInterval: 100,
    fetchImpl: async () => response({ status: "pending", id: "task-123" })
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /超时/);
});

test("batch limits concurrency, continues after failure and returns a failing exit code", async () => {
  let active = 0;
  let peak = 0;
  const calls = [];
  const logs = [];
  const targets = [0, 1, 2, 3, 4].map(index => ({ path: String(index) }));
  const code = await runBatch(targets, {
    concurrency: 2,
    log: line => logs.push(line),
    purge: async item => {
      calls.push(item.path);
      peak = Math.max(peak, ++active);
      await sleep(5);
      active--;
      if (item.path === "0") throw new Error("network down");
      return { ...item, ok: true };
    }
  });
  assert.equal(code, 1);
  assert.equal(peak, 2);
  assert.deepEqual(calls.sort(), ["0", "1", "2", "3", "4"]);
  assert.match(logs.at(-1), /成功 4 项，失败 1 项/);
  assert.equal(await runBatch([target], { log() {}, purge: async item => ({ ...item, ok: true }) }), 0);
});
