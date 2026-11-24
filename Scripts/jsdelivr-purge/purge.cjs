#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { setTimeout: sleep } = require("node:timers/promises");

const ROOT = path.resolve(__dirname, "../..");
const CDN = "https://cdn.jsdelivr.net/gh/fansys/scripts@main/";
const PURGE = "https://purge.jsdelivr.net";
const PLATFORMS = { QuantumultX: ".conf", Loon: ".plugin", Shadowrocket: ".sgmodule" };
const HELP = `批量清理本仓库的 jsDelivr 缓存（Node.js 18+）

用法：node Scripts/jsdelivr-purge/purge.cjs [选项] [仓库相对路径...]

无筛选条件时，清理全部平台订阅及其引用的本仓库脚本、图标。
  --dry-run             仅预览 CDN URL，不发送请求
  --plugin <目录名>     选择一个插件的全部订阅及依赖，可重复
  --concurrency <1-5>   并发数，默认 2
  --help                显示帮助

路径可选择已收集的文件或目录，例如 Loon 或 Scripts/g1-acq。
多个路径和插件取并集，所有资源自动去重。
`;

function parseArgs(args) {
  const options = { dryRun: false, plugins: [], paths: [], concurrency: 2 };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--plugin") {
      const name = args[++i];
      if (!name || !/^[A-Za-z0-9_-]+$/.test(name)) throw new Error("--plugin 需要插件目录名");
      options.plugins.push(name);
    } else if (arg === "--concurrency") {
      const value = args[++i];
      if (!/^[1-5]$/.test(value || "")) throw new Error("--concurrency 必须为 1 至 5");
      options.concurrency = Number(value);
    } else if (arg.startsWith("-")) throw new Error(`未知选项：${arg}`);
    else options.paths.push(arg);
  }
  return options;
}

function collectTargets(root = ROOT) {
  const targets = new Map();
  function add(relative, plugin) {
    if (path.posix.normalize(relative) !== relative || relative.startsWith("../") || path.posix.isAbsolute(relative)) {
      throw new Error(`资源路径无效：${relative}`);
    }
    if (!fs.lstatSync(path.join(root, relative)).isFile()) throw new Error(`资源不是文件：${relative}`);
    if (!targets.has(relative)) {
      targets.set(relative, { path: relative, url: CDN + relative.split("/").map(encodeURIComponent).join("/"), plugins: new Set() });
    }
    targets.get(relative).plugins.add(plugin);
  }
  for (const [platform, extension] of Object.entries(PLATFORMS)) {
    for (const entry of fs.readdirSync(path.join(root, platform), { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(extension)) continue;
      const relative = `${platform}/${entry.name}`;
      const plugin = entry.name.slice(0, -extension.length);
      add(relative, plugin);
      const content = fs.readFileSync(path.join(root, relative), "utf8");
      for (const match of content.matchAll(/https:\/\/cdn\.jsdelivr\.net\/gh\/fansys\/scripts@main\/[^\s"'<>),]+/g)) {
        const url = new URL(match[0]);
        // Script URL fragments contain client arguments, not a separate CDN resource.
        add(decodeURIComponent(url.pathname.slice(new URL(CDN).pathname.length)), plugin);
      }
    }
  }
  return [...targets.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function selectTargets(targets, options) {
  const selected = new Set();
  for (const plugin of options.plugins) {
    const matches = targets.filter(target => target.plugins.has(plugin));
    if (!matches.length) throw new Error(`未找到插件：${plugin}`);
    for (const target of matches) selected.add(target);
  }
  for (const input of options.paths) {
    const relative = path.posix.normalize(input.replace(/\\/g, "/")).replace(/\/$/, "");
    const matches = targets.filter(target => relative === "." || target.path === relative || target.path.startsWith(relative + "/"));
    if (!matches.length) throw new Error(`未匹配到订阅或引用资源：${input}`);
    for (const target of matches) selected.add(target);
  }
  const result = options.plugins.length || options.paths.length ? targets.filter(target => selected.has(target)) : targets;
  if (!result.length) throw new Error("未找到可清理的资源");
  return result;
}

async function purgeTarget(target, { fetchImpl = globalThis.fetch, timeout = 30000, pollInterval = 1000, wait = sleep } = {}) {
  const signal = AbortSignal.timeout(timeout);
  async function request(url) {
    const response = await fetchImpl(url, { signal, headers: { accept: "application/json" }, redirect: "error" });
    if (!response.ok) throw new Error(`HTTP ${response.status}${response.status === 429 ? "（限流，请稍后重试）" : ""}`);
    return response.json();
  }
  try {
    const pathname = new URL(target.url).pathname;
    let result = await request(PURGE + pathname);
    if (result?.status !== "finished") {
      if (!result || typeof result.id !== "string" || !/^[A-Za-z0-9_-]+$/.test(result.id)) {
        throw new Error("接口未返回有效清理任务");
      }
      const statusUrl = `${PURGE}/status/${result.id}`;
      while (result.status !== "finished") {
        await wait(pollInterval, undefined, { signal });
        result = await request(statusUrl);
        if (!result || typeof result.status !== "string") throw new Error("任务状态响应无效");
      }
    }
    const detail = result.paths?.[pathname];
    if (!detail || typeof detail.throttled !== "boolean") throw new Error("接口缺少目标路径的清理结果");
    if (detail.throttled) throw new Error("路径被限流，请稍后重试");
    const providers = Object.entries(detail.providers || {});
    if (!providers.length) throw new Error("接口缺少 CDN 节点结果");
    const failed = providers.filter(([, status]) => status !== true).map(([name]) => name);
    if (failed.length) throw new Error(`CDN 节点未成功：${failed.join(", ")}`);
    return { ...target, ok: true };
  } catch (error) {
    return { ...target, ok: false, error: signal.aborted
      ? `清理任务超时（${timeout / 1000} 秒），结果未确认`
      : [error.message, error.cause?.message].filter(Boolean).join("：") };
  }
}

async function runBatch(targets, { concurrency = 2, purge = purgeTarget, log = console.log } = {}) {
  const results = new Array(targets.length);
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const index = cursor++;
      const target = targets[index];
      try {
        results[index] = await purge(target);
      } catch (error) {
        results[index] = { ...target, ok: false, error: error.message };
      }
      const result = results[index];
      log(`[${result.ok ? "成功" : "失败"}] ${target.path}${result.ok ? "" : `：${result.error}`}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));
  const failed = results.filter(result => !result.ok);
  log(`共 ${results.length} 项，成功 ${results.length - failed.length} 项，失败 ${failed.length} 项。`);
  return failed.length ? 1 : 0;
}

async function main(args = process.argv.slice(2), { root = ROOT, log = console.log, ...batchOptions } = {}) {
  const options = parseArgs(args);
  if (options.help) { log(HELP); return 0; }
  const targets = selectTargets(collectTargets(root), options);
  log(`已选择 ${targets.length} 个资源${options.dryRun ? "（仅预览）" : ""}。`);
  if (options.dryRun) {
    for (const target of targets) log(target.url);
    return 0;
  }
  return runBatch(targets, { ...batchOptions, concurrency: options.concurrency, log });
}

if (require.main === module) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    console.error(`错误：${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { collectTargets, selectTargets, parseArgs, purgeTarget, runBatch, main };
