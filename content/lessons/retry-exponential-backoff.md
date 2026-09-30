---
slug: "retry-exponential-backoff"
title: "失败后为什么不该立刻无限重试"
description: "计算指数退避和抖动，理解重试预算、放大流量与幂等前提。"
subject: "并发与系统设计"
order: 158
minutes: 18
lab: "workbench"
objectives: ["手算前三次退避间隔", "解释抖动避免同步重试", "把重试限制在总截止时间与幂等边界内"]
prerequisites: ["timeouts-deadlines"]
---

# 失败后为什么不该立刻无限重试

## 只对值得重试的失败重试

远端短时繁忙、网络暂时断开可能恢复；参数错误通常不会因为再发一次就消失。**指数退避**（Exponential Backoff）让连续失败后的等待间隔增大。本题从 100 ms 开始，依次为 100、200、400、800 ms，封顶 800 ms；**抖动**（Jitter）是在间隔上加入随机化，避免许多客户端同一时刻再次打向恢复中的服务。[AWS：Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

## 逐步推演

### 第一次失败：等待 100 ms

假设请求发生在 t=0，失败后在无抖动模型下 t=100 ms 重试。若失败原因是永久参数错误，应该停止，而不是启动时间表。

### 第二次失败：再等 200 ms

第二次在 t=100 ms 失败，再等待 200 ms，第三次最早从 t=300 ms 开始。不能误算成“第二次在 t=200 ms”。

### 第三次失败：再等 400 ms

第四次最早 t=700 ms。若总截止时间只有 t=500 ms，就不能为了遵守退避表而安排这次尝试；还要限制总尝试次数，避免层层调用都重试使请求数成倍放大。[AWS Builders’ Library：Timeouts, Retries, and Backoff with Jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)

## 面试回答

重试用于有机会自行恢复的失败，不能对所有错误无条件重发。指数退避延长连续失败后的间隔，抖动打散大量客户端的同步重试；还要限制最大次数、总截止时间和重试层级。对可能产生副作用的操作，重试前必须有幂等保障，否则一次响应丢失可能造成两次业务执行。

## 常见误区

- **“超时就说明服务没执行。”** 服务可能完成操作但响应丢失。
- **“退避越久越可靠。”** 超过用户截止时间的重试没有意义。
- **“重试能治疗过载。”** 同步重试可能进一步放大过载。

## 选择题

不加抖动且前三次等待为 100、200、400 ms，第一次在 t=0 失败，第四次最早何时发起？

- A. t=300 ms
- B. t=400 ms
- C. t=700 ms
- D. t=800 ms

**答案：C。** 三段等待累计 100+200+400=700 ms；真实策略还须服从总截止时间。

## 参考资料

- [AWS：Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [AWS Builders’ Library：Timeouts, Retries, and Backoff with Jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
