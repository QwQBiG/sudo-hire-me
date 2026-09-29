---
slug: "idempotency-requests"
title: "响应丢了，重发支付请求怎样不扣两次"
description: "沿同一个幂等键追踪首次执行、响应丢失与重复请求。"
subject: "并发与系统设计"
order: 159
minutes: 18
lab: "walkthrough"
objectives: ["解释幂等是重复操作的最终业务效果", "用请求键识别重复副作用", "说明键范围、参数冲突和保存期限"]
prerequisites: ["retry-exponential-backoff", "database-transactions"]
---

# 响应丢了，重发支付请求怎样不扣两次

## 关键的不确定性

客户端发出“扣 50 元”，服务端已经成功扣款并提交，但响应在网络中丢失。客户端超时后不知道服务端是否完成；直接重发一个全新扣款请求可能重复执行。**幂等**（Idempotency）关注相同操作执行多次与执行一次的业务效果相同。HTTP 规范里的 GET、PUT、DELETE 具有方法级幂等语义，但具体业务 API 若有额外副作用，仍需按实际设计验证；POST 也可以通过应用机制实现幂等。[RFC 9110：Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)

## 逐步推演

### 首次请求携带键 K17

客户端发送 `POST /payments`，金额 50、请求键 `K17`。服务端在同一可靠业务边界内记录“键 K17 已对应扣款 P42”，返回 P42；若响应丢失，服务端仍保存该映射。

### 用同一个键重试

客户端重发同一金额、同一键 K17。服务端查到已处理，返回已有 P42，而不是再扣 50。要防止并发两次都查不到后同时执行，键的检查与副作用需要原子约束或等效协调。

### 同键不同参数必须处理冲突

若客户端用 K17 发金额 80，不能沉默返回 50 的结果或再执行一笔 80；应按 API 约定拒绝参数不一致。幂等键的作用范围和保存期限要明确，过期后的相同键可能被当作新请求。[AWS Builders’ Library：Making Retries Safe with Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)

## 面试回答

超时不等于失败，服务端可能已经完成副作用。对支付类 POST 请求，可让客户端为同一意图生成稳定的幂等键，服务端原子地保存键、参数摘要与结果；重复的同键同参数请求返回已有结果，不重复扣款。同键不同参数应报冲突，键的范围和过期规则要约定。它解决重复请求副作用，不替代事务、鉴权或错误处理。

## 常见误区

- **“给每次重试生成新键更安全。”** 新键使服务端无法识别同一意图。
- **“只在内存里记住键就足够。”** 进程重启或并发实例可能丢失记录。
- **“幂等保证请求永远不会失败。”** 它只约束重复执行的效果。

## 选择题

首次 `K17, 金额50` 已成功，响应丢失；客户端应怎样重试才能便于去重？

- A. 新建键 K18，金额 50
- B. 仍用 K17，金额 50
- C. 仍用 K17，金额 80
- D. 不带键重复发十次

**答案：B。** 同一业务意图保持相同键与参数，服务端才能返回既有结果。

## 参考资料

- [RFC 9110：Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- [AWS Builders’ Library：Making Retries Safe with Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
