"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { render } = require("../build.cjs");
const DIR = path.resolve(__dirname, "..");
const ROOT = path.resolve(DIR, "../..");
const SCRIPT = "https://cdn.jsdelivr.net/gh/fansys/scripts@main/Scripts/Rewrite_lhie1/request-header.js";
const source = fs.readFileSync(path.join(DIR, "upstream.conf"), "utf8");
const runtime = fs.readFileSync(path.join(DIR, "request-header.js"), "utf8");
const rules = source.split("\n").filter(line => line.includes(" url ")).map(line => {
  const [pattern, rest] = line.split(" url ");
  const space = rest.indexOf(" ");
  return { pattern, action: space < 0 ? rest : rest.slice(0, space), value: space < 0 ? "" : rest.slice(space + 1) };
});
const originals = rules.filter(rule => rule.action === "request-header");
const staticRules = rules.filter(rule => rule.action !== "request-header");
const hostname = source.split("\n").find(line => line.startsWith("hostname = ")).slice("hostname = ".length);
const fixtures = [
  ["QuantumultX", "Rewrite_lhie1.conf"], ["Loon", "Rewrite_lhie1.plugin"], ["Shadowrocket", "Rewrite_lhie1.sgmodule"]
];
const urls = [
  "https://union.click.jd.com/jda?original=1", "http://union.click.jd.com/sem.php?original=1",
  "https://api.cognitive.microsofttranslator.com/languages?scope=compact,transliteration&api-version=3.0",
  "https://offline.microsofttranslator.com/translatorresources.svc/GetMetadata?platform=ios&version=1",
  "http://cfg.m.ttkvod.com/mobile/ttk_mobile_1.8.txt", "https://cnzz.com/",
  "https://n.mark.letv.com/m3u8api/test", "http://static.m.ttkvod.com/static_cahce/index/index.txt",
  "https://www.iqshw.com/d/js/m"
];

function run(platform, url, headers = {}) {
  let calls = 0;
  let result;
  const deny = () => { throw new Error("script must not send requests or access storage"); };
  const context = { $request: { url, headers, method: "GET" },
    $done(value) { calls++; result = value; }, $httpClient: { get: deny, post: deny },
    $persistentStore: { read: deny, write: deny } };
  if (platform === "QuantumultX") { context.$task = { fetch: deny }; context.$prefs = { valueForKey: deny, setValueForKey: deny }; }
  if (platform === "Loon") context.$loon = "test-runtime";
  vm.runInNewContext(runtime, context, { timeout: 1000 });
  assert.equal(calls, 1);
  return JSON.parse(JSON.stringify(result));
}

test("snapshot contains every action type and all 451 rules", () => {
  const counts = {};
  for (const rule of rules) { new RegExp(rule.pattern); counts[rule.action] = (counts[rule.action] || 0) + 1; }
  assert.deepEqual(counts, { "302": 15, "request-header": 10, reject: 6, "reject-img": 417, "reject-dict": 3 });
  assert.equal(rules.length, 451);
});

test("generated subscriptions and runtime are reproducible from the preserved snapshot", () => {
  const outputs = render(source, fs.readFileSync(path.join(DIR, "request-header.js.in"), "utf8"));
  for (const [name, output] of Object.entries(outputs)) assert.equal(fs.readFileSync(path.join(ROOT, name), "utf8"), output, name);
});

