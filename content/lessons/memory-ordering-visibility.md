---
slug: "memory-ordering-visibility"
title: "一个线程写完数据，另一个线程为何未必看见"
description: "用发布标记说明可见性与 happens-before，不把原子性误当作跨变量同步。"
subject: "并发与系统设计"
order: 151
minutes: 19
lab: "workbench"
objectives: ["区分单次原子写与跨线程可见性", "沿同步关系推断发布后的数据", "说明结论必须依赖语言内存模型"]
prerequisites: ["atomic-cas-basics", "synchronization"]
---

# 一个线程写完数据，另一个线程为何未必看见

## 先约定语言模型

以下按 **Go 内存模型**讨论。共享 `data` 初始为 0，`ready` 是 `sync/atomic` 的布尔原子变量。写者先执行普通写 `data=42`，再 `ready.Store(true)`；读者用 `ready.Load()` 观察到 `true` 后读取 `data`。Go 规定原子操作有顺序一致语义，观察到该原子写的读操作建立同步关系；与写者先前的普通写一起形成 **happens-before**，故在“没有其他线程再写 data”的前提下读者可看到 42。[Go：The Go Memory Model](https://go.dev/ref/mem)

## 逐步推演

### 写者先准备内容

写者执行 `data=42`。此刻若读者直接无同步地读取 `data`，与写者并发时会产生数据竞争；不能靠“代码看起来先写”推断另一个线程的可见性。

### 写者发布标记

写者再执行 `ready.Store(true)`。这一步使“内容已准备好”与原子标记形成发布顺序，不是把 `data` 本身变成原子变量。

### 读者观察标记再读取

当读者的 `ready.Load()` 读到这次 `true`，它之后读取 `data` 能沿同步关系看到先前的 42。若只读取到 `false`，本例不能由此断言 `data` 必仍为 0；读者应继续等待或走其他逻辑。

## 面试回答

原子性回答“一个操作是否被交错拆开”，可见性和顺序回答“另一个线程何时能按规则看到先前写入”。必须依据语言内存模型建立同步关系，例如本例 Go 中先写 `data`、再用原子 `ready` 发布，读者读到该标记后才安全读取数据。只把 `ready` 换成普通共享变量不能获得同样保证；具体 C++、Java 等语言的 API 和内存序需按各自规范说明。

## 常见误区

- **“CPU 最终会刷新缓存，所以代码总是对的。”** 正确性依赖同步规则，而非等待一段时间。
- **“某个标记是原子的，其他共享数据就自动安全。”** 必须有正确发布/观察关系且避免其他无序写。

## 选择题

按本课 Go 示例，哪一步让读者对 `data=42` 的观察有规范依据？

- A. 写者睡眠 1 毫秒
- B. 读者观察到写者发布的原子 `ready=true`
- C. 给普通 `data` 起名为 `atomicData`
- D. 两个线程在同一 CPU 上运行

**答案：B。** 同步操作建立 happens-before；时间和命名不构成内存模型保证。

## 参考资料

- [Go：The Go Memory Model](https://go.dev/ref/mem)
- [Go：sync/atomic](https://pkg.go.dev/sync/atomic)
