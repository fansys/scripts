// Last updated: 2026-11-26 23:12
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ROOT = path.resolve(__dirname, "../../..");
const DIR = path.resolve(__dirname, "..");
const SCRIPT = "https://cdn.jsdelivr.net/gh/fansys/scripts@main/Scripts/hongguo/hongguo.js";
const code = fs.readFileSync(path.join(DIR, "hongguo.js"), "utf8");
const upstream = fs.readFileSync(path.join(DIR, "upstream.sgmodule"), "utf8");
const upstreamRules = upstream.split("[Rule]")[1].split("[Map Local]")[0].split("\n")
  .map(line => line.trim()).filter(line => line && !line.startsWith("#"));
const allowed = [
  "https://api-access.pangolin-sdk-toutiao.com/api/ad/union/sdk/get_ads/",
  "https://api-access.pangolin-sdk-toutiao-b.com/api/ad/union/sdk/config?x=1",
  "https://api-access.pangolin-sdk-toutiao1.com:443/api/ad/union/sdk/get_ads/",
  "https://api-access.pangolin-sdk-toutiao.com/api/ad/union/sdk/",
  "https://api5-normal.snssdk.com/api/ad/",
  "https://api5-normal.snssdk.com/api/ad/v1/?device_id=test",
  "https://a.b.snssdk.com/api/ad/creative"
];
const passthrough = [
  "http://api5-normal.snssdk.com/api/ad/",
  "https://api5-normal.snssdk.com/api/ad",
  "https://api5-normal.snssdk.com/api/advert/",
  "https://api5-normal.snssdk.com/video/play/",
  "https://api5-normal.snssdk.com/api/task/coin/",
  "https://security.snssdk.com/api/security/",
  "https://snssdk.com/api/ad/",
  "https://api5-normal.snssdk.com.evil.test/api/ad/",
  "https://api5-normal.snssdk.com@evil.test/api/ad/",
  "https://evil.test/?redirect=https://api5-normal.snssdk.com/api/ad/",
  "https://api-access.pangolin-sdk-toutiao.com/api/ad/union/sdk",
  "https://api-access.pangolin-sdk-toutiao.com/api/ad/union/sdk-other/",
  "https://p3-ad-sign.byteimg.com/video/tos/normal-video",
  "https://video.douyinvod.com/normal-video",
  "https://evil.test/api/ad/union/sdk/"
];

function run(platform, url, method = "GET") {
  let result;
  let count = 0;
  const deny = () => { throw new Error("must not use network, storage or notification APIs"); };
  const context = {
    $request: url === undefined ? undefined : { url, method },
    $done(value) { result = value; count++; },
    $httpClient: { get: deny, post: deny }, $persistentStore: { read: deny, write: deny },
    $notify: deny, $notification: { post: deny }
  };
  if (platform === "QuantumultX") {
    context.$task = { fetch: deny };
    context.$prefs = { valueForKey: deny, setValueForKey: deny };
  } else if (platform === "Loon") context.$loon = "test";
  vm.runInNewContext(code, context, { timeout: 1000 });
  assert.equal(count, 1);
  return JSON.parse(JSON.stringify(result));
}

function active(config) {
  return config.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("#") && !line.startsWith("["));
}

const configs = {
  QuantumultX: fs.readFileSync(path.join(ROOT, "QuantumultX/hongguo.conf"), "utf8"),
  Loon: fs.readFileSync(path.join(ROOT, "Loon/hongguo.plugin"), "utf8"),
  Shadowrocket: fs.readFileSync(path.join(ROOT, "Shadowrocket/hongguo.sgmodule"), "utf8")
};