for (const [platform, name] of fixtures) {
  const config = fs.readFileSync(path.join(ROOT, platform, name), "utf8");
  const active = config.split("\n").filter(line => line && !line.startsWith("#") && !line.startsWith("["));
  test(`${platform}: all static patterns and actions keep their source order`, () => {
    let actual;
    if (platform === "QuantumultX") {
      actual = active.filter(line => line.includes(" url ") && !line.includes(SCRIPT)).map(line => {
        const [pattern, rest] = line.split(" url ");
        const [action, value = ""] = rest.split(" ");
        return { pattern: new RegExp(pattern).source, action, value };
      });
    } else if (platform === "Loon") {
      actual = active.filter(line => line.startsWith("request if ") && !line.includes(SCRIPT)).map(line => {
        const match = /^request if \$\{url\} ~= (\/.+\/) then (.+)$/.exec(line);
        assert.ok(match, line);
        const regex = vm.runInNewContext(match[1]);
        const redirect = /^redirect\(302, (".+")\)$/.exec(match[2]);
        const action = redirect ? "302" : { reject: "reject", "reject_img(200)": "reject-img", "reject_dict(200)": "reject-dict" }[match[2]];
        assert.ok(action, line);
        return { pattern: regex.source, action, value: redirect ? JSON.parse(redirect[1]) : "" };
      });
    } else {
      actual = active.filter(line => line.startsWith("^")).map(line => {
        const [pattern, value, action] = line.split(" ");
        return { pattern: new RegExp(pattern).source, action, value: action === "302" ? value : "" };
      });
    }
    assert.deepEqual(actual, staticRules.map(rule => ({ pattern: new RegExp(rule.pattern).source, action: rule.action, value: rule.value })));
  });

  test(`${platform}: ten request rules use the local header script and retain matching order`, () => {
    const scripts = active.filter(line => line.includes(SCRIPT));
    assert.equal(scripts.length, 10);
    for (let i = 0; i < scripts.length; i++) {
      let pattern;
      if (platform === "QuantumultX") {
        assert.ok(scripts[i].includes("url script-request-header "));
        pattern = new RegExp(scripts[i].split(" url ")[0]);
      } else if (platform === "Loon") {
        const literal = scripts[i].match(/~= (\/.+\/) then script/)[1];
        pattern = vm.runInNewContext(literal);
      } else {
        assert.match(scripts[i], /type=http-request/);
        const raw = scripts[i].match(/pattern=([^,]+),script-path=/)[1];
        pattern = new RegExp(raw);
      }
      for (const url of urls) assert.equal(pattern.test(url), new RegExp(originals[i].pattern).test(url), scripts[i]);
    }
  });

  test(`${platform}: MITM host list and upstream author attribution are preserved`, () => {
    const value = active.find(line => line.startsWith("hostname = ")).slice("hostname = ".length).replace(/^%APPEND% /, "");
    assert.equal(value, hostname);
    assert.match(config, /^#!author=lhie1, NobyDa$/m);
    assert.match(config, /SPDX-License-Identifier: GPL-3.0-only/);
    if (platform === "QuantumultX") assert.doesNotMatch(config, /^\[/m);
  });

  test(`${platform}: header edits agree with the original raw-header substitutions`, () => {
    for (const url of urls) {
      const parsed = new URL(url);
      const rule = originals.find(item => new RegExp(item.pattern).test(url));
      const [find, replace] = rule.value.split(" request-header ");
      const raw = `GET ${parsed.pathname + parsed.search} HTTP/1.1\r\nHost: ${parsed.host}\r\nIf-None-Match: abc\r\nAccept: */*\r\n\r\n`;
      const expected = raw.replace(new RegExp(find), replace);
      const expectedPath = expected.match(/^GET (\S+) HTTP\/1\.1/)[1];
      const expectedHost = expected.match(/\r\nHost:\s*(.+)\r\n/)[1];
      const headers = { Host: parsed.host, "If-None-Match": "abc", Accept: "*/*" };
      const result = run(platform, url, headers);
      assert.equal(result.headers.Accept, "*/*");
      assert.equal(result.headers.Host, expectedHost);
      assert.equal("If-None-Match" in result.headers, /\r\nIf-None-Match:/.test(expected));
      if (rule.value.includes("If-None-Match")) {
        assert.equal(result.path, undefined);
        assert.equal(result.url, undefined);
      } else if (platform === "QuantumultX") {
        assert.equal(result.path, expectedPath);
        assert.equal(result.url, undefined);
      } else {
        assert.equal(result.url, `${parsed.protocol}//${expectedHost}${expectedPath}`);
      }
      assert.equal(headers["If-None-Match"], "abc", "must not mutate the supplied header object");
    }
  });

  test(`${platform}: missing and unrelated URLs pass through; lowercase cache headers work`, () => {
    for (const url of [undefined, null, "", "https://example.com/", "ftp://cnzz.com/"]) assert.deepEqual(run(platform, url), {});
    const result = run(platform, urls[2], { "if-none-match": "abc", accept: "application/json" });
    assert.deepEqual(result, { headers: { accept: "application/json" } });
    assert.deepEqual(run(platform, urls[2], { Accept: "*/*" }), {});
  });
}
