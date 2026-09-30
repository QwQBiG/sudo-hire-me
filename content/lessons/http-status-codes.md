---
slug: "http-status-codes"
title: "常见 HTTP 状态码该怎样判断"
description: "沿创建资源、读取缓存和访问受限资源的请求，分清 2xx、3xx、4xx 与 5xx 的典型含义。"
subject: "计算机网络"
order: 124
minutes: 20
lab: "workbench"
objectives: ["由请求结果选择 200、201、204、304", "区分 401、403 和 404", "解释 500、502、503 指向的故障层次"]
prerequisites: ["http-https", "http-methods", "http-caching"]
---

# 常见 HTTP 状态码该怎样判断

## 先看类别，再看具体语义

超文本传输协议（Hypertext Transfer Protocol，HTTP）响应状态码是三位数字：`1xx` 信息性、`2xx` 成功、`3xx` 重定向相关、`4xx` 客户端侧请求问题、`5xx` 服务端无法完成请求。但“属于某类”只是入口，不能据此把所有 `3xx` 都当页面跳转，也不能说 `4xx` 必然是前端代码错误。状态码是**这一响应**的协议语义，不是服务器内部根因的完整诊断。[RFC 9110：Status Codes](https://www.rfc-editor.org/rfc/rfc9110.html)

## 逐步推演

### 新建一条记录，再读取它

客户端 `POST /items` 创建条目 42，服务器可返回 `201 Created`，并用 `Location: /items/42` 指向新资源。随后 `GET /items/42` 返回 `200 OK` 和表示内容；若成功处理但没有要返回的响应体，`204 No Content` 更贴切。不是所有成功请求都必须是 200，也不是所有 POST 都必然创建资源并返回 201。[RFC 9110：2xx Successful](https://www.rfc-editor.org/rfc/rfc9110.html)

### 缓存询问资源是否改变

客户端带 `If-None-Match: "v1"` 请求 `/items/42`，服务器确认当前实体标记仍为 `"v1"`，可回复 `304 Not Modified`，让客户端复用已有内容。304 虽在 `3xx` 类，却不是把浏览器导航到新 URL；也不携带本次资源的完整响应体。`301/308` 常表示永久移动，`302/307` 常表示临时位置，具体方法保留规则也不同，不能只按“永久/临时”两字随意互换。[RFC 9110：304 Not Modified](https://www.rfc-editor.org/rfc/rfc9110.html)

### 访问受限资源，先分身份和权限

匿名请求 `/admin` 且缺少有效认证凭据时，服务器通常用 `401 Unauthorized`，并带 `WWW-Authenticate` 挑战；**英文名称含 Unauthorized，但重点是本次缺乏有效认证凭据**。用户登录成功却没有管理员权限时，可用 `403 Forbidden`；路径不存在通常用 `404 Not Found`，服务器也可能为隐藏受限资源而回 404。`400 Bad Request` 是不能或不愿处理看作客户端错误的请求，不等于所有业务校验失败都只能选 400。[RFC 9110：4xx Client Error](https://www.rfc-editor.org/rfc/rfc9110.html)

## 服务端故障也要看位置

`500 Internal Server Error` 是源服务器遇到未预期情况的通用错误；`502 Bad Gateway` 常是网关/代理从上游收到无效响应；`503 Service Unavailable` 表示当前过载或维护等暂不可用，可配合 `Retry-After`。如果用户只说“网站报错”，不能直接认定某一层出了问题；先看谁产生响应、请求经过哪些网关，再查日志。[RFC 9110：5xx Server Error](https://www.rfc-editor.org/rfc/rfc9110.html)

## 面试回答

HTTP 状态码先按百位判断大类，再按具体语义回答：200 是成功响应，201 常用于已创建资源，204 成功但无响应内容；304 是条件请求命中已有表示，不是普通跳转。401 表示缺少有效认证凭据并应有认证挑战，403 表示服务器理解请求但拒绝执行，404 表示资源未找到或有意隐藏。500 是服务端一般故障，502 指网关获得无效上游响应，503 指暂时不可用。不要用状态码代替根因排查。

## 常见误区

- **“401 是已认证但没权限，403 才是没登录。”** 常见语义正好相反。
- **“304 必须返回完整新资源。”** 它支持重用已有缓存表示。
- **“502 和 500 完全一样。”** 502 明确涉及网关/代理收到上游无效响应。

## 选择题

已登录用户请求管理员资源，服务器能识别用户但拒绝其访问。最贴切的常见状态码是？

- A. 201 Created
- B. 304 Not Modified
- C. 401 Unauthorized
- D. 403 Forbidden

**答案：D。** 用户身份已确定但权限不足，403 更贴切；401 通常用于缺少有效认证凭据并带认证挑战。

## 参考资料

- [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9112：HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html)
