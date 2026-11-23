"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ROOT = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(path.resolve(__dirname, "../lingoDuo.js"), "utf8");
const SCRIPT = "https://cdn.jsdelivr.net/gh/fansys/scripts@main/Scripts/lingoDuo/lingoDuo.js";
const PROFILE = "https://ios-api-test.duolingo.com/2023-05-23/users/123";
const BATCH = "https://api2.duolingo.cn/2023-05-23/batch";
const TIMER = "https://ios-api-test.duolingo.com/2023-05-23/live-ops-challenges";
const SESSION = "https://api2.duolingo.com/2023-05-23/sessions";
const STORY = "https://stories.duolingo.cn/api2/stories";
const defaults = { xp_boost: false, multiplier: 2, unlock_all: false, timer_switch: false, timer_mins: 60, instant_clear: false };
const profile = () => ({ id: 123, subscriberLevel: "FREE", shopItems: [], trackingProperties: {},
  currentCourse: { pathSectioned: [{ units: [{ levels: [{ state: "locked" }, { state: "completed" }] }] }] } });
const fixtures = [
  ["QuantumultX", "lingoDuo.conf", line => line.split(" url ")[0]],
  ["Loon", "lingoDuo.plugin", line => line.match(/~= \/(.+)\/ then script/)[1]],
  ["Shadowrocket", "lingoDuo.sgmodule", line => line.match(/pattern=([^,]+)/)[1]]
];

function run(platform, { url = PROFILE, body = profile(), args = defaults, environment, rawArgument } = {}) {
  let calls = 0;
  let result;
  const context = { $request: { url }, $response: { body: typeof body === "string" ? body : JSON.stringify(body) },
    console: { log() {} }, $done(value) { calls++; result = value; } };
  const encoded = Object.entries(args).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
  if (platform === "QuantumultX") context.$environment = environment || { sourcePath: SCRIPT + "#" + encoded };
  else context.$argument = rawArgument === undefined ? platform === "Loon" ? args : encoded : rawArgument;
  vm.runInNewContext(source, context, { timeout: 1000 });
  assert.equal(calls, 1);
  return JSON.parse(JSON.stringify(result));
}

for (const [platform] of fixtures) {
  test(`${platform}: default profile rewrite preserves course and leaves optional features off`, () => {
    const data = JSON.parse(run(platform).body);
    assert.equal(data.subscriberLevel, "GOLD");
    assert.equal(data.shopItems.length, 1);
    assert.equal(data.shopItems[0].id, "gold_subscription");
    assert.equal(data.trackingProperties.has_item_max_subscription, true);
    assert.equal(data.currentCourse.pathSectioned[0].units[0].levels[0].state, "locked");
    assert.equal(data.shopItems.some(item => item.id === "xp_boost_stackable"), false);
  });

  test(`${platform}: batch string and object payloads retain their original representation`, () => {
    const data = JSON.parse(run(platform, { url: BATCH, body: { responses: [
      { body: JSON.stringify(profile()) }, { body: profile() }, { body: { unrelated: true } },
      { body: "not JSON" }, null
    ] } }).body);
    assert.equal(typeof data.responses[0].body, "string");
    assert.equal(JSON.parse(data.responses[0].body).subscriberLevel, "GOLD");
    assert.equal(data.responses[1].body.subscriberLevel, "GOLD");
    assert.deepEqual(data.responses[2].body, { unrelated: true });
    assert.equal(data.responses[3].body, "not JSON");
    assert.equal(data.responses[4], null);
  });

  test(`${platform}: single-response batch works, cached profiles with ETag are skipped`, () => {
    const batch = { responses: [{ body: profile() }] };
    assert.equal(JSON.parse(run(platform, { url: BATCH, body: batch }).body).responses[0].body.subscriberLevel, "GOLD");
    for (const key of ["etag", "ETag"]) {
      assert.deepEqual(run(platform, { url: BATCH, body: { responses: [{ headers: { [key]: "cached" }, body: profile() }] } }), {});
    }
  });

  test(`${platform}: gold and XP boost records do not multiply when responses are processed again`, () => {
    const args = { ...defaults, xp_boost: true, multiplier: 3 };
    const first = JSON.parse(run(platform, { args }).body);
    first.shopItems.push(null);
    const data = JSON.parse(run(platform, { args, body: first }).body);
    assert.equal(data.shopItems.filter(item => item && item.id === "gold_subscription").length, 1);
    const boosts = data.shopItems.filter(item => item && item.id === "xp_boost_stackable");
    assert.equal(boosts.length, 1);
    assert.equal(boosts[0].xpBoostMultiplier, 3);
  });

  test(`${platform}: explicit false values stay off, invalid XP multipliers fall back to two`, () => {
    const args = { ...defaults, xp_boost: "false", unlock_all: "false" };
    assert.equal(JSON.parse(run(platform, { args }).body).shopItems.length, 1);
    args.xp_boost = "true";
    args.multiplier = "invalid";
    assert.equal(JSON.parse(run(platform, { args }).body).shopItems[1].xpBoostMultiplier, 2);
  });

  test(`${platform}: optional level unlock preserves completed levels and tolerates missing data`, () => {
    const data = JSON.parse(run(platform, { args: { ...defaults, unlock_all: true } }).body);
    assert.deepEqual(data.currentCourse.pathSectioned[0].units[0].levels.map(level => level.state), ["active", "completed"]);
    const sparse = { subscriberLevel: "FREE", shopItems: "invalid", trackingProperties: null,
      currentCourse: { pathSectioned: [null, {}, { units: [null, {}, { levels: [null] }] }] } };
    assert.equal(JSON.parse(run(platform, { body: sparse, args: { ...defaults, unlock_all: true } }).body).subscriberLevel, "GOLD");
  });

  test(`${platform}: challenge times change only when enabled with a valid duration`, () => {
    const body = { liveOpsChallenges: [null, { initialTime: 30, initialLevelTimes: [1, 2], initialSessionTimes: [3] }] };
    assert.deepEqual(run(platform, { url: TIMER, body }), {});
    const data = JSON.parse(run(platform, { url: TIMER, body, args: { ...defaults, timer_switch: true, timer_mins: 5 } }).body);
    assert.equal(data.liveOpsChallenges[1].initialTime, 300);
    assert.deepEqual(data.liveOpsChallenges[1].initialLevelTimes, [300, 300]);
    assert.deepEqual(data.liveOpsChallenges[1].initialSessionTimes, [300]);
    for (const timer_mins of [0, -1, "bad", "Infinity"]) {
      assert.deepEqual(run(platform, { url: TIMER, body, args: { ...defaults, timer_switch: true, timer_mins } }), {});
    }
  });

  test(`${platform}: optional session and story clearing preserves upstream excluded challenge types`, () => {
    const body = { type: "LESSON", challenges: [1], adaptiveChallenges: [2], elements: [3] };
    for (const url of [SESSION, STORY]) {
      assert.deepEqual(run(platform, { url, body }), {});
      const data = JSON.parse(run(platform, { url, body, args: { ...defaults, instant_clear: true } }).body);
      assert.deepEqual(data.challenges, []);
      assert.deepEqual(data.adaptiveChallenges, []);
      assert.deepEqual(data.elements, []);
    }
    for (const type of ["SIDE_QUEST_RAMP_UP_PRACTICE", "MATCH_PRACTICE"]) {
      const excluded = { type, challenges: [1] };
      assert.deepEqual(run(platform, { url: SESSION, body: excluded, args: { ...defaults, instant_clear: true } }), {});
    }
  });

  test(`${platform}: unrelated origins, unsupported paths, malformed and non-object JSON pass through`, () => {
    for (const url of [PROFILE.replace(".com", ".com.evil.test"), PROFILE.replace("https:", "http:"),
      "https://evil.test/2023-05-23/batch", "https://api2.duolingo.com/2023-05-23/users/1/other",
      "https://stories.duolingo.com/2023-05-23/users/1"]) assert.deepEqual(run(platform, { url }), {});
    for (const body of ["invalid", "null", "[]", "42", "{}", '{"responses":[]}']) {
      assert.deepEqual(run(platform, { body }), {});
    }
  });
}

