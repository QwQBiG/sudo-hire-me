---
slug: "http-methods"
title: "HTTP 方法、安全与幂等"
subject: "计算机网络"
description: "同一请求重复发送时，区分 GET、HEAD、POST、PUT、DELETE 的语义。"
order: 120
minutes: 16
lab: "http"
objectives: ["区分安全与幂等", "解释 GET 与 HEAD 的正文差异", "指出重试 POST 的风险"]
prerequisites: ["http-https"]
---

# HTTP 方法、安全与幂等

## 面试回答

HTTP 方法规定客户端请求的语义。安全方法（Safe Method）的预期语义是只读，例如 GET、HEAD；幂等方法（Idempotent Method）重复执行同一个请求，对服务器的预期最终效果与执行一次相同，例如 GET、HEAD、PUT、DELETE。安全不等于“服务器绝无任何副作用”，幂等也不要求每次响应码或日志完全一样。POST 通常用于资源特定处理，不能仅凭方法名保证可安全重试；重复提交风险要由业务设计处理。[RFC 9110：Method Properties](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2)

## 先分两个判断维度

| 方法 | 典型请求 | 是否安全 | 按规范语义是否幂等 |
| --- | --- | --- | --- |
| GET | 读取 `/items/7` 的表示 | 是 | 是 |
| HEAD | 只取与 GET 对应的元数据，不传响应内容 | 是 | 是 |
| POST | 向 `/orders` 提交一笔新订单 | 否 | 不保证 |
| PUT | 用给定表示替换 `/items/7` 的当前表示 | 否 | 是 |
| DELETE | 请求删除 `/items/7` | 否 | 是 |

表格说的是**方法定义的预期效果**。GET 请求可能仍被记录到访问日志，但客户端并没有请求“改变资源状态”，所以 GET 仍是安全方法。PUT 两次发送相同表示，最终目标资源仍是该表示；DELETE 第一次可能成功，第二次可能返回不同状态码，但目标已被删除的预期效果不变。[RFC 9110：Safe Methods 与 Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2)

## 为什么重试要关心幂等

客户端发出创建订单的 POST 后连接中断，无法确认服务器是否已经创建订单。盲目发送完全相同的 POST，可能产生两笔订单。这是“响应没收到”与“请求没执行”不能画等号的实例。可使用业务唯一键或幂等键（Idempotency Key）等机制让具体接口处理重试，但这是**应用层设计**，不是 POST 方法自带的保证。反过来，符合语义的 PUT/DELETE 可在通信失败后按协议规则重试；仍要考虑认证、并发条件和接口实现。[RFC 9110：Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)

## GET 与 HEAD 看同一个资源

GET 请求成功时可返回资源表示；HEAD 与 GET 类似，但服务器**不能在 HEAD 响应中发送响应内容**。HEAD 响应的 `Content-Length` 可以表示对应 GET 响应若发送内容时的字节数，不表示 HEAD 此次真的传了这么多内容。资源不存在时仍可得到 404 响应；404 不等于 TCP/TLS 没有建立连接。[RFC 9110：HEAD](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.2)

网站实验只模拟 GET 与 HEAD 对一个示例资源的响应，并让你切换 HTTPS 的观察位置；它不模拟 POST、PUT、DELETE 的实际写入。先观察“有状态码但没有正文”的 HEAD，再回到 GET 比较。方法语义与传输保密是两个不同维度：HTTPS 保护传输中的应用数据，不会把错误的方法设计自动变成安全接口。

## 常见误区

- **“幂等就是每次都返回相同状态码。”** 定义比较的是重复请求的预期最终效果，响应和日志可以不同。
- **“GET 绝对不会产生任何服务器写入。”** 访问日志等附带效果可能存在，客户端的意图仍是只读。
- **“POST 一定不能做幂等。”** 具体业务可设计幂等处理，但方法自身不提供通用保证。
- **“HEAD 的 Content-Length 说明传输了正文。”** HEAD 不发送响应内容，该值可描述对应 GET 的内容长度。

## 选择题

客户端删除资源的请求成功后，又发送同一个 DELETE。第二次返回的状态码与第一次不同。哪项判断最准确？

- A. 只要状态码不同，DELETE 就不是幂等方法
- B. DELETE 的幂等性比较目标资源的预期最终效果，不要求状态码相同
- C. DELETE 是安全方法，因为目标资源最终不存在
- D. 重复请求一定会创建两个资源

**答案：B。** 按方法语义，删除一次或重复删除后的目标效果一致。A 把响应相同误当成幂等定义；C 把“只读”的安全性与幂等混淆；D 与删除语义无关。

## 参考资料

- [RFC 9110：HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
