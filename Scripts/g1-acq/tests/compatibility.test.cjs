"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "../../..");
const PLUGIN = path.resolve(__dirname, "..");
const AI = "https://one.google.com/ai?entry=test";
const REPORT = "https://one.google.com/g1-sku-report";
const SCAN = "g1.sku.scan.v1";
const RECORD = "g1.pro.annual.test.v1";
const TARGET = "g1.2tb.ai.12months_ip_90p";
const sources = Object.fromEntries(["g1-acq.js", "g1-sku-report.js"].map(name =>
  [name, fs.readFileSync(path.join(PLUGIN, name), "utf8")]));

function run(platform, name, { url = AI, body, state = {}, storage = "ok" } = {}) {
  let result;
  let completions = 0;
  const context = {
    $request: { url },
    console: { log() {} },
    $done(value) { result = value; completions += 1; }
  };
  if (name === "g1-acq.js") context.$response = { body };
  const read = key => {
    if (storage === "throws") throw new Error("storage unavailable");
    return state[key] || null;
  };
  const write = (value, key) => {
    if (storage === "throws") throw new Error("storage unavailable");
    if (storage === "fails") return false;
    state[key] = value;
    return true;
  };
  if (storage !== "missing") {
    if (platform === "QuantumultX") context.$prefs = { valueForKey: read, setValueForKey: write };
    else context.$persistentStore = { read, write };
  }
  // Catch accidental references to another platform's runtime APIs.
  if (platform === "Loon") context.$loon = "test-runtime";
  vm.runInNewContext(sources[name], context, { timeout: 1000 });
  assert.equal(completions, 1, "each invocation must finish exactly once");
  return JSON.parse(JSON.stringify(result));
}

function report(platform, state, query = "?format=json", storage = "ok") {
  const result = run(platform, "g1-sku-report.js", { url: REPORT + query, state, storage });
  if (platform === "QuantumultX" && storage !== "missing") {
    assert.equal(result.status, "HTTP/1.1 200 OK");
    assert.equal(result.response, undefined);
    return result;
  }
  assert.equal(result.response.status, 200);
  return result.response;
}

for (const platform of ["QuantumultX", "Loon", "Shadowrocket"]) {
  test(`${platform}: collect originals, rewrite all tiers, then export saved state`, () => {
    const state = {};
    const body = JSON.stringify(["g1.ios.2tb.monthly", "g1.ios.20tb.m.v2", "g1.ios.30tb.ai.pro.m"]);
    const result = run(platform, "g1-acq.js", { body, state });
    assert.deepEqual(JSON.parse(result.body), [TARGET, "g1.20tb.3months_ip_90p.acq", "g1.ai.ultra.3months_ip_90p.acq"]);
    const response = report(platform, state);
    assert.match(response.headers["Content-Type"], /application\/json/);
    const data = JSON.parse(response.body);
    assert.equal(data.storageAvailable, true);
    assert.equal(data.test.hitCount, 3);
    assert.equal(data.test.annualHitCount, 1);
    assert.equal(data.scan.skus.length, 3);
    assert.ok(data.scan.skus.every(row => row.id.startsWith("g1.ios.")));
    assert.equal(data.scan.recentResponses[0].path, "/ai");
  });

  test(`${platform}: 20TB/30TB fall back independently and prefer observed 90p`, () => {
    const body = JSON.stringify(["g1.ios.20tb.m.v2", "g1.ios.30tb.ai.pro.m",
      "g1.20tb.3months_ip_75p.acq", "g1.ai.ultra.3months_ip_75p.acq", "g1.ai.ultra.3months_ip_90p.acq"]);
    const state = {};
    const result = JSON.parse(run(platform, "g1-acq.js", { body, state }).body);
    assert.equal(result[0], "g1.20tb.3months_ip_75p.acq");
    assert.equal(result[1], "g1.ai.ultra.3months_ip_90p.acq");
    const record = JSON.parse(state[RECORD]);
    assert.equal(record.annualHitCount, 0);
    assert.equal(record.matchedFrom[0].fallback, true);
    assert.equal(record.matchedFrom[1].fallback, false);
  });

  test(`${platform}: rewrite complete tokens only and preserve unmatched bodies`, () => {
    for (const body of ["no products", '"g1.ios.2tb."', '"g1.ios.20tb.m.v2.extra"',
      '"xg1.ios.2tb.monthly"', '"g1.ios.30tb.ai.pro.m.extra"']) {
      assert.deepEqual(run(platform, "g1-acq.js", { body }), {});
    }
  });

  test(`${platform}: collect other pages without rewriting; reject unrelated origins and report`, () => {
    const state = {};
    assert.deepEqual(run(platform, "g1-acq.js", { url: "https://one.google.com/plans?secret=1", body: '"g1.ios.2tb.monthly"', state }), {});
    assert.equal(JSON.parse(state[SCAN]).skus.length, 1);
    assert.equal(JSON.parse(state[SCAN]).recentResponses[0].path, "/plans");
    assert.equal(state[RECORD], undefined);
    for (const url of [REPORT, REPORT + "/?format=json", "https://one.google.com.evil.test/ai?x", "http://one.google.com/ai?x"]) {
      const untouched = {};
      assert.deepEqual(run(platform, "g1-acq.js", { url, body: '"g1.ios.2tb.monthly"', state: untouched }), {});
      assert.deepEqual(untouched, {});
    }
  });

  test(`${platform}: repeated SKU counts, escaped IDs, recent history and route privacy`, () => {
    const state = {};
    for (let i = 0; i < 12; i++) run(platform, "g1-acq.js", {
      url: "https://one.google.com/private/account?token=secret",
      body: '"g1\\u002eios\\u002e2tb\\u002emonthly" "com.google.one.test"', state
    });
    const scan = JSON.parse(state[SCAN]);
    assert.equal(scan.scannedResponses, 12);
    assert.equal(scan.skus.length, 2);
    assert.equal(scan.skus[0].count, 12);
    assert.equal(scan.recentResponses.length, 10);
    assert.equal(scan.recentResponses[9].status, "known-skus");
    assert.doesNotMatch(state[SCAN], /secret|account|token/);
  });

  test(`${platform}: cap retained SKUs and count dropped candidates`, () => {
    const state = {};
    run(platform, "g1-acq.js", { body: JSON.stringify(Array.from({ length: 302 }, (_, i) => `g1.test.${i}`)), state });
    const scan = JSON.parse(state[SCAN]);
    assert.equal(scan.skus.length, 300);
    assert.equal(scan.truncated, true);
    assert.equal(scan.recentResponses[0].omittedCount, 2);
  });

  test(`${platform}: non-text and failed storage do not break completion or rewriting`, () => {
    const state = {};
    assert.deepEqual(run(platform, "g1-acq.js", { body: new Uint8Array([1, 2]), state }), {});
    assert.equal(JSON.parse(state[SCAN]).nonTextResponses, 1);
    for (const storage of ["missing", "throws", "fails"]) {
      assert.equal(run(platform, "g1-acq.js", { body: '"g1.ios.2tb.monthly"', storage }).body, `"${TARGET}"`);
    }
  });

  test(`${platform}: HTML report, JSON download and clear only the plugin's keys`, () => {
    const state = { unrelated: "keep" };
    run(platform, "g1-acq.js", { body: '"g1.ios.2tb.monthly"', state });
    const html = report(platform, state, "");
    assert.match(html.body, /本机脚本已接管/);
    assert.match(html.body, /导出 JSON/);
    assert.equal(html.headers["Cache-Control"], "no-store");
    assert.match(report(platform, state).headers["Content-Disposition"], /g1-sku-report.json/);
    const cleared = JSON.parse(report(platform, state, "/?clear=1&format=json").body);
    assert.equal(cleared.scan.skus.length, 0);
    assert.equal(cleared.test.hitCount, 0);
    assert.equal(state.unrelated, "keep");
  });

  test(`${platform}: malformed and legacy storage remain readable`, () => {
    const broken = { [SCAN]: "not json", [RECORD]: "null" };
    assert.equal(JSON.parse(report(platform, broken).body).scan.skus.length, 0);
    const legacy = { [RECORD]: JSON.stringify({ schemaVersion: 1, version: "pro-annual-test-v1",
      matchedFrom: [{ id: "g1.ios.2tb.monthly", count: 2 }], hitCount: 2 }) };
    const data = JSON.parse(report(platform, legacy).body);
    assert.equal(data.test.target, "g1.2tb.ai.annual");
    assert.equal(data.test.matchedFrom[0].to, "g1.2tb.ai.annual");
    assert.equal(data.test.annualHitCount, 2);
    assert.equal(data.configuredTarget, TARGET);
    assert.equal(JSON.parse(report(platform, {}, "?format=json", "throws").body).scan.skus.length, 0);
  });
}