test("QuantumultX: modern environment.variables and legacy URL fragment both accept optional flags", () => {
  const args = { xp_boost: "true", multiplier: "3" };
  const result = JSON.parse(run("QuantumultX", { environment: { variables: args } }).body);
  assert.equal(result.shopItems[1].xpBoostMultiplier, 3);
  assert.equal(JSON.parse(run("QuantumultX", { args }).body).shopItems[1].xpBoostMultiplier, 3);
});

test("Loon and Shadowrocket: object, query string and JSON arguments are compatible", () => {
  for (const platform of ["Loon", "Shadowrocket"]) {
    for (const rawArgument of [{ xp_boost: true }, "xp_boost=true", '{"xp_boost":true}']) {
      assert.equal(JSON.parse(run(platform, { rawArgument }).body).shopItems[1].xpBoostMultiplier, 2);
    }
    assert.deepEqual(run(platform, { rawArgument: "xp_boost=%ZZ" }), {});
  }
});

for (const [platform, filename, extractPattern] of fixtures) {
  test(`${platform}: independent subscription matches intended endpoints and references the local script`, () => {
    const config = fs.readFileSync(path.join(ROOT, platform, filename), "utf8");
    const rules = config.split("\n").filter(line => line.includes(SCRIPT));
    assert.equal(rules.length, 1);
    const regex = new RegExp(extractPattern(rules[0]));
    for (const url of [PROFILE, BATCH, TIMER, SESSION, STORY, PROFILE + "?fields=test"]) assert.equal(regex.test(url), true, url);
    for (const url of [PROFILE.replace(".com", ".com.evil.test"), PROFILE + "/other", PROFILE + "evil/other",
      "https://api2.duolingo.com/2023-05-23/batch-other", PROFILE.replace("https:", "http:")]) assert.equal(regex.test(url), false, url);
    assert.match(config, /hostname\s*=.*ios-api-\*\.duolingo\.com/);
    assert.match(config, /stories\.duolingo\.cn/);
    assert.ok(fs.existsSync(path.join(ROOT, "Scripts/lingoDuo/lingoDuo.js")));
    if (platform === "QuantumultX") {
      assert.doesNotMatch(config, /^\[/m);
      assert.match(rules[0], /url script-response-body/);
      for (const [key, value] of Object.entries(defaults)) assert.ok(rules[0].includes(`${key}=${value}`));
    } else if (platform === "Loon") {
      assert.match(config, /requires_body=true/);
      for (const key of Object.keys(defaults)) assert.ok(rules[0].includes("${" + key + "}"));
    } else {
      assert.match(config, /requires-body=1/);
      for (const [key, value] of Object.entries(defaults)) assert.ok(rules[0].includes(`${key}=${value}`));
    }
  });
}
