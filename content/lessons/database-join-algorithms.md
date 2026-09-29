---
slug: "database-join-algorithms"
title: "同一条 JOIN 为什么会有不同执行算法"
description: "用三行和四行手算嵌套循环、哈希连接与归并连接的工作方式。"
subject: "数据库"
order: 143
minutes: 20
lab: "walkthrough"
objectives: ["手算小表嵌套循环比较次数", "解释哈希连接与排序归并的适用条件", "明确 SQLite 与其他引擎实现不同"]
prerequisites: ["sql-join", "database-explain-plan"]
---

# 同一条 JOIN 为什么会有不同执行算法

## 逻辑结果不规定物理做法

假设左表 L 的键为 `[1,2,3]`，右表 R 的键为 `[2,3,4,5]`，连接条件 `L.key=R.key`，结果键为 `[2,3]`。SQL 的 JOIN 规定结果语义，但数据库可以用不同**连接算法**（Join Algorithm）得到同一结果；具体计划受索引、排序、数据量、内存、统计信息和数据库实现影响。[PostgreSQL：Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)

## 逐步推演

### 简单嵌套循环：逐对比较

对 L 的每行都扫 R 四行：`1` 比四次无匹配，`2` 比四次命中一次，`3` 比四次命中一次，共 `3×4=12` 次键比较。这是**无索引的朴素嵌套循环**；若内表有适用索引，内层可变为索引查找，不必每次完整扫四行。

### 哈希连接：构建再探测

把 R 的四个键放进哈希结构，依次用 L 的 `1,2,3` 探测，得到 2、3。理想情况下构建与探测的工作量随两边行数增长，代价还包括哈希计算与内存；内存不够、数据倾斜或键类型不适合时会有额外成本。[PostgreSQL：Hash Join](https://www.postgresql.org/docs/current/using-explain.html)

### 归并连接：沿有序输入同步前进

若两侧已按键排序，先比较 `1` 与 `2`，推进 L；再匹配 `2`，推进双方；匹配 `3` 后继续。若原始输入无序，预先排序本身要付成本；重复键还需正确输出所有匹配组合。[PostgreSQL：Merge Join](https://www.postgresql.org/docs/current/using-explain.html)

## 面试回答

JOIN 的逻辑条件与物理算法分离。朴素嵌套循环逐对找匹配，可用内表索引优化；哈希连接通常为等值连接建哈希表再探测，消耗内存；归并连接利用两侧有序性，若未排序需计入排序成本。不同数据库支持的算法不一样，例如 SQLite 当前的 JOIN 计划以嵌套循环组织，不能看到上述三种概念就说 SQLite 会自动在三者中任选。[SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)

## 常见误区

- **“嵌套循环永远是 12 次完整扫描。”** 本例是朴素无索引版本，索引会改变内层访问方式。
- **“哈希连接适合任意大于小于条件。”** 它主要服务于可哈希的等值条件。
- **“归并连接不需要准备成本。”** 未有序时排序可能抵消优势。

## 选择题

本例无索引朴素嵌套循环需要做多少次键比较？

- A. 2
- B. 7
- C. 12
- D. 24

**答案：C。** L 三行分别与 R 四行比较，共 3×4=12 次。

## 参考资料

- [PostgreSQL：Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)
