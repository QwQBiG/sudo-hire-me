---
slug: "message-queue-delivery"
title: "消息被消费一次，为什么业务仍可能执行两次"
description: "以 SQS 标准队列的可见性超时为例，追踪重复投递与确认删除。"
subject: "并发与系统设计"
order: 155
minutes: 19
lab: "walkthrough"
objectives: ["区分收到消息、完成副作用和确认删除", "解释至少一次投递下的重复处理", "说出幂等处理与死信队列的作用"]
prerequisites: ["producer-consumer-queue"]
---

# 消息被消费一次，为什么业务仍可能执行两次

## 先限定产品语义

本课以 **Amazon SQS 标准队列**为例，其传递模型是**至少一次**（At-Least-Once Delivery），消费者收到消息后，消息会暂时不可见；消费者成功处理后还需删除消息。可见性超时并非全局“严格独占”的保证，SQS 官方明确说即使在超时内也不能绝对保证不重复投递。其他队列产品的顺序、确认和去重语义可能不同。[AWS：SQS Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)

## 逐步推演

### C1 收到付款消息 M

队列把 M 交给 C1，开始可见性超时。C1 在数据库里记录付款结果，但还未成功删除队列里的 M。**处理业务成功**和**确认消息完成**是两步。

### C1 在确认前崩溃

超时后 M 可再次被投递给 C2；若 C2 直接重复扣款，就可能出现两次业务副作用。至少一次保证的是传递机会，不代表“业务恰好执行一次”。

### C2 幂等检查后确认

C2 用业务唯一键查到 M 对应付款已完成，就不再重复扣款，再按队列协议确认删除。若消息持续失败，可设置重试上限与死信队列（Dead-Letter Queue，DLQ）人工排查；确认与业务状态之间仍需设计正确的一致性边界。[AWS：SQS Dead-Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)

## 面试回答

消息系统的投递成功不等于业务副作用完成。以 SQS 标准队列为例，消费者处理后若未确认删除就崩溃，消息可能再次投递，形成至少一次语义。消费者要用业务 ID 或幂等键防止重复副作用，再确认消息；失败多次的消息可进入死信队列。不要笼统地宣称所有消息队列都天然恰好一次。

## 常见误区

- **“我已经收到消息，队列就永远删掉它。”** SQS 需要显式删除。
- **“可见性超时内绝不重复。”** 官方不作这种绝对保证。
- **“消息去重必然等于业务去重。”** 业务存储的副作用仍需独立保证。

## 选择题

C1 完成数据库扣款后、删除 SQS 消息前崩溃，最需要防范什么？

- A. M 永远不会被看到
- B. M 重投后重复扣款
- C. 队列自动回滚数据库扣款
- D. 可见性超时让消息内容变为空

**答案：B。** 业务与队列确认不是同一个自动原子事务，重投时应做幂等检查。

## 参考资料

- [AWS：SQS Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [AWS：SQS Dead-Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
