/*
 * Last updated: 2026-11-26 23:12
 * HongGuo Lite Plus local ad responses for Quantumult X / Loon / Shadowrocket.
 * Upstream author: Minis. Copyright (c) 2026 k6nfmm7dbr-commits.
 * Source: https://github.com/k6nfmm7dbr-commits/hongguo-lite/blob/main/surge/hongguo-lite-plus.sgmodule
 * SPDX-License-Identifier: MIT. See LICENSE in this directory.
 */
"use strict";
(function () {
  var url = typeof $request !== "undefined" && $request ? $request.url : "";
  // Only the two upstream ad routes return a local response. Content APIs pass through.
  var patterns = [
    /^https:\/\/[a-zA-Z0-9.-]*pangolin-sdk-toutiao[a-zA-Z0-9.-]*(?::[0-9]+)?\/api\/ad\/union\/sdk\//,
    /^https:\/\/(?:[a-zA-Z0-9-]+\.)+snssdk\.com\/api\/ad\//
  ];
  if (typeof url !== "string" || !patterns.some(function (pattern) { return pattern.test(url); })) {
    $done({});
    return;
  }
  var headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (typeof $task !== "undefined" || typeof $prefs !== "undefined") {
    $done({ status: "HTTP/1.1 200 OK", headers: headers, body: "{}" });
  } else {
    $done({ response: { status: 200, headers: headers, body: "{}" } });
  }
})();
