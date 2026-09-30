---
slug: "http1-keepalive"
title: "HTTP/1.1 长连接到底复用了什么"
description: "用两次请求沿同一 TCP 连接读完响应，理解默认持久连接、消息边界与 Connection: close。"
subject: "计算机网络"
order: 121
minutes: 18
lab: "workbench"
objectives: ["说明 HTTP/1.1 默认持久连接的条件", "解释复用前为何必须确定前一响应何时结束", "区分连接复用与 HTTP/2 多路复用"]
prerequisites: ["http-https", "http-methods", "tcp-connection"]
---

# HTTP/1.1 长连接到底复用了什么

## “Keep-Alive”保留的是同一条传输连接

HTTP/1.1 的**持久连接**（Persistent Connection，日常也叫 Keep-Alive）允许多组请求与响应复用同一条底层连接，避免每次请求都重新建立 TCP 连接；若是 HTTPS，也避免重复为每次请求另建相应安全连接。HTTP/1.1 默认可以保持连接，不要求每次都显式写 `Connection: keep-alive`；`Connection: close` 表示当前响应后不再复用。对端可因超时或其他原因提前关闭，所以“可复用”不是“永远不断”。[RFC 9112：HTTP/1.1 Persistence](https://www.rfc-editor.org/rfc/rfc9112.html)

## 逐步推演

### 第一请求与响应把边界讲清

客户端在连接 X 上发 `GET /a HTTP/1.1`。服务器返回 `HTTP/1.1 200 OK`、`Content-Length: 2`，响应体为 `OK`。客户端读到头部后知道响应体恰好 2 字节，不需要通过“服务器断开连接”判断第一条消息结束。若响应只能以连接关闭来界定长度，这条连接就不能继续安全地承载下一条响应。[RFC 9112：Message Body Length](https://www.rfc-editor.org/rfc/rfc9112.html)

### 同一连接 X 上发第二请求

客户端完全读完第一响应后，继续在 X 上发 `GET /b HTTP/1.1`，而不是新建连接 Y。服务器可以返回 `204 No Content`，它本身没有响应体；客户端仍能识别第二响应结束。这叫**连接复用**，并不表示两个 HTTP/1.1 响应可以像 HTTP/2 流那样任意交错传输。HTTP/1.1 可以有管线化（Pipelining），但响应仍须按请求顺序发送，且不是多路复用。[RFC 9112：Pipelining](https://www.rfc-editor.org/rfc/rfc9112.html)

### 明确关闭或对端主动关闭

若客户端在下一请求里带 `Connection: close`，它不再打算复用；服务器完成最后响应后关闭连接。即使此前双方都计划持续使用，服务器也可能因空闲超时先关掉 X；客户端需要处理关闭并根据方法幂等性等规则决定是否重新连接、能否重试，不能无条件自动重放所有请求。[RFC 9112：Retrying Requests](https://www.rfc-editor.org/rfc/rfc9112.html)

## 两个容易混在一起的“长”

长连接只意味着**传输连接可跨多次请求继续使用**，不是“一个请求一直发送不完”，也不是 WebSocket 升级。复用需要消息长度可判断、前一响应已被正确读完；否则第二响应的字节会被误认为第一响应的一部分。HTTP/1.0 通常不默认持续连接，可在双方支持条件下协商旧式 keep-alive，不能照搬 HTTP/1.1 默认规则。[RFC 9112：Persistence](https://www.rfc-editor.org/rfc/rfc9112.html)

## 面试回答

HTTP/1.1 默认支持持久连接，即同一 TCP（HTTPS 场景下相应 TLS）连接可顺序承载多组请求响应，减少重复建连成本；`Connection: close` 或对端关闭会终止复用。为正确划分消息，每条响应必须有可确定的长度或无体规则，客户端要读完前一响应。持久连接不等于 HTTP/2 多路复用，也不保证连接绝对不断或请求可以无条件重试。

## 常见误区

- **“HTTP/1.1 不写 keep-alive 就每次断开。”** 它默认采用持久连接，除非协议条件或关闭标记阻止。
- **“只要 TCP 没断就能忽略响应体长度。”** 无法确定边界会无法正确解析下一响应。
- **“长连接就是并行多路复用。”** HTTP/1.1 的复用和 HTTP/2 的多路复用机制不同。

## 选择题

HTTP/1.1 响应 `200 OK` 带 `Content-Length: 2`，响应体为 `OK`，没有 `Connection: close`。客户端想在同一连接上继续请求，关键前提是什么？

- A. 先正确读完这 2 个响应体字节。
- B. 必须先发送 TCP FIN 再重建连接。
- C. 必须在响应后等待固定 2 秒。
- D. 可以无视第一响应体，把下一响应当作它的继续内容。

**答案：A。** 读完并划清前一消息边界才能正确解析下一组请求响应；B 与连接复用相反，C 没有协议依据。

## 参考资料

- [RFC 9112：HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html)
- [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
