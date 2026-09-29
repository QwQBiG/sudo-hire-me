---
slug: "cache-mapping-associativity"
title: "同样四个缓存槽为什么命中率不同"
description: "固定 4 个缓存行槽位，逐次追踪主存行 0 和 4 在直接映射与二路组相联下的冲突。"
subject: "计算机基础"
order: 39
minutes: 18
lab: "cache-mapping"
objectives: ["算出主存行对应的组号与标记", "对比同容量两种映射的命中缺失", "解释组相联的收益与替换代价"]
prerequisites: ["cache-locality", "memory-units"]
---

# 缓存映射：明明还有空位，为什么仍会缺失

## 先固定教学模型

缓存映射（Cache Mapping）决定一个主存块能放在哪些缓存槽位。直接映射（Direct-Mapped）只有一个指定槽位；N 路组相联（N-Way Set-Associative）只能进指定组，但组内有 N 个候选槽。一次访问先由地址确定主存行，再用组号选择组、用标记（Tag）判断当前内容是不是所需行。实际处理器参数各异，本课固定：每行 16 字节、总共 4 个缓存行槽、缓存初始为空，只读不写。[MIT Computation Structures：缓存映射](https://computationstructures.org/lectures/caches/caches.html)

主存行号 `block=floor(address/16)`。本课实验直接点击主存行号 0..7；直接映射有 4 组×1 路，`组=block mod 4`；二路组相联有 2 组×2 路，`组=block mod 2`。组内满时，本例用最近最少使用（Least Recently Used，LRU）淘汰。`tag=floor(block/组数)` 便于在同组内区分不同主存行。[MIT 缓存实验：组、路与替换](https://computationstructures.org/exercises/caches/lab.html)

## 看 0、4、0、4

| 访问 | 直接映射：组 0 的内容与结果 | 二路组相联：组 0 的内容与结果 |
| --- | --- | --- |
| 行 0 | 空→0，缺失 | 空→0，缺失 |
| 行 4 | 0→4，缺失并淘汰 0 | 从 {0} 到 {0,4}，缺失，用第二路 |
| 行 0 | 4→0，缺失并淘汰 4 | 0、4 不变，命中 |
| 行 4 | 0→4，缺失并淘汰 0 | 0、4 不变，命中 |

结果是直接映射 0/4 命中、二路组相联 2/4 命中，容量**同为四行**。差别来自行 0 与 4 在直接映射必须争同一个槽；二路组相联在同组内可共存。组相联也不是万能：再不断访问同组的更多行，仍可能替换；增加路数通常也带来比较与实现复杂度。[MIT Computation Structures：冲突缺失](https://computationstructures.org/lectures/caches/caches.html)

## 面试回答

直接映射把每个主存行固定到一个缓存槽，硬件简单，但不同主存行若映到同槽，可能反复互相挤掉。组相联先定组、组内允许多个路，以同等总容量降低一部分冲突缺失，但组满仍需替换规则。看命中率要同时给出行大小、容量、映射方式、访问序列和初始状态；不能笼统说“访问过就命中”或“组相联必然没有缺失”。

## 实验边界

实验只处理主存行 0..7，固定四个槽，读访问，二路组内采用 LRU；不模拟多级缓存、预取、实际时延和写策略。点击“直接映射/二路组相联”会清空缓存与计数，否则旧内容无法公平比较。`组号`是教学模型的索引，不是虚拟地址、页号或真实 CPU 的完整地址解析过程。

## 选择题

在本课空缓存和四次访问 `0,4,0,4` 下，二路组相联的命中次数是多少？

- A. 0
- B. 1
- C. 2
- D. 4

**答案：C。** 前两次分别装入同一组的两个路，后两次重访命中。A 是直接映射的冲突结果，D 忽略初始为空。

## 参考资料

- [MIT Computation Structures：The Memory Hierarchy](https://computationstructures.org/lectures/caches/caches.html)
- [MIT 缓存实验：关联度与替换策略](https://computationstructures.org/exercises/caches/lab.html)