const configs = [
  ["QuantumultX", "g1-acq.conf", line => line.split(" url ")[0]],
  ["Loon", "g1-acq.plugin", line => line.match(/~= \/(.+)\/ then script/)[1]],
  ["Shadowrocket", "g1-acq.sgmodule", line => line.match(/pattern=([^,]+)/)[1]]
];
for (const [platform, filename, pattern] of configs) {
  test(`${platform}: plugin subscription routes and local script URLs`, () => {
    const dir = path.join(ROOT, platform);
    assert.ok(fs.existsSync(path.join(dir, filename)));
    assert.ok(fs.existsSync(path.join(dir, "README.md")));
    assert.ok(!fs.readdirSync(dir).some(name => name.startsWith("Plugins.")));
    const config = fs.readFileSync(path.join(dir, filename), "utf8");
    const rules = config.split("\n").filter(line => line.includes("https://raw.githubusercontent.com/") && !line.startsWith("#"));
    assert.equal(rules.length, 2);
    const reportRule = rules.find(line => line.includes("g1-sku-report.js"));
    const collectRule = rules.find(line => line.includes("g1-acq.js"));
    const reports = new RegExp(pattern(reportRule));
    const collects = new RegExp(pattern(collectRule));
    for (const url of [REPORT, REPORT + "/", REPORT + "?format=json", REPORT + "/?format=json"]) {
      assert.equal(reports.test(url), true);
      assert.equal(collects.test(url), false, "report must not be collected");
    }
    for (const url of [AI, "https://one.google.com/", "https://one.google.com/plans", REPORT + "-other"]) {
      assert.equal(collects.test(url), true);
      assert.equal(reports.test(url), false);
    }
    for (const url of ["https://evil.test/ai?x", "https://one.google.com.evil.test/ai?x", "http://one.google.com/ai?x"]) {
      assert.equal(reports.test(url), false);
      assert.equal(collects.test(url), false);
    }
    for (const match of config.matchAll(/https:\/\/raw\.githubusercontent\.com\/fansys\/scripts\/main\/([^\s",]+)/g)) {
      assert.ok(fs.existsSync(path.join(ROOT, match[1])), `missing script: ${match[1]}`);
    }
    assert.match(config, /hostname\s*=.*one\.google\.com/);
    if (platform === "QuantumultX") assert.doesNotMatch(config, /^\[/m, "remote rewrite uses native snippet format");
  });
}
