# Emby

基于 qiangxinglin 的 Emby 脚本，针对 `mb3admin.com` 的五个注册相关接口生成本地 JSON 响应，支持 Quantumult X、Loon 和 Shadowrocket。

## 原始地址

- 原始订阅：[QuantumultX/emby.conf](https://cdn.jsdelivr.net/gh/qiangxinglin/Emby@main/QuantumultX/emby.conf)。
- 上游仓库：[qiangxinglin/Emby](https://github.com/qiangxinglin/Emby)。
- 原始脚本：[scripts/emby.js](https://github.com/qiangxinglin/Emby/blob/main/scripts/emby.js)。

本次基于 2026-11-23 查看的上游 `main` 内容。保留五个接口的业务响应字段，增加 Loon / Shadowrocket 请求阶段的本地响应适配、明确 JSON 类型与禁用缓存，并收紧域名和路径匹配。脚本不主动发起网络请求，不写本地存储，不发送激活通知。

## 文件

| 文件 | 用途 |
| --- | --- |
| [emby.js](./emby.js) | 三个平台共用的请求阶段本地响应脚本 |
| [tests/compatibility.test.cjs](./tests/compatibility.test.cjs) | 五个接口、宿主返回格式、URL 范围及订阅引用测试 |

## 订阅链接

| 平台 | 独立订阅 | 导入位置 |
| --- | --- | --- |
| Quantumult X | [emby.conf](https://cdn.jsdelivr.net/gh/fansys/scripts@main/QuantumultX/emby.conf) | 远程重写资源 |
| Loon | [emby.plugin](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Loon/emby.plugin) | 插件管理；需 3.5.1（983）或更新版本 |
| Shadowrocket | [emby.sgmodule](https://cdn.jsdelivr.net/gh/fansys/scripts@main/Shadowrocket/emby.sgmodule) | 模块管理 |

链接对应 `fansys/scripts` 的 `main` 分支，配置与脚本推送并公开后可用。每个平台独立配置，只引用本仓库 `Scripts/emby/emby.js`。

## 安装与范围

1. 在当前平台添加对应订阅并启用脚本或重写。
2. 开启 HTTPS 解密，安装并信任当前平台的证书，确认解密域名包含 `mb3admin.com`。
3. 停用重复的 Emby 改写配置，更新脚本并重新连接，完全关闭并重新打开 Emby 客户端。

仅匹配 `https://mb3admin.com/admin/service/` 下列接口，允许末尾 `/` 和查询参数：

| 接口 | 上游响应含义 |
| --- | --- |
| `registration/validateDevice` | `resultCode=GOOD`，设备有效，缓存 365 天 |
| `appstore/register` | `registered=true`，到期日为 `2099-01-01` |
| `registration/validate` | `registered=true`，到期日为 `2099-01-01` |
| `registration/getStatus` | `planType=Cracked`，订阅列表为空 |
| `supporter/retrievekey` | `Success=false`，保留上游的未找到支持者响应 |

Quantumult X 使用 `script-echo-response`，Loon / Shadowrocket 在请求阶段返回本地响应，命中后无需等待原站响应。其他域名和路径原样放行。

这是客户端请求的本地模拟响应，不会购买或创建真实 Emby Premiere 授权，也不代表服务端权益已经开通。客户端是否接受响应需实机核对。

## 验证与排查

在仓库根目录使用 Node.js 18 或更新版本执行：

```sh
node --test Scripts/emby/tests/compatibility.test.cjs
```

离线测试覆盖五个接口及查询参数、三个平台的返回结构、无关 URL 放行和订阅引用，不包含客户端实机验证。若未生效，检查证书信任、`mb3admin.com` 解密、订阅开关及实际请求路径；客户端或接口变化可能使本配置不再适用。
