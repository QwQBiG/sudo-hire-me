---
slug: "database-explain-plan"
title: "怎样读 SQLite 查询计划"
description: "对同一成绩查询在建索引前后运行 EXPLAIN QUERY PLAN，分清 SCAN、SEARCH 与实际结果。"
subject: "数据库"
order: 141
minutes: 18
lab: "sql"
objectives: ["读取 SQLite 计划中的 SCAN、SEARCH 和索引信息", "区分计划与真实查询结果及耗时", "根据输出检查索引是否被使用"]
prerequisites: ["sql-basics", "database-indexes"]
---

# 怎样读 SQLite 查询计划

## 为什么同一句 SQL 可能走不同路径

SQL 描述想要哪些结果，数据库查询规划器（Query Planner）选择如何取得它们。`EXPLAIN QUERY PLAN` 在 SQLite 中显示查询的访问计划，适合先回答“准备扫描还是搜索？用到哪个索引？”；它不直接返回业务数据，也不等于已经测量过运行时间。[SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)

本课只讲 **SQLite**。MySQL、PostgreSQL 等数据库有各自的 EXPLAIN 格式、术语和优化规则；不要把下文的 `SCAN`、`SEARCH` 文本硬套到其他产品。SQLite 官方还明确警告：`EXPLAIN QUERY PLAN` 的输出格式可能跨版本变化，不适合作为程序稳定解析的接口。

## 实验代码

```sql
EXPLAIN QUERY PLAN
SELECT student_id, score
FROM scores
WHERE student_id = 1;

CREATE INDEX idx_scores_student_score
ON scores(student_id, score);

EXPLAIN QUERY PLAN
SELECT student_id, score
FROM scores
WHERE student_id = 1;

SELECT student_id, score
FROM scores
WHERE student_id = 1
ORDER BY score;
```

网页实验每次运行都有初始 `scores`：`(1,80)、(1,90)、(2,60)`。第一条计划查询在建索引**之前**执行，第二条在建索引**之后**执行，最后一条普通 SELECT 才取得真实成绩 `(1,80)、(1,90)`。若把 `CREATE INDEX` 移到第一条计划之前，就失去前后比较；每次点“运行”都会重新创建内存数据库，不累积上一次的索引。

## 看输出时按三层读

SQLite 的计划结果常包含 `id`、`parent`、`notused`、`detail`。初学时先看 `detail`，树形连接等复杂计划再结合前两列看父子关系：

1. `SCAN scores` 说明计划扫描一个数据源；在本例无索引的单表条件下，它是扫描成绩表。一般情况下 `SCAN` 也可能是**索引扫描**，不能一见 SCAN 就断言“没用任何索引”。
2. `SEARCH scores USING ... INDEX ... (student_id=?)` 说明规划器打算按某个条件使用索引搜索。索引名和括号里的条件帮助核对实际参与定位的列；不是所有 WHERE 列都必然成为搜索边界。
3. `USING COVERING INDEX` 若出现在第二份计划，说明该次查询需要的 `student_id`、`score` 能由这个索引提供；“覆盖”是相对于**当前查询**而言，不表示该索引对所有查询都覆盖。

在项目目前使用的 SQLite 版本，这个小例子通常呈现第一份扫描、第二份按覆盖索引搜索。即使某版本或统计状态选择了别的计划，也应以运行时显示为准；三行数据太少，不能据此得出“索引一定更快”。[SQLite：Query Planning](https://www.sqlite.org/queryplanner.html)

## 计划不是性能结论

`EXPLAIN QUERY PLAN` 告诉我们计划选择，**没有**告诉我们这次查询用了多少毫秒、读取了多少真实磁盘页，或在大表上必然怎样。索引占空间且增加写入维护；小表全扫描可能合理。要评估性能，应在目标数据库、真实数量级和相同工作负载下比较，并注意缓存、统计信息和返回列。[SQLite：EXPLAIN QUERY PLAN 的用途与输出边界](https://www.sqlite.org/eqp.html)

例如把条件改成 `WHERE score = 80`，当前 `(student_id, score)` 索引的首列没有被指定，不能直接把“score 在索引里”当成与 `student_id=1` 相同的连续定位路径。优化器是否仍利用索引，要再看计划；可结合[联合索引：列的顺序为什么重要](./composite-index-order.md)理解。

## 面试回答

在 SQLite 中可用 `EXPLAIN QUERY PLAN` 观察规划器选择的访问路径。读 `detail` 时区分 `SCAN` 的扫描与 `SEARCH` 的条件定位，再看 `USING INDEX` 或 `USING COVERING INDEX` 及实际使用的条件；`SCAN` 也可能扫索引。计划不是耗时测量，更不是所有数据库通用的固定输出，最终仍要结合数据规模、版本、统计信息与真实执行验证。

## 常见误区

- **“看到 SCAN 就说明 SQL 写错。”** 小表扫描可能是合理计划，SCAN 也可能扫描索引。
- **“建了索引，计划必须 SEARCH。”** 规划器会评估代价，不保证选索引。
- **“USING COVERING INDEX 意味着表里所有列都进了索引。”** 它只说明当前查询所需列可从索引获得。
- **“一份 SQLite 计划可以证明 MySQL 也一样执行。”** 数据库产品和版本的计划语义不能直接迁移。

## 选择题

SQLite 对 `SELECT student_id, score FROM scores WHERE student_id=1` 显示 `SEARCH scores USING COVERING INDEX idx_scores_student_score (student_id=?)`。哪个解读最准确？

- A. 本次计划使用索引按 student_id 定位，且该查询所需列可从索引取得。
- B. 该查询已经实测比扫描快十倍。
- C. scores 表以后任何 SELECT 都无需再读表。
- D. MySQL 必然显示完全相同的计划文本。

**答案：A。** `SEARCH`、索引名和括号条件说明本次计划的定位方式，`COVERING` 针对本次所需列。B 把计划当测量，C 把查询相对的覆盖性质推广到所有 SELECT，D 混淆不同数据库。

## 参考资料

- [SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)
- [SQLite：Query Planning](https://www.sqlite.org/queryplanner.html)
