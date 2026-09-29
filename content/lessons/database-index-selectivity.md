---
slug: "database-index-selectivity"
title: "列上有索引，查询为何仍可能扫表"
description: "比较高选择性和低选择性条件的命中数量，理解优化器的成本判断。"
subject: "数据库"
order: 142
minutes: 17
lab: "walkthrough"
objectives: ["按数据分布计算条件命中比例", "说出索引查找之外的取行成本", "解释统计信息与实际计划的关系"]
prerequisites: ["database-indexes", "database-explain-plan"]
---

# 列上有索引，查询为何仍可能扫表

## 选择性从数据分布来

假设 `orders` 有 1000 行，`user_id` 唯一；`status='active'` 有 900 行，`status='archived'` 有 100 行。这里把**选择性**（Selectivity）说成“条件筛掉多少行”时，`user_id=42` 选择性高，而 `status='active'` 选择性低。注意有的资料用“命中比例”表述数值：分别为 `1/1000=0.1%` 与 `900/1000=90%`，数值越低反而筛得越多。面试要先说明自己采用的口径。[SQLite：Query Planner](https://www.sqlite.org/queryplanner.html)

## 逐步推演

### 按条件估算匹配行数

`WHERE user_id=42` 预计取 1 行；`WHERE status='active'` 预计取 900 行。若 `status` 有索引，这不代表 900 行会免费出现：索引定位之后还可能要从表中读取所需列。

### 对比两种访问路径

全表扫描顺序看约 1000 行；索引路径先查索引，再获取匹配的表行。对只命中 1 行的条件，索引通常有优势；对命中 900 行且需要多列的条件，扫描可能更划算。这是成本直觉，不是由这几个数字就能算出实际计划。

### 加入统计信息与覆盖条件

优化器依赖统计信息估计分布，可能受表大小、索引是否覆盖查询、缓存状态等因素影响。SQLite 的 `ANALYZE` 可收集统计信息，`EXPLAIN QUERY PLAN` 可观察该连接上的实际选用路径；别把某次 SQLite 输出当作所有数据库的固定规则。[SQLite：ANALYZE](https://www.sqlite.org/lang_analyze.html) [SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)

## 面试回答

有索引不代表一定使用。优化器比较索引查找、回表和扫描等成本；高命中比例的条件可能让全表扫描更划算，特别是查询还需要索引外的列。选择性受真实数据分布影响，还要看统计信息、覆盖情况和具体引擎的计划，最终应通过执行计划与实际数据验证。

## 常见误区

- **“等值条件必走索引。”** 条件形式不是唯一依据，命中比例和成本同样重要。
- **“status 只有两种值就一定没用。”** 查罕见值、覆盖查询或其他条件组合时仍可能有价值。
- **“EXPLAIN 证明索引永远被忽略。”** 计划只反映当时的表、统计信息、查询和数据库版本。

## 选择题

在本课的分布中，`WHERE status='active'` 预计匹配多少行？

- A. 1
- B. 100
- C. 900
- D. 1000

**答案：C。** 900/1000 行是 active，因此该条件筛除的行很少。

## 参考资料

- [SQLite：Query Planner](https://www.sqlite.org/queryplanner.html)
- [SQLite：ANALYZE](https://www.sqlite.org/lang_analyze.html)
