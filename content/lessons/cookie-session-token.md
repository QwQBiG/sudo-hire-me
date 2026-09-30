---
slug: "cookie-session-token"
title: "Cookie、Session 和 Token 到底是什么关系"
description: "沿一次登录与后续请求，分清浏览器存储/传送、服务端会话和凭证格式。"
subject: "计算机网络"
order: 125
minutes: 17
lab: "workbench"
objectives: ["按登录请求追踪 Cookie 与服务端会话", "说明 Token 可通过 Cookie 等位置传送", "解释安全属性与失效策略的边界"]
prerequisites: ["http-https", "http-status-codes"]
---

# Cookie、Session 和 Token 到底是什么关系

## 三个词回答不同问题

**Cookie** 是浏览器按照 HTTP 规则保存并在匹配请求中回送的小块数据；**Session** 常指服务端为某次登录维持的会话状态；**Token** 泛指用来证明身份或授权的凭证，其具体格式可能只是随机字符串，也可能是带签名的结构化数据。它们不是“三选一”的同类方案：Cookie 完全可以承载 Session ID 或 Token。[RFC 6265：HTTP State Management Mechanism](https://www.rfc-editor.org/rfc/rfc6265.html)

以下用“服务端存会话、浏览器持有不透明 ID”的常见模式。服务器的映射表为 `s7 → 用户甲`；`s7` 只是本课的短标签，真实会话 ID 必须不可预测，并且通过 HTTPS 传输。

## 逐步推演

### 登录成功：服务端创建状态

服务端验证身份后创建会话条目 `s7 → 用户甲`，响应带 `Set-Cookie: sid=s7; Secure; HttpOnly; SameSite=Lax`。浏览器按 Cookie 的作用域与属性存下 `sid`；用户资料并没有因为这行响应自动都写入 Cookie。

### 后续请求：浏览器回送 ID

符合作用域和属性要求时，浏览器发送 `Cookie: sid=s7`。服务端查会话表，才能知道此请求对应用户甲；只看到 `s7` 这个字符串本身并不能推导用户资料。

### 退出或失效：区分两层

服务端删除或失效 `s7` 的映射后，旧 ID 即使再次送来也不应获授权；服务端还可下发过期 Cookie 清除浏览器副本。若改用自包含 Token，服务端可能少做会话表查询，但即时撤销、密钥轮换与有效期仍需设计，不能说 Token 天生“无状态且可立即退出”。[OWASP：Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## 面试回答

Cookie 是浏览器管理并按规则自动携带数据的机制；Session 是应用维护的会话状态；Token 是凭证，不限定存储位置。常见登录方案是服务端保存 Session，通过 Cookie 传一个不可预测的 Session ID。也可以把 Token 放在 Cookie 中。`Secure` 限制 HTTPS 传送，`HttpOnly` 限制脚本读取；浏览器自动带 Cookie 时仍需考虑跨站请求伪造等风险，`SameSite` 可帮助限制部分跨站发送，但不是万能替代品。

## 常见误区

- **“用 Token 就不再用 Cookie。”** Token 可以放在 Cookie 中。
- **“Session 数据都在 Cookie 里。”** 本例 Cookie 只保存不透明 ID，状态在服务端。
- **“HttpOnly 使登录不再有任何跨站请求风险。”** 它主要限制脚本读取，不等于阻止所有跨站请求。

## 选择题

本课的服务端删除了 `s7 → 用户甲`，但浏览器仍发送 `sid=s7`。哪项正确？

- A. 浏览器仍自动成为用户甲
- B. 服务端应把该 ID 当作无效会话处理
- C. Cookie 会自行恢复服务端会话表
- D. `HttpOnly` 能重新建立会话

**答案：B。** 服务端会话记录已经失效，旧 ID 不应再授予权限。

## 参考资料

- [RFC 6265：HTTP State Management Mechanism](https://www.rfc-editor.org/rfc/rfc6265.html)
- [OWASP：Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
