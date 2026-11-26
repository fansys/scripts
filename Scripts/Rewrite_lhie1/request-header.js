/*
 * Last updated: 2026-11-26 23:12
 * Author: lhie1, NobyDa.
 * Source: https://github.com/NobyDa/Script/blob/master/QuantumultX/Rewrite_lhie1.conf
 * SPDX-License-Identifier: GPL-3.0-only
 * Generated from upstream.conf by build.cjs. Adapted on 2026-11-23.
 */
"use strict";
(function () {
  var rules = [
  {
    "line": 15,
    "pattern": "^https?://union.click.jd.com/jda?",
    "path": "/jda?adblock=",
    "host": "union.click.jd.com"
  },
  {
    "line": 16,
    "pattern": "^https?://union.click.jd.com/sem.php?",
    "path": "/sem.php?adblock=",
    "host": "union.click.jd.com"
  },
  {
    "line": 19,
    "pattern": "^https?:\\/\\/api\\.cognitive\\.microsofttranslator\\.com\\/languages\\?scope=compact,transliteration&api-version=",
    "remove": "If-None-Match"
  },
  {
    "line": 20,
    "pattern": "^https?:\\/\\/offline\\.microsofttranslator\\.com\\/translatorresources\\.svc\\/GetMetadata\\?platform=ios&version=",
    "remove": "If-None-Match"
  },
  {
    "line": 21,
    "pattern": "^https?://cfg.m.ttkvod.com/mobile/ttk_mobile_1.8.txt",
    "path": "/Static/TXT/ttk_mobile_1.8.txt",
    "host": "ogtre5vp0.bkt.clouddn.com"
  },
  {
    "line": 22,
    "pattern": "^https?://cnzz.com/",
    "path": "/background.png?",
    "host": "ogtre5vp0.bkt.clouddn.com"
  },
  {
    "line": 25,
    "pattern": "^https?://n.mark.letv.com/m3u8api/",
    "path": "/Interface",
    "host": "burpsuite.applinzi.com"
  },
  {
    "line": 27,
    "pattern": "^https?://static.m.ttkvod.com/static_cahce/index/index.txt",
    "path": "/Static/TXT/index.txt",
    "host": "ogtre5vp0.bkt.clouddn.com"
  },
  {
    "line": 28,
    "pattern": "^https?://www.iqshw.com/d/js/m",
    "path": "/Interface",
    "host": "burpsuite.applinzi.com"
  },
  {
    "line": 29,
    "pattern": "^https?://www.iqshw.com/d/js/m",
    "path": "/Other/Static/JS/Package.js?",
    "host": "rewrite.websocket.site:10"
  }
];
  var result = {};
  try {
    var request = typeof $request !== "undefined" && $request ? $request : {};
    var url = typeof request.url === "string" ? request.url : "";
    var rule;
    for (var i = 0; i < rules.length; i++) {
      if (new RegExp(rules[i].pattern).test(url)) { rule = rules[i]; break; }
    }
    if (rule) {
      var headers = Object.assign({}, request.headers || {});
      if (rule.remove) {
        var changed = false;
        Object.keys(headers).forEach(function (key) {
          if (key.toLowerCase() === rule.remove.toLowerCase()) { delete headers[key]; changed = true; }
        });
        if (changed) result = { headers: headers };
      } else {
        var scheme = /^(https?):\/\//.exec(url);
        if (scheme) {
          Object.keys(headers).forEach(function (key) {
            if (key.toLowerCase() === "host" || key === ":authority") delete headers[key];
          });
          headers.Host = rule.host;
          if (typeof $task !== "undefined" || typeof $prefs !== "undefined") {
            result = { path: rule.path, headers: headers };
          } else {
            result = { url: scheme[1] + "://" + rule.host + rule.path, headers: headers };
          }
        }
      }
    }
  } catch (error) {
    // Keep the original request if the host API supplies unexpected input.
    result = {};
  }
  $done(result);
})();
