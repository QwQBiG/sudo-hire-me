---
slug: "producer-consumer-queue"
title: "有界队列满了，生产者为何要等"
description: "让生产者和消费者操作容量为二的队列，观察空、满与唤醒。"
subject: "并发与系统设计"
order: 154
minutes: 18
lab: "bounded-queue"
objectives: ["按 FIFO 顺序追踪入队出队", "解释队满和队空时各等待谁", "区分内存有界队列与持久消息服务"]
prerequisites: ["condition-variable", "thread-pool-basics"]
---

# 有界队列满了，生产者为何要等

## 共享的是队列，不是同一段代码

**生产者—消费者**（Producer–Consumer）模型把创建任务和处理任务解耦。用容量为 2 的 FIFO 队列：生产者放入 A、B 后队列满；若再放 C，阻塞式 `put` 应等待空位，而不是越界写入。消费者 `take` 取出 A 后腾出一格，等待的生产者才有机会放 C。[Java：BlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html)

在实验里依次尝试“放 A”“放 B”“放 C”“取一个”“重试放 C”。队列按 A→B→C 的顺序传递；“放 C”失败或等待时，C 尚未在队列中。若队列空，消费者也需要等待有新元素或按接口约定超时返回。并发实现要用锁、条件变量或现成并发队列正确协调，不能仅用 `if (empty) sleep()` 猜测状态；被唤醒后还应重新检查条件。[Java：ArrayBlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ArrayBlockingQueue.html)

## 面试回答

有界生产者—消费者队列控制缓冲容量：满时生产者等待、拒绝或超时，空时消费者等待、返回空或超时，具体取决于 API。消费者取走一项后释放容量并可能唤醒生产者。队列让生产速率短时波动可被缓冲，但若长期生产快于消费，有限容量最终仍会产生回压；进程内队列通常不保证宕机后任务仍在。

## 常见误区

- **“满了再扩成无限容量就没有过载。”** 只是把过载转成内存和延迟风险。
- **“消费者醒来后无需再判断队列非空。”** 条件可能被其他消费者抢先改变。
- **“队列里有 B，取出 A 后下一项是 C。”** FIFO 下一项仍是 B。

## 选择题

容量 2 的队列当前为 `[A,B]`；消费者取出一项后，队列是什么？

- A. `[A,C]`
- B. `[B]`
- C. `[A]`
- D. `[C]`

**答案：B。** FIFO 先取 A，B 留在队列；尚未成功入队的 C 不会自动出现。

## 参考资料

- [Java：BlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html)
- [Java：ArrayBlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ArrayBlockingQueue.html)
