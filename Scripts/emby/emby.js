/*
 * Emby local registration responses for Quantumult X, Loon and Shadowrocket.
 * Upstream author: qiangxinglin.
 * https://github.com/qiangxinglin/Emby/blob/main/scripts/emby.js
 * Upstream main reviewed on 2026-11-23.
 */
"use strict";
(function () {
  var url = typeof $request !== "undefined" && $request ? $request.url : "";
  var match = /^https:\/\/mb3admin\.com\/admin\/service\/(registration\/(?:validateDevice|validate|getStatus)|appstore\/register|supporter\/retrievekey)\/?(?:\?.*)?$/.exec(url);
  if (!match) {
    $done({});
    return;
  }
  // Preserve the five upstream payloads. These are local responses, not server activation.
  var payloads = {
    "registration/validateDevice": {
      cacheExpirationDays: 365, message: "Device Valid", resultCode: "GOOD"
    },
    "appstore/register": {
      featId: "", registered: true, expDate: "2099-01-01", key: ""
    },
    "registration/validate": {
      featId: "", registered: true, expDate: "2099-01-01", key: ""
    },
    "registration/getStatus": {
      planType: "Cracked", deviceStatus: "", subscriptions: []
    },
    "supporter/retrievekey": {
      Success: false, ErrorMessage: "Supporter not found"
    }
  };
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Crack": "KS",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
  var body = JSON.stringify(payloads[match[1]]);
  if (typeof $task !== "undefined" || typeof $prefs !== "undefined") {
    $done({ status: "HTTP/1.1 200 OK", headers: headers, body: body });
  } else {
    $done({ response: { status: 200, headers: headers, body: body } });
  }
})();
