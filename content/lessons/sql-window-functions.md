---
slug: "sql-window-functions"
title: "进阶：窗口函数保留每条原始行"
description: "在分组聚合之后学习窗口函数：同一学生多次成绩，既看每条成绩又看组内名次。"
subject: "数据库"
order: 134
minutes: 20
lab: "sql"
objectives: ["区分 GROUP BY 汇总行和窗口函数保留行", "手算 PARTITION BY 内的计数和名次", "用 ROW_NUMBER 选择每组一条记录"]
prerequisites: ["sql-basics", "sql-grouping"]
---

# 进阶：窗口函数保留每条原始行

## 什么时候需要这一课

这节是学过 `GROUP BY` 后的**进阶拓展**，不是基础面试必须背诵的函数大全。问题是：想输出每次考试的成绩，同时给每行附上该学生的考试次数、平均分和组内名次。普通分组聚合（Aggregation）会把同一个学生的多行压成一行；窗口函数（Window Function）可以在保留行的同时，依据相关行计算值。[SQLite：Window Functions](https://www.sqlite.org/windowfunctions.html)

在 SQLite 中，`OVER (...)` 指定窗口；`PARTITION BY student_id` 把学生分成互不混合的分区。它与 `GROUP BY` 都有“按编号划分”的意思，但输出形状不同：本例 `GROUP BY student_id` 得两行；窗口查询仍得五行。

## 输入：先给成绩增加并列

实验预置的 `scores` 有三行：`(rowid 1, 学生 1, 80)`、`(rowid 2, 学生 1, 90)`、`(rowid 3, 学生 2, 60)`。下面再插入 `(学生 1, 90)` 与 `(学生 2, 75)`，在这个新建的 SQLite 数据库中分别得到 `rowid 4`、`rowid 5`。`rowid` 是本实验普通表的行标识；其他数据库不一定有这个名字。

## 实验代码

```sql
INSERT INTO scores (student_id, score) VALUES (1, 90), (2, 75);

SELECT rowid AS record_id, student_id, score,
       COUNT(*) OVER (PARTITION BY student_id) AS attempts,
       ROUND(AVG(score) OVER (PARTITION BY student_id), 2) AS average_score,
       ROW_NUMBER() OVER (
         PARTITION BY student_id ORDER BY score DESC, rowid ASC
       ) AS row_number,
       RANK() OVER (
         PARTITION BY student_id ORDER BY score DESC
       ) AS score_rank
FROM scores
ORDER BY student_id, rowid;
```

学生 1 的三条成绩是 80、90、90，故每行的 `attempts` 都是 3，`average_score` 都是四舍五入到两位小数的 `86.67`。学生 2 的两条成绩 60、75 对应次数 2、均分 67.5。窗口的计算值被附在每条原始行上，不会把它们合并。

| record_id | student_id | score | attempts | average_score | row_number | score_rank |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 80 | 3 | 86.67 | 3 | 3 |
| 2 | 1 | 90 | 3 | 86.67 | 1 | 1 |
| 4 | 1 | 90 | 3 | 86.67 | 2 | 1 |
| 3 | 2 | 60 | 2 | 67.5 | 2 | 2 |
| 5 | 2 | 75 | 2 | 67.5 | 1 | 1 |

`ROW_NUMBER()` 给每行不同序号；同为 90 分时，用 `rowid ASC` 决定记录 2 先于记录 4。`RANK()` 只按分数排，两个 90 分并列第 1，下一条 80 分是第 3。若不用破平局键，`ROW_NUMBER()` 对同分行的编号不应被当成稳定业务规则。[SQLite：Ranking Functions](https://www.sqlite.org/windowfunctions.html#built_in_window_functions)

## 三种 ORDER BY 不要混淆

- `PARTITION BY student_id` 规定在哪些行之间计算，不指定最终显示顺序。
- `OVER (PARTITION BY student_id ORDER BY score DESC, rowid ASC)` 中的排序决定 `ROW_NUMBER()` 的编号次序。
- 查询末尾的 `ORDER BY student_id, rowid` 决定最终结果显示顺序；所以记录 1 虽被编为第 3 名，仍显示在该学生的第一行。

去掉最后的 `ORDER BY`，不能因为窗口里有排序就保证查询输出也按分数排列。

## 每组只取最高的一行

窗口结果不能直接写在同层查询的 `WHERE row_number = 1` 中筛选；SQLite 的窗口函数只能放在 SELECT 列表和 ORDER BY。先在公用表表达式（Common Table Expression，CTE）中编号，再由外层按编号筛选：[SQLite：Window Functions](https://www.sqlite.org/windowfunctions.html)

```sql
INSERT INTO scores (student_id, score) VALUES (1, 90), (2, 75);
WITH ranked AS (
  SELECT rowid AS record_id, student_id, score,
         ROW_NUMBER() OVER (
           PARTITION BY student_id ORDER BY score DESC, rowid ASC
         ) AS position
  FROM scores
)
SELECT student_id, record_id, score
FROM ranked
WHERE position = 1
ORDER BY student_id;
```

把这整段**替换**实验代码再运行，预期选出 `(学生 1, 记录 2, 90)` 和 `(学生 2, 记录 5, 75)`。这里的结果是“每组取一条最高分记录”；如果需求是“所有并列最高分记录”，`ROW_NUMBER()=1` 不合适，应改用并列名次或其他条件。

## 面试回答

`GROUP BY` 聚合通常把多行汇成每组一行；窗口函数使用 `OVER` 在相关行上计算，却可保留每条原始行。`PARTITION BY` 划分窗口，窗口内 `ORDER BY` 控制排名顺序，不保证最终输出顺序；最终仍需外层 `ORDER BY`。`ROW_NUMBER` 给同分行不同编号，`RANK` 允许并列且留下名次空缺。要筛选窗口计算结果，先在子查询或 CTE 中计算再由外层过滤。

## 选择题

学生 1 有三行分数 `80、90、90`。使用 `ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY score DESC, rowid ASC)` 时，下列哪项正确？

- A. 查询只能保留一行，因为 PARTITION BY 等同 GROUP BY。
- B. 两个 90 分必然得到相同的 ROW_NUMBER。
- C. 三行仍保留，并得到三个不同序号；同分顺序由 rowid 打破。
- D. 窗口里的 ORDER BY 保证最终输出按分数降序。

**答案：C。** 窗口计算不会把三行压成一行，ROW_NUMBER 必须逐行编号，同分时再比较 rowid。A 混淆窗口与分组聚合；B 是把 ROW_NUMBER 误当并列排名；D 混淆窗口排序与最终结果排序。

## 参考资料

- [SQLite：Window Functions](https://www.sqlite.org/windowfunctions.html)
- [SQLite：SELECT](https://www.sqlite.org/lang_select.html)
