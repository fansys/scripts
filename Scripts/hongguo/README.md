# hongguo

红果短剧去广告插件，支持 Quantumult X、Loon 和 Shadowrocket。拦截穿山甲广告、广告素材签名域及埋点上报，对指定广告接口返回 HTTP 200 和空 JSON 对象。

## 原始地址

- 原始模块：[hongguo-lite-plus.sgmodule](https://github.com/k6nfmm7dbr-commits/hongguo-lite/blob/main/surge/hongguo-lite-plus.sgmodule)。
- 上游仓库：[k6nfmm7dbr-commits/hongguo-lite](https://github.com/k6nfmm7dbr-commits/hongguo-lite)。作者：Minis。
- 图标：[上游 icon.png](https://github.com/k6nfmm7dbr-commits/hongguo-lite/blob/main/icon.png)。
- 许可证：[MIT](./LICENSE)，保留上游版权声明。

## 文件

| 文件 | 用途 |
| --- | --- |
| [hongguo.js](./hongguo.js) | 三平台共用的广告接口本地响应脚本 |
| [icon.png](./icon.png) | 上游图标，供三个平台订阅引用 |
| [upstream.sgmodule](./upstream.sgmodule) | 原始 Plus 模块快照 |
| [LICENSE](./LICENSE) | 上游 MIT 许可证 |
| [tests/compatibility.test.cjs](./tests/compatibility.test.cjs) | 三平台响应格式、匹配范围和规则转换验证 |

## 订阅链接

| 平台 | 独立订阅 | 导入位置 |
| --- | --- | --- |
| Quantumult X | [hongguo.conf](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/hongguo.conf) | [远程重写资源](../../QuantumultX/README.md#hongguo) |
| Loon | [hongguo.plugin](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/hongguo.plugin) | [插件管理](../../Loon/README.md#hongguo)，需 3.5.1（983）或更新版本 |
| Shadowrocket | [hongguo.sgmodule](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/hongguo.sgmodule) | [模块管理](../../Shadowrocket/README.md#hongguo) |

## 拦截范围

| 分类 | 匹配范围 |
| --- | --- |
| 穿山甲广告 | 域名关键词 `pangolin`，域名后缀 `pglstatp-toutiao.com`、`pglstatp-toutiao-b.com` |
| 广告素材 | 域名关键词 `-ad-sign.byteimg.com` |
| 广告跳转 | `zlink.ugsdk.cn` |
| 字节广告 API | `ads` 后跟一个或多个数字的 `ads数字-normal.zijieapi.com`、`ads数字-normal-lq.zijieapi.com` |
| 埋点上报 | `mon.toutiaocloud.net`、`mon.toutiaocloud.com`、`i.snssdk.com`、`i-lq.snssdk.com`、`is.snssdk.com`、`is-lq.snssdk.com`，以及域名关键词 `applog.fqnovel.com`、`-misc.fqnovel.com` |

下列 HTTPS 请求在请求阶段返回 `{}`，不请求原站、不读取响应正文、不写本地存储：

- 域名包含 `pangolin-sdk-toutiao`，路径以 `/api/ad/union/sdk/` 开头。
- `snssdk.com` 子域名，路径以 `/api/ad/` 开头。

上游注释中的可选图片 CDN 路径拦截保持关闭。播放、金币、签到等其他 API 路径不由本地响应脚本修改；域名规则仍按上表独立生效。

## 平台适配

| 平台 | 实现与范围 |
| --- | --- |
| Quantumult X | 15 条域名规则转换为 URL 拒绝规则，2 条广告接口使用 `script-echo-response`；适用于 HTTP(S) 请求，HTTPS 拦截依赖 MITM，不包含独立的域名分流订阅 |
| Loon | 保留 13 条原生域名规则；两组广告 API 数字域名正则转换为请求重写，2 条广告接口通过请求脚本返回本地响应 |
| Shadowrocket | 保留 13 条原生域名规则；两组广告 API 数字域名正则转换为 URL Rewrite，2 条广告接口通过请求脚本返回本地响应；MITM 域名使用 `%APPEND%` 追加 |

`ads[0-9]+-normal\.zijieapi\.com` 和 `ads[0-9]+-normal-lq\.zijieapi\.com` 均保留数字限制。`normal-lq` 是在上游规则基础上补充的拒绝规则。MITM 中的 `ads*-normal.zijieapi.com` 和 `ads*-normal-lq.zijieapi.com` 仅用于选择解密主机，实际拒绝仍由正则判断。

Loon 和 Shadowrocket 解密上游声明的三个穿山甲子域范围、`*.snssdk.com`，以及广告 API 主机。Quantumult X 还需解密域名拒绝规则涉及的广告及上报主机，范围更广。URL 重写不覆盖其他协议或未进入解密的 HTTPS 流量。

## 安装与使用

1. 在对应平台导入独立订阅，开启脚本、重写及 HTTPS 解密，安装并信任证书。
2. 停用重复的红果广告模块，更新订阅及脚本，重新连接并重启红果短剧。
3. 在请求记录中确认广告和上报规则命中，以及 `/api/ad/` 请求获得空 JSON 本地响应。已被域名规则拒绝的请求可能先显示为 `REJECT`。
4. 需要回滚时停用订阅；插件不修改持久状态。

规则按域名和 URL 生效，同域名的其他应用也可能受到影响。拦截广告可能影响看广告得奖励等入口；`*.snssdk.com` 解密遇到证书固定时可能导致连接失败，可停用插件排查。实际去广告效果需在客户端验证。

## 验证

```sh
node --test Scripts/hongguo/tests/compatibility.test.cjs
```

测试覆盖广告接口本地响应、普通内容放行、14 条上游规则的转换、补充的 `normal-lq` 规则及数字域名匹配、订阅资源及缓存清理工具收录，不包含 iOS 客户端实机验证。
