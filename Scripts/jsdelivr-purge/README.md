# jsDelivr 缓存清理

批量清理本仓库订阅、公共脚本和图标的 jsDelivr CDN 缓存。使用 Node.js 18 或更新版本，无需安装依赖。

## 文件

| 文件 | 用途 |
| --- | --- |
| [purge.cjs](./purge.cjs) | 本地命令行工具，收集资源、提交清理请求并汇总结果 |
| [tests/purge.test.cjs](./tests/purge.test.cjs) | 资源收集、筛选、接口结果、超时及并发测试 |

## 使用

在仓库根目录执行：

```sh
# 预览全部资源，不发送请求
node Scripts/jsdelivr-purge/purge.cjs --dry-run

# 清理全部订阅及其引用的本仓库脚本、图标
node Scripts/jsdelivr-purge/purge.cjs

# 清理单个插件的三平台订阅、脚本及图标
node Scripts/jsdelivr-purge/purge.cjs --plugin g1-acq

# 批量选择多个插件
node Scripts/jsdelivr-purge/purge.cjs --plugin g1-acq --plugin lingoDuo

# 仅清理指定平台订阅或已引用的文件、目录
node Scripts/jsdelivr-purge/purge.cjs Loon Scripts/emby
node Scripts/jsdelivr-purge/purge.cjs Scripts/g1-acq/icon.png

# 调整并发数（1–5，默认 2）
node Scripts/jsdelivr-purge/purge.cjs --concurrency 1
```

所有路径均相对于仓库根目录。多个插件和路径取并集，重复 URL 只清理一次。平台路径只选择对应订阅文件；`--plugin` 同时选择该插件的全部平台订阅及引用资源。

## 清理范围与结果

- 读取 `QuantumultX/*.conf`、`Loon/*.plugin`、`Shadowrocket/*.sgmodule`，收集订阅及其引用的本仓库 jsDelivr URL。
- 目标与仓库订阅使用相同的 `fansys/scripts@main` 路径；脚本 URL 的参数片段不参与缓存路径。
- 测试、构建文件及未被订阅引用的文件不在清理范围内。未知插件、无匹配路径或缺失引用文件会在发送请求前报错。
- 清理使用 `purge.jsdelivr.net`；任务未完成时轮询状态，单项总超时为 30 秒。
- 只有任务完成、未被限流且全部返回的 CDN 节点均成功时，才标记该项成功。失败项显示原因，其他资源继续处理；全部成功退出码为 `0`，存在失败或参数错误时为 `1`。
- 限流和失败项不自动重复提交，可根据输出稍后按插件或路径重试。

清理作用于 CDN 缓存，不清理客户端本地缓存，也不修改 GitHub 文件。实际 CDN 内容更新仍取决于源站及缓存传播；接口成功不等同于已验证内容一致。

## 参考

- [jsDelivr 官方清理工具](https://www.jsdelivr.com/tools/purge)
- [官方工具源码](https://github.com/jsdelivr/www.jsdelivr.com/blob/master/src/views/pages/tools/purge.html)
- [jsDelivr 缓存说明](https://github.com/jsdelivr/jsdelivr#caching)

## 验证

```sh
node --test Scripts/jsdelivr-purge/tests/purge.test.cjs
```

测试使用模拟接口，不向 CDN 发起清理请求。
