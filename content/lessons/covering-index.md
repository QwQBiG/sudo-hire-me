---
slug: "covering-index"
title: "覆盖索引与回表"
subject: "数据库"
description: "同一棵索引树上，改变查询列，判断什么时候还需要读取表记录。"
order: 140
minutes: 16
lab: "index"
objectives: ["按查询所需列判断索引是否覆盖", "解释索引命中后为何可能回表", "指出覆盖索引不是无条件更快"]
prerequisites: ["database-indexes", "sql-basics"]
---

# 覆盖索引与回表

## 面试回答

覆盖索引（Covering Index）不是一种脱离查询而固定存在的索引类型，而是指**某次查询**需要的列都能从某个索引中取得，无须再读取表记录。若索引可定位条件但缺少输出列，执行器可能沿索引找到行标识，再到表中取列，通常称为回表。是否真的选用该索引仍由数据库的查询规划器（Query Planner）根据代价决定，不能只看 SQL 有 WHERE 条件就断言一定走索引。[SQLite 官方文档：Covering Indexes](https://www.sqlite.org/queryplanner.html#covering_indexes)

## 同一索引，两个 SELECT

假设教学表 `grades(rowid, score, name)` 有按 `score` 排序的索引；索引项包含 `score` 和可定位表记录的 `rowid`，而 `name` 仅在表记录中。这里借用 SQLite 行标识的简化模型，真实数据库的索引叶内容随产品和表结构不同。

```sql
SELECT score FROM grades WHERE score = 62;
SELECT name  FROM grades WHERE score = 62;
```

两句都可以先按 `score=62` 走索引路径，但第一句要输出的 `score` 已在索引项中；第二句还需要索引项没有的 `name`，于是要依 `rowid` 读取表记录。若改成包含 `score` 与 `name` 的合适索引，第二句在满足其他查询需求时也可能被覆盖。注意 `SELECT *` 通常增加需要取得的列，容易失去覆盖优势。

| 查询 | 索引中有筛选列吗 | 索引中有输出列吗 | 本例是否需要额外读取表记录 |
| --- | --- | --- | --- |
| `SELECT score ...` | 有 | 有 | 不需要 |
| `SELECT name ...` | 有 | 没有 | 需要 |

在网站实验里勾选“只取 score”，可观察表记录节点不再被访问；取消勾选并查询存在的 62，则需要再读表。目标 42 不存在时，走到索引叶子确认缺失即可，不存在“找到对应行后回表”。实验显示的节点数和行数是教学单位，不代表实际 I/O 次数或耗时。

## 为什么不是索引列越多越好

索引包含更多列会占用更多空间，写入时也要维护，页内可容纳的索引项可能变少。即使某次查询可以被覆盖，规划器也可能因为数据量、选择性或其他代价选择全表扫描。判断某个数据库和具体 SQL 的实际路径，要看执行计划，例如 SQLite 的 `EXPLAIN QUERY PLAN`；不能仅凭语法给出确定结论。[SQLite 官方文档：Query Planning](https://www.sqlite.org/queryplanner.html)

## 常见误区

- **“给 score 建索引后，所有关于 score 的查询都不回表。”** 输出 `name` 等缺少的列仍可能要读表。
- **“覆盖索引只是索引里有 WHERE 的列。”** 还要覆盖查询所需的输出、排序等相关列；以具体执行路径为准。
- **“索引一定比全扫描快。”** 小表、低选择性或高回表代价下，扫描可能更合适。

## 选择题

假设索引项只有 `(score, rowid)`，`name` 只保存在表中。哪句查询最有可能仅用索引完成取值？

- A. `SELECT name FROM grades WHERE score = 62`
- B. `SELECT * FROM grades WHERE score = 62`
- C. `SELECT score FROM grades WHERE score = 62`
- D. `SELECT name FROM grades`，且一定使用索引

**答案：C。** 筛选和输出都只需要索引里的 `score`。A、B 需要 `name`；D 不仅缺少 `name`，还不能保证规划器一定选用该索引。

## 参考资料

- [SQLite 官方文档：Query Planning](https://www.sqlite.org/queryplanner.html)
