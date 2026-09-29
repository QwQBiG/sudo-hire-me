---
slug: "composite-index-order"
title: "联合索引：列的顺序为什么重要"
description: "从 (部门, 分数) 的有序索引推演两种筛选，认识左侧前缀和执行计划的边界。"
subject: "数据库"
order: 138
minutes: 19
lab: "walkthrough"
objectives: ["画出两列索引的字典序", "辨别从左侧列定位的连续范围", "结合执行计划和数据分布评价索引"]
prerequisites: ["database-indexes"]
---

# 联合索引：列的顺序为什么重要

## 从单列索引走到两列索引

联合索引，也称复合索引（Composite Index），把多列按**声明的先后顺序**组成索引键。假设普通 SQLite 表 `results(id, dept, score)` 有索引 `(dept, score)`：先按部门 `dept` 排，再在部门相同的记录中按分数 `score` 排。它不是同时拥有 `(dept, score)` 与 `(score, dept)` 两棵树。[SQLite：Multi-Column Indices](https://www.sqlite.org/queryplanner.html#_multi_column_indices)

本例只有六行，适合手算范围，不适合证明实际查询会更快。数据库会依据数据量、统计信息和代价选择计划；是否真的走索引要看具体环境的 `EXPLAIN QUERY PLAN`，不能由“建了索引”直接推出。[SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)

| id | dept | score |
| --- | --- | --- |
| 1 | A | 60 |
| 2 | A | 80 |
| 3 | A | 90 |
| 4 | B | 60 |
| 5 | B | 80 |
| 6 | B | 90 |

## 逐步推演

### 第一步：写出索引键的顺序

执行 `CREATE INDEX idx_results_dept_score ON results(dept, score);` 后，按键的示意次序是 `(A,60,id 1) → (A,80,id 2) → (A,90,id 3) → (B,60,id 4) → (B,80,id 5) → (B,90,id 6)`。括号中的 id 用来标识示例记录；在普通 SQLite rowid 表里，索引还带有可定位行的 rowid。这里画的是**逻辑有序项**，不是实际磁盘页。

### 第二步：先用左列限定一个连续范围

查询 `WHERE dept = 'A' AND score >= 80`：先定位 `dept='A'` 的相邻索引项，再在 A 的范围内找 `score>=80`。匹配的是 `id 2` 与 `id 3`。`(dept, score)` 的左列条件使相关记录靠在一起；第二列进一步缩小 A 部门内的范围。

### 第三步：试着跳过左列

查询 `WHERE score >= 80` 时，匹配 `id 2、3、5、6`，它们被 A 的 60 分和 B 的 60 分分成不同段；`score` 不是这棵索引的全局第一排序键，不能把所有符合条件的项当成从某个 score 值开始的**单一连续索引区间**。这不意味着 SQLite 绝不使用索引：它可能扫描索引，某些情况下还可能使用跳跃扫描（skip-scan），也可能直接扫描表；策略取决于优化器和统计信息。[SQLite：Skip-Scan Optimization](https://www.sqlite.org/optoverview.html#the_skip_scan_optimization)

### 第四步：把索引顺序和查询需求对齐

若常查“某部门 80 分及以上”，`(dept, score)` 对应本例的先等值后范围。若主要查“所有部门 80 分及以上”，把 `score` 放在索引第一列可能更方便先定位该范围。但列顺序不应只凭一句“选择性高的放前面”决定：还要看真实查询组合、值分布、排序、返回列和索引维护成本。

## 在 SQLite 中核对计划

可在一个 SQLite 数据库里建表、插入上述六行、建立索引，然后比较：

```sql
CREATE TABLE results (
  id INTEGER PRIMARY KEY,
  dept TEXT NOT NULL,
  score INTEGER NOT NULL
);
INSERT INTO results VALUES
  (1, 'A', 60), (2, 'A', 80), (3, 'A', 90),
  (4, 'B', 60), (5, 'B', 80), (6, 'B', 90);
CREATE INDEX idx_results_dept_score ON results(dept, score);

EXPLAIN QUERY PLAN
SELECT id, dept, score FROM results
WHERE dept = 'A' AND score >= 80;

EXPLAIN QUERY PLAN
SELECT id, dept, score FROM results
WHERE score >= 80;
```

`SEARCH` 表示计划中使用可定位的搜索约束，`SCAN` 表示扫描；若出现索引名称和括号里的条件，可用来核对哪些列参与了定位。具体文本和计划会受 SQLite 版本、统计信息与表规模影响。六行表很小，选择扫描并不表示联合索引定义错了；执行计划也不是耗时测量。网站当前实验是上面的**例题逐步推演**，不会执行这段 SQL。[SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)

## 排序也要看前缀

`WHERE dept='A' ORDER BY score` 在 A 的相邻范围内可以利用索引键顺序作为候选路径。若没有固定 `dept`，整棵索引的顺序先是 A 的分数，再是 B 的分数，并非所有部门的全局 `score` 升序。即使优化器利用索引避免额外排序，想规定最终输出顺序也必须在 SQL 中明确写 `ORDER BY`。[SQLite：Searching and Sorting with a Multi-Column Index](https://www.sqlite.org/queryplanner.html#_searching_and_sorting_with_a_multi_column_index)

## 面试回答

联合索引按声明列的先后顺序组织键。例如 `(dept, score)` 先按部门、再按同部门的分数排序；`dept='A' AND score>=80` 能表达一个容易定位的连续范围。只给 `score` 条件不能按第二列构造全局单一连续范围，但不能因此断言索引绝不会被使用。实际是否受益要结合数据分布、查询需求与 `EXPLAIN QUERY PLAN`，不能只背“最左前缀”四个字。

## 常见误区

- **“索引里有 score，`WHERE score >= 80` 必然与 `(score, dept)` 一样定位。”** 两个键序不同；本例分数 80、90 被部门 A/B 分组。
- **“没写第一个索引列，数据库一定做全表扫描。”** SQLite 存在索引扫描和跳跃扫描等可能路径，需看执行计划。
- **“第一列越高选择性，任何查询越快。”** 工作负载若经常按另一列过滤或排序，这个判断可能失效，还要衡量写入与空间。
- **“沿索引读出时 ORDER BY 可以省略。”** 不写 ORDER BY 不保证结果顺序。

## 选择题

表有索引 `(dept, score)`。在本课六行数据中，哪组条件最直接对应按左侧列定位后的连续索引范围？

- A. `WHERE dept = 'A' AND score >= 80`
- B. `WHERE score >= 80`，因为 score 是第二列
- C. `WHERE score = 80 OR score = 90`，因为 OR 会让索引变成按 score 全局排序
- D. 不写 WHERE，索引就保证结果按 score 全局升序

**答案：A。** A 先把范围缩到 A 部门，再利用分数顺序找到 80、90。B、C 没有限定先排序的 dept，匹配项散在不同部门段；D 把索引键序和 SQL 的结果排序保证混为一谈。

## 参考资料

- [SQLite：Query Planning](https://www.sqlite.org/queryplanner.html)
- [SQLite：The Query Optimizer Overview](https://www.sqlite.org/optoverview.html#the_skip_scan_optimization)
- [SQLite：EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)
