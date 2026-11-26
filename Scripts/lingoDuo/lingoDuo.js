/*
 * Last updated: 2026-11-26 23:12
 * lingoDuo — Quantumult X / Loon / Shadowrocket.
 * Author: TAKAGIVEGETA.
 * Upstream: https://github.com/TAKAGIVEGETA/MyScripts/tree/main/lingoDuo
 * Based on lingoDuo-xaM-enhanced.js, lingoDuo-time-modifier.js and lingoDuo-clear.js.
 * Snapshot reviewed: 2026-11-23. All optional enhancements default to off.
 */
"use strict";
(function () {
  var result = {};
  try {
    result = rewrite();
  } catch (error) {
    console.log("[lingoDuo] Response unchanged: " + error.message);
  }
  $done(result);

  function options() {
    var raw = typeof $argument !== "undefined" ? $argument : undefined;
    if (raw == null && typeof $environment !== "undefined" && $environment) {
      raw = $environment.variables;
      if (raw == null && typeof $environment.sourcePath === "string") {
        raw = $environment.sourcePath.split("#").slice(1).join("#");
      }
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
    if (typeof raw !== "string" || !raw.trim()) return {};
    if (raw.trim().charAt(0) === "{") {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    }
    var args = Object.create(null);
    raw.split("&").forEach(function (entry) {
      var separator = entry.indexOf("=");
      if (separator < 0) return;
      var key = decodeURIComponent(entry.slice(0, separator));
      if (/^(?:xp_boost|multiplier|unlock_all|timer_switch|timer_mins|instant_clear)$/.test(key)) {
        args[key] = decodeURIComponent(entry.slice(separator + 1));
      }
    });
    return args;
  }

  function enabled(value) {
    return value === true || value === 1 || /^(?:true|1|on)$/i.test(String(value));
  }

  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function user(value) {
    return object(value) && (value.shopItems !== undefined || value.subscriberLevel !== undefined ||
      (value.id && object(value.trackingProperties)));
  }

  function rewrite() {
    var url = typeof $request !== "undefined" && $request ? $request.url : "";
    var route = /^https:\/\/(ios-api-[a-z0-9-]+|api\d+|stories)\.duolingo\.(?:com|cn)(\/[^?#]*)(?:[?#].*)?$/.exec(url);
    if (!route || typeof $response === "undefined" || !$response || typeof $response.body !== "string") return {};
    var path = route[2];
    var apiHost = route[1] !== "stories";
    var profile = apiHost && /^\/2023-05-23\/(?:batch|users\/[^/]+)$/.test(path);
    var timer = apiHost && /\/live-ops-challenges$/.test(path);
    var session = /\/sessions$/.test(path) || path === "/api2/stories";
    if (!profile && !timer && !session) return {};
    var args = options();
    if (timer && !enabled(args.timer_switch)) return {};
    if (session && !enabled(args.instant_clear)) return {};
    var data = JSON.parse($response.body);
    if (!object(data)) return {};
    var changed = false;
    var now = Math.floor(Date.now() / 1000);

    if (profile) {
      if (/\/batch$/.test(path) && Array.isArray(data.responses)) {
        data.responses.forEach(function (response) {
          if (!object(response)) return;
          if (object(response.headers) && Object.keys(response.headers).some(function (key) {
            return key.toLowerCase() === "etag";
          })) return;
          var stringBody = typeof response.body === "string";
          var payload;
          try { payload = stringBody ? JSON.parse(response.body) : response.body; }
          catch (error) { return; }
          if (!user(payload)) return;
          applyUser(payload, args, now);
          response.body = stringBody ? JSON.stringify(payload) : payload;
          changed = true;
        });
      } else if (user(data)) {
        applyUser(data, args, now);
        changed = true;
      }
    } else if (timer) {
      var minutes = Number(args.timer_mins == null ? 60 : args.timer_mins);
      if (!isFinite(minutes) || minutes <= 0 || !Number.isSafeInteger(minutes * 60)) return {};
      var seconds = minutes * 60;
      if (!Array.isArray(data.liveOpsChallenges)) return {};
      data.liveOpsChallenges.forEach(function (challenge) {
        if (!object(challenge)) return;
        if (typeof challenge.initialTime === "number" && challenge.initialTime > 0) {
          challenge.initialTime = seconds;
          changed = true;
        }
        ["initialLevelTimes", "initialSessionTimes"].forEach(function (key) {
          if (Array.isArray(challenge[key])) {
            challenge[key] = challenge[key].map(function () { return seconds; });
            changed = true;
          }
        });
      });
    } else if (session) {
      if (data.type && ["SIDE_QUEST_RAMP_UP_PRACTICE", "MATCH_PRACTICE"].indexOf(data.type) < 0) {
        ["challenges", "adaptiveChallenges", "adaptiveInterleavedChallenges", "mistakesReplacementChallenges"].forEach(function (key) {
          if (Array.isArray(data[key]) && data[key].length) { data[key] = []; changed = true; }
        });
      }
      if (Array.isArray(data.elements) && data.elements.length) { data.elements = []; changed = true; }
    }
    return changed ? { body: JSON.stringify(data) } : {};
  }

  function applyUser(data, args, now) {
    if (!Array.isArray(data.shopItems)) data.shopItems = [];
    if (!data.shopItems.some(function (item) { return object(item) && item.id === "gold_subscription"; })) {
      data.shopItems.push({
        id: "gold_subscription",
        purchaseDate: now - 172800,
        purchasePrice: 0,
        subscriptionInfo: {
          expectedExpiration: now + 31536000,
          productId: "com.duolingo.DuolingoMobile.subscription.Gold.TwelveMonth.24Q2Max.168",
          renewer: "APPLE", renewing: true, tier: "twelve_month", type: "gold"
        }
      });
    }
    data.subscriberLevel = "GOLD";
    if (!object(data.trackingProperties)) data.trackingProperties = {};
    ["has_item_immersive_subscription", "has_item_premium_subscription", "has_item_live_subscription",
      "has_item_gold_subscription", "has_item_max_subscription"].forEach(function (key) {
      data.trackingProperties[key] = true;
    });
    if (enabled(args.xp_boost)) {
      var multiplier = Number(args.multiplier) === 3 ? 3 : 2;
      var boost = data.shopItems.find(function (item) { return object(item) && item.id === "xp_boost_stackable"; });
      if (!boost) { boost = { id: "xp_boost_stackable", purchasePrice: 0 }; data.shopItems.push(boost); }
      boost.purchaseDate = now;
      boost.expectedExpirationDate = now + 3600;
      boost.xpBoostMultiplier = multiplier;
    }
    if (enabled(args.unlock_all) && object(data.currentCourse) && Array.isArray(data.currentCourse.pathSectioned)) {
      data.currentCourse.pathSectioned.forEach(function (section) {
        if (!object(section) || !Array.isArray(section.units)) return;
        section.units.forEach(function (unit) {
          if (!object(unit) || !Array.isArray(unit.levels)) return;
          unit.levels.forEach(function (level) {
            if (object(level) && level.state === "locked") level.state = "active";
          });
        });
      });
    }
  }
})();
