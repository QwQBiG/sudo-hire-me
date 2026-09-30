---
slug: "cache-consistency-basics"
title: "数据库改成 120，缓存为何仍显示 100"
description: "按 Cache-Aside 时间线看读命中、写库、删缓存和并发回填竞态。"
subject: "并发与系统设计"
order: 161
minutes: 20
lab: "workbench"
objectives: ["追踪旁路缓存的读写流程", "指出删缓存失败和并发回填的旧值窗口", "说出 TTL、版本校验等缓解方式的边界"]
prerequisites: ["cache-locality", "database-transactions"]
---

# 数据库改成 120，缓存为何仍显示 100

## 先定义旁路缓存

**旁路缓存**（Cache-Aside）让应用在读时先查缓存，未命中再读数据库并回填；写时先改数据库，再删除相应缓存键，是一种常见流程，不自动构成强一致事务。缓存与数据库是两个独立系统，中间会有短暂窗口；TTL（Time To Live）能限制某些旧值存活时间，但不能保证实时一致。[Azure Architecture Center：Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)

## 逐步推演

### 首次读取：缓存 100

数据库余额 100，缓存未命中，应用读出 100 并回填缓存。后续请求命中缓存返回 100，少一次数据库读取。

### 写入数据库 120，尚未删缓存

更新事务提交后数据库是 120，但缓存仍是 100。在删除操作完成之前，读请求可能命中旧值；若删除失败，旧值甚至会继续存在到过期或修复。

### 删除后仍要防并发旧值回填

更细的交错：读者先发生缓存未命中并从数据库读到旧值 100，尚未回填；写者将数据库改为 120 并删缓存；随后读者把先前拿到的 100 写回缓存。仅按“先写库再删缓存”排序，不能自动排除这种并发竞态。可结合版本校验、延迟二次失效、事件同步或合理 TTL 缓解，强一致要求需更严格设计。[Azure Architecture Center：Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)

## 面试回答

Cache-Aside 读未命中时从数据库回填，写数据库后失效缓存。它改善读性能，但数据库与缓存之间不是天然原子更新，写库到失效之间、失效失败以及并发旧值回填都会产生陈旧读。面试应先描述具体读写顺序，再说明可接受的一致性窗口和对应策略；不能说“删缓存就绝对一致”。

## 常见误区

- **“TTL 设短就永远读不到旧值。”** TTL 只限制时长，不消除窗口。
- **“写库成功一定意味着缓存已同步。”** 缓存删除是另一步，可能失败。
- **“把删除放在写库前就万无一失。”** 仍可能被并发读取回填旧值。

## 选择题

读者先拿到旧值 100，写者随后写库 120 并删除缓存，读者最后回填 100。此时缓存是什么？

- A. 必然为空
- B. 100
- C. 120
- D. 两个值自动合并

**答案：B。** 并发读者在失效之后回填了自己先前读到的旧值。

## 参考资料

- [Azure Architecture Center：Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