for (const [platform, config] of Object.entries(configs)) {
  test(`${platform}: both ad routes return local empty JSON for GET, POST and OPTIONS`, () => {
    for (const url of allowed) {
      for (const method of ["GET", "POST", "OPTIONS"]) {
        const result = run(platform, url, method);
        const response = platform === "QuantumultX" ? result : result.response;
        assert.equal(response.status, platform === "QuantumultX" ? "HTTP/1.1 200 OK" : 200);
        assert.equal(response.body, "{}");
        assert.equal(response.headers["Content-Type"], "application/json");
        assert.equal(response.headers["Cache-Control"], "no-store");
      }
    }
  });

  test(`${platform}: content, coins, malformed URLs and missing requests pass through`, () => {
    for (const url of [...passthrough, undefined, null, {}, 12, ""]) assert.deepEqual(run(platform, url), {});
  });

  test(`${platform}: subscription script patterns agree with runtime routing`, () => {
    const scriptLines = active(config).filter(line => line.includes(SCRIPT));
    assert.equal(scriptLines.length, 2);
    const patterns = scriptLines.map(line => {
      if (platform === "QuantumultX") {
        assert.ok(line.includes(" url script-echo-response "));
        return new RegExp(line.split(" url ")[0]);
      }
      if (platform === "Loon") return vm.runInNewContext(line.match(/~= (\/.+\/) then script/)[1]);
      assert.ok(line.includes("type=http-request"));
      return new RegExp(line.match(/pattern=([^,]+)/)[1]);
    });
    for (const url of allowed) assert.ok(patterns.some(pattern => pattern.test(url)), url);
    for (const url of passthrough) assert.ok(!patterns.some(pattern => pattern.test(url)), url);
  });

  test(`${platform}: metadata, own CDN references and MITM scope are preserved`, () => {
    assert.ok(config.includes("#!author=Minis\n"));
    assert.ok(config.includes("#!icon=https://cdn.jsdelivr.net/gh/fansys/scripts@main/Scripts/hongguo/icon.png"));
    assert.ok(config.includes("*.snssdk.com"));
    assert.ok(config.includes("ads*-normal.zijieapi.com"));
    assert.ok(config.includes("ads*-normal-lq.zijieapi.com"));
    assert.ok(!active(config).some(line => /^DOMAIN-SUFFIX,(snssdk\.com|byteimg\.com|pstatp\.com|fqnovel\.com|douyinvod\.com),/.test(line)));
    const hostname = config.split("\n").find(line => line.startsWith("hostname = "));
    assert.ok(!hostname.split(/[, ]+/).some(value => ["*.byteimg.com", "*.pstatp.com", "*.douyinvod.com"].includes(value)));
    if (platform === "Shadowrocket") assert.ok(hostname.startsWith("hostname = %APPEND% "));
    for (const match of config.matchAll(/https:\/\/cdn\.jsdelivr\.net\/gh\/fansys\/scripts@main\/([^\s"'<>),]+)/g)) {
      assert.ok(fs.statSync(path.join(ROOT, match[1])).isFile(), match[1]);
    }
  });

  test(`${platform}: normal-lq ad hosts reject only exact numeric hostnames`, () => {
    const lines = active(config).filter(line => line.includes("ads[0-9]+-normal-lq"));
    assert.equal(lines.length, 1);
    const line = lines[0];
    let regex;
    if (platform === "Loon") {
      assert.ok(line.endsWith("then reject"));
      regex = vm.runInNewContext(line.match(/~= (\/.+\/) then reject/)[1]);
    } else {
      assert.ok(line.endsWith(platform === "QuantumultX" ? " url reject" : " - reject"));
      regex = new RegExp(line.split(" ")[0]);
    }
    for (const host of ["ads0-normal-lq.zijieapi.com", "ads3-normal-lq.zijieapi.com", "ads123-normal-lq.zijieapi.com"]) {
      for (const scheme of ["http://", "https://"]) {
        for (const tail of ["", "/", ":443/ad", "/api/ad/?id=1"]) assert.ok(regex.test(scheme + host + tail));
      }
    }
    for (const host of [
      "ads-normal-lq.zijieapi.com", "adsx-normal-lq.zijieapi.com", "api3-normal-lq.zijieapi.com",
      "ads3-normal-lq.zijieapi.com.evil.test", "sub.ads3-normal-lq.zijieapi.com", "ads3-normal-lqXzijieapi.com"
    ]) assert.ok(!regex.test(`https://${host}/ad`), host);
    assert.ok(!regex.test("https://example.com/?url=https://ads3-normal-lq.zijieapi.com/ad"));
    assert.ok(!regex.test("https://ads3-normal-lq.zijieapi.com@evil.test/ad"));
  });
}

test("Loon and Shadowrocket preserve 13 native domain rules and replace the unsupported regex rule", () => {
  assert.equal(upstreamRules.length, 14);
  for (const platform of ["Loon", "Shadowrocket"]) {
    const lines = active(configs[platform]);
    assert.deepEqual(lines.filter(line => line.startsWith("DOMAIN")), upstreamRules.filter(line => !line.startsWith("DOMAIN-REGEX,")));
    assert.ok(!lines.some(line => line.startsWith("DOMAIN-REGEX,")));
    const line = lines.find(line => line.includes("ads[0-9]+"));
    const regex = platform === "Loon" ? vm.runInNewContext(line.match(/~= (\/.+\/) then reject/)[1]) : new RegExp(line.split(" ")[0]);
    for (const url of ["https://ads3-normal.zijieapi.com/ad", "http://ads123-normal.zijieapi.com:80/ad"]) assert.ok(regex.test(url));
    for (const host of ["ads-normal.zijieapi.com", "adsx-normal.zijieapi.com", "api3-normal.zijieapi.com", "ads3-normal.zijieapi.com.evil.test"]) {
      assert.ok(!regex.test(`https://${host}/ad`), host);
    }
  }
});

test("Quantumult X domain-to-URL conversion matches upstream hostname semantics", () => {
  const rejectPatterns = active(configs.QuantumultX).filter(line => line.endsWith(" url reject"))
    .map(line => new RegExp(line.split(" url ")[0]));
  assert.equal(rejectPatterns.length, upstreamRules.length + 1);
  const hosts = [
    "api-access.pangolin-sdk-toutiao.com", "pangolin-dsp-toutiao-b.com",
    "pglstatp-toutiao.com", "p6.pglstatp-toutiao-b.com", "p6-ad-sign.byteimg.com",
    "zlink.ugsdk.cn", "ads3-normal.zijieapi.com", "ads123-normal.zijieapi.com",
    "mon.toutiaocloud.net", "mon.toutiaocloud.com", "i.snssdk.com", "i-lq.snssdk.com",
    "is.snssdk.com", "is-lq.snssdk.com", "log3-applog.fqnovel.com", "mon-misc.fqnovel.com",
    "pglstatp-toutiao.com.evil.test", "notpglstatp-toutiao.com", "api.snssdk.com",
    "security.snssdk.com", "vas.snssdk.com", "effect.snssdk.com", "fqnovel.com",
    "adsx-normal.zijieapi.com", "ads-normal.zijieapi.com", "api3-normal.zijieapi.com",
    "byteimg.com", "pstatp.com", "video.douyinvod.com"
  ];
  for (let index = 0; index < upstreamRules.length; index++) {
    const [type, value] = upstreamRules[index].split(",");
    for (const host of hosts) {
      const expected = type === "DOMAIN" ? host === value
        : type === "DOMAIN-SUFFIX" ? host === value || host.endsWith("." + value)
        : type === "DOMAIN-KEYWORD" ? host.includes(value) : new RegExp(value).test(host);
      for (const prefix of ["http://", "https://"]) {
        for (const tail of ["", "/ad", ":443/ad", "/?url=pangolin-sdk-toutiao.com"]) {
          assert.equal(rejectPatterns[index].test(prefix + host + tail), expected, `${type}, ${host}${tail}`);
        }
      }
    }
    assert.ok(!rejectPatterns[index].test(`https://example.com/?host=${value}`));
  }
  const lines = active(configs.QuantumultX);
  assert.ok(lines.findIndex(line => line.includes(SCRIPT)) < lines.findIndex(line => line.endsWith(" url reject")));
});

test("upstream icon, license and cache-tool discovery are available", () => {
  assert.ok(fs.readFileSync(path.join(DIR, "icon.png")).subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")));
  assert.ok(fs.readFileSync(path.join(DIR, "LICENSE"), "utf8").includes("Copyright (c) 2026 k6nfmm7dbr-commits"));
  const { collectTargets, selectTargets, parseArgs } = require("../../jsdelivr-purge/purge.cjs");
  const selected = selectTargets(collectTargets(), parseArgs(["--plugin", "hongguo"]));
  assert.equal(selected.length, 5);
});
