---
slug: "thread-pool-basics"
title: "线程池满了以后新任务去哪儿"
description: "用两名工作线程和两格队列，分清执行、排队与拒绝策略。"
subject: "并发与系统设计"
order: 153
minutes: 18
lab: "walkthrough"
objectives: ["按工作线程和有界队列追踪任务", "说明线程池限制资源并复用线程", "辨别队列满与任务执行失败"]
prerequisites: ["process-thread", "cpu-scheduling"]
---

# 线程池满了以后新任务去哪儿

## 先设定一个明确的池

**线程池**（Thread Pool）维护可复用工作线程，从任务队列取任务执行，避免每个任务都新建线程。本题固定两个工作线程、一个容量为 2 的 FIFO 等待队列；提交和执行按题设顺序进行。真实 `ThreadPoolExecutor` 的核心线程、最大线程、队列类型和拒绝处理器可以组合出不同流程，不要把教学模型当成 Java 的唯一默认设置。[Java：ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)

## 逐步推演

### 提交 A、B：立即占用两名工人

工人 W1 执行 A，W2 执行 B；队列长度为 0。任务是否 CPU 密集、是否阻塞 I/O 会影响实际吞吐，这里只计算位置。

### 提交 C、D：排进两格队列

两名工人都忙，C、D 依顺序排队，队列变 `[C,D]`。排队不是已经开始执行，过长队列会增加等待时间并占用内存。

### 再提交 E：必须按策略处理

本模型工作位和队列都满。E 不能无条件被接纳；可以拒绝、由调用者执行、阻塞提交者，或使用其他明确策略。若采用 Java `AbortPolicy`，提交会抛拒绝异常；若 W1 完成 A，再从队首取 C，队列才释放一格。[Java：RejectedExecutionHandler](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/RejectedExecutionHandler.html)

## 面试回答

线程池复用一组工作线程并限制并发，暂时无法执行的任务可进入队列；当工作线程、队列都达到配置上限，新任务会触发拒绝或回压等策略。池大小与队列容量都要有边界，并根据 CPU/I/O 负载、等待时间和拒绝方式调优。任务提交成功不等于执行成功，还需观察运行错误和取消。

## 常见误区

- **“队列越大越安全。”** 大队列可能把过载延迟和内存占用藏起来。
- **“线程池满了自动无限创建线程。”** 取决于池配置；本题明确固定两名工人。

## 选择题

本题 A、B 正运行，C、D 已排队，E 到达时最准确的是？

- A. E 必定立即在 W1 运行
- B. E 已在队列第 3 格
- C. E 应由明确的饱和策略决定如何处理
- D. C 与 D 已运行完

**答案：C。** 两个工位和两个排队位都已满，不能凭空容纳 E。

## 参考资料

- [Java：ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
