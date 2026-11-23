"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ROOT = path.resolve(__dirname, "../../..");
const SCRIPT = "https://cdn.jsdelivr.net/gh/fansys/scripts@main/Scripts/emby/emby.js";
const code = fs.readFileSync(path.resolve(__dirname, "../emby.js"), "utf8");
const BASE = "https://mb3admin.com/admin/service/";
const payloads = {
  "registration/validateDevice": { cacheExpirationDays: 365, message: "Device Valid", resultCode: "GOOD" },
  "appstore/register": { featId: "", registered: true, expDate: "2099-01-01", key: "" },
  "registration/validate": { featId: "", registered: true, expDate: "2099-01-01", key: "" },
  "registration/getStatus": { planType: "Cracked", deviceStatus: "", subscriptions: [] },
  "supporter/retrievekey": { Success: false, ErrorMessage: "Supporter not found" }
};
const rejected = [
  "http://mb3admin.com/admin/service/registration/validate",
  "https://mb3admin.com.evil.test/admin/service/registration/validate",
  "https://evil.test/admin/service/registration/validate",
  BASE + "registration/validateDeviceOther",
  BASE + "registration/validate/other",
  BASE + "registration/getStatusOther",
  BASE + "unknown?redirect=/admin/service/registration/validate",
  BASE + "supporter/retrievekey/other"
];

function run(platform, url, method = "POST") {
  let calls = 0;
  let result;
  const deny = () => { throw new Error("local response must not use network, storage or notification APIs"); };
  const context = { $request: { url, method }, $done(value) { calls++; result = value; },
    $notify: deny, $notification: { post: deny },
    $httpClient: { get: deny, post: deny }, $persistentStore: { read: deny, write: deny } };
  if (platform === "QuantumultX") {
    context.$task = { fetch: deny };
    context.$prefs = { valueForKey: deny, setValueForKey: deny };
  } else if (platform === "Loon") context.$loon = "test-runtime";
  vm.runInNewContext(code, context, { timeout: 1000 });
  assert.equal(calls, 1, "request must complete exactly once");
  return JSON.parse(JSON.stringify(result));
}

const fixtures = [
  ["QuantumultX", "emby.conf", line => line.split(" url ")[0]],
  ["Loon", "emby.plugin", line => line.match(/~= \/(.+)\/ then script/)[1]],
  ["Shadowrocket", "emby.sgmodule", line => line.match(/pattern=([^,]+)/)[1]]
];
for (const [platform, filename, pattern] of fixtures) {
  for (const [route, expected] of Object.entries(payloads)) {
    test(`${platform}: ${route} returns the upstream payload locally`, () => {
      for (const ending of ["", "/", "?deviceId=test", "/?deviceId=test"]) {
        const result = run(platform, BASE + route + ending);
        let response;
        if (platform === "QuantumultX") {
          assert.equal(result.status, "HTTP/1.1 200 OK");
          assert.equal(result.response, undefined);
          response = result;
        } else {
          assert.equal(result.response.status, 200);
          assert.equal(result.body, undefined);
          response = result.response;
        }
        assert.deepEqual(JSON.parse(response.body), expected);
        assert.equal(response.headers["Content-Type"], "application/json; charset=utf-8");
        assert.equal(response.headers["Cache-Control"], "no-store");
      }
    });
  }

  test(`${platform}: unrelated hosts, paths and missing URLs pass through`, () => {
    for (const url of [...rejected, undefined, null, ""]) assert.deepEqual(run(platform, url), {});
  });

  test(`${platform}: GET, POST and OPTIONS use the same local response`, () => {
    for (const method of ["GET", "POST", "OPTIONS"]) {
      const result = run(platform, BASE + "registration/validateDevice", method);
      assert.equal(JSON.parse((result.response || result).body).resultCode, "GOOD");
    }
  });

  test(`${platform}: independent subscription intercepts requests with the correct script`, () => {
    const config = fs.readFileSync(path.join(ROOT, platform, filename), "utf8");
    const rules = config.split("\n").filter(line => line.includes(SCRIPT));
    assert.equal(rules.length, 1);
    const regex = new RegExp(pattern(rules[0]));
    for (const route of Object.keys(payloads)) {
      for (const ending of ["", "/", "?deviceId=test", "/?deviceId=test"]) assert.ok(regex.test(BASE + route + ending));
    }
    for (const url of rejected) assert.equal(regex.test(url), false, url);
    assert.match(config, /hostname\s*=\s*(?:%APPEND%\s*)?mb3admin\.com\s*$/m);
    assert.ok(fs.existsSync(path.join(ROOT, "Scripts/emby/emby.js")));
    if (platform === "QuantumultX") {
      assert.match(rules[0], /url script-echo-response/);
      assert.doesNotMatch(config, /^\[/m);
    } else if (platform === "Loon") assert.match(rules[0], /^request if /);
    else assert.match(rules[0], /type=http-request/);
  });
}
