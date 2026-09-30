---
slug: "cache-write-through-back"
title: "写直达和写回到底何时更新下层"
description: "固定同一缓存行连续写两次再淘汰，追踪缓存值、下层值和脏位的变化。"
subject: "计算机基础"
order: 40
minutes: 17
lab: "workbench"
objectives: ["区分写直达与写回的更新时点", "推导脏位何时置位与清除", "分清缓存写策略与断电持久化"]
prerequisites: ["cache-locality"]
---

# 缓存写策略：谁手里是最新值

## 只讨论命中的写

本课先固定一个**已命中**的缓存行 A：缓存和下层内存都存 10，随后 CPU 写 A=11、再写 A=12，最后该行被淘汰。写直达（Write-Through）在每次缓存写入时也向下层提交相应写入；写回（Write-Back）先只改缓存、标为脏（Dirty），通常在脏行被淘汰等需要时才写到下层。本例把下层写操作视作已完成的教学状态，不模拟写缓冲、总线排队或多级缓存。[MIT Computation Structures：写策略与脏位](https://computationstructures.org/lectures/caches/caches.html)

| 操作后 | 写直达：缓存 / 下层 | 写回：缓存 / 下层 / 脏位 |
| --- | --- | --- |
| 初始 | 10 / 10 | 10 / 10 / 否 |
| 写 11 | 11 / 11 | 11 / 10 / 是 |
| 写 12 | 12 / 12 | 12 / 10 / 是 |
| 淘汰 A | 下层仍 12 | 脏行写回后下层为 12 |

按本例统计：写直达两次 CPU 写引出两次下层写；写回直到淘汰才进行一次下层写。它解释了为什么连续改同一缓存行时写回可能减少下层流量，但脏位和淘汰流程更复杂。真实系统仍可能在其他时机清理或写回；不能把“只在淘汰时”当成所有硬件的绝对规则。[MIT Computation Structures：write-back](https://computationstructures.org/lectures/caches/caches.html)

## 逐步推演

### 初始副本一致

A 的缓存副本和下层副本都是 10，写回模式的脏位为否。

### 第一次写成 11

两种策略都先让 CPU 看到缓存中的 11；写直达的下层也更新为 11，写回的下层暂时仍是 10、脏位变是。

### 第二次写成 12

写直达再次向下层写 12；写回只改缓存副本到 12，脏位继续为是，不必把中间值 11 写到下层。

### 淘汰之前处理脏行

写回模式不能直接丢弃缓存中唯一的最新值 12；应把脏行写到下层，再复用该槽。写直达模式的下层已经是 12。

## 不能混同的边界

写缺失（Write Miss）还要另选写分配（Write Allocate）或绕过缓存等策略，本例始终命中，因此不推导缺失行为。缓存“下层”可为另一层缓存或主存，主存更新**不等于文件已持久化到 SSD**。多核缓存一致性也不由单核写回策略单独保证。实际写直达可有写缓冲，CPU 不必每次都同步等待 DRAM。[MIT Computation Structures：缓存设计选择](https://computationstructures.org/lectures/caches/caches.html)

## 面试回答

写直达在缓存写入时也向下层提交写入，便于保持下层副本及时；写回先更新缓存并设置脏位，待淘汰或其他清理时才把最新行写到下层，可减少连续写同一行的下层流量。比较时要说明写命中/缺失、写缓冲与下层是哪一层；不能把主存同步误认为磁盘持久化，也不能用写策略替代跨核一致性机制。

## 选择题

按本例已命中、两次写同一行然后淘汰，写回模式在淘汰前下层 A 的值是多少？

- A. 10
- B. 11
- C. 12
- D. 无法知道 CPU 写入的值

**答案：A。** 写回先把 11、12 保存在脏缓存行，下层仍保留初始 10；淘汰前才需写回最新 12。B、C 把写回误当写直达，D 忽略给定状态。

## 参考资料

- [MIT Computation Structures：The Memory Hierarchy](https://computationstructures.org/lectures/caches/caches.html)
