---
slug: "sql-grouping"
title: "分组统计与 HAVING"
description: "从三条成绩记录算出每人的次数和均分，区分过滤原始行、分组、聚合与过滤分组。"
subject: "数据库"
order: 28
minutes: 22
lab: "sql"
objectives: ["逐组计算 COUNT 与 AVG", "区分 WHERE 和 HAVING 的作用对象", "说明 NULL 对聚合结果的影响"]
prerequisites: ["sql-basics"]
---

# 分组统计：每位学生考了几次，平均多少分

## 从行变成组

之前的查询逐行筛选成绩。如果问题变成“每位学生的平均分是多少”，就需要把同一学生的多条记录放到一起。
分组（Grouping）由 `GROUP BY` 指定分组依据；这里按照 `student_id` 把记录划分为不同组。
聚合函数（Aggregate Function）把一组输入算成一个结果，例如计数 `COUNT`、求和 `SUM`、平均值 `AVG`。

“组”不是新建的永久数据库表，而是理解这条查询结果的方式。
本课输入中一个学生可以有多次成绩，学生编号不唯一；不要把成绩条数直接当作学生人数。
实验使用 SQLite，页面每次运行都会重新准备下面的初始数据。

## 输入数据

`students` 保存三位学生；本课查询只用 `scores`，没有成绩的学生不会凭空出现在这张表的分组中。

| students.id | name |
| --- | --- |
| 1 | Lin |
| 2 | Zhou |
| 3 | Xu |

| scores.student_id | score |
| --- | --- |
| 1 | 80 |
| 1 | 90 |
| 2 | 60 |

学生 1 的组有两行，分数是 80、90；学生 2 的组有一行，分数是 60。
学生 3 在 `scores` 中没有行，所以只对 `scores` 分组不会得到编号 3。

## 先手算，再看 SQL

学生 1：次数为 2，有分数的次数也是 2，均分 `(80 + 90) / 2 = 85`。
学生 2：次数为 1，均分 `60 / 1 = 60`。
如果要求“至少有两次记录”，则只保留学生 1 这一组。

| student_id | attempts | scored | average_score |
| --- | --- | --- | --- |
| 1 | 2 | 2 | 85.0 |

`attempts` 和 `scored` 是输出列别名（Column Alias），不表示给原表添加了新列。
本例使用整数分数；SQLite 的 AVG 返回浮点结果，`ROUND(..., 1)` 将结果舍入到一位小数。

## 实验代码

```sql
SELECT student_id,
       COUNT(*) AS attempts,
       COUNT(score) AS scored,
       ROUND(AVG(score), 1) AS average_score
FROM scores
GROUP BY student_id
HAVING COUNT(*) >= 2
ORDER BY student_id;
```

这条查询得到上表中的一行。去掉 HAVING 后，会得到学生 1、2 的两行统计结果。
`ORDER BY` 明确要求按编号排序；不能仅因为写了 GROUP BY 就依赖结果总是有序。

## WHERE 与 HAVING 的差别

`WHERE` 过滤原始行，`HAVING` 过滤分组后的结果。
可以按“取输入 → WHERE → 分组聚合 → HAVING → 输出及排序”的逻辑理解本例，但这不规定数据库实际物理执行顺序。

```sql
SELECT student_id, AVG(score) AS average_score
FROM scores
WHERE score >= 90
GROUP BY student_id
ORDER BY student_id;
```

先过滤原始行，只剩 `(1,90)`，因此学生 1 的均分是 90，而不是原来的 85。
如果要求的是“原始全部成绩的均分至少 80”，应保留原始成绩，再使用 `HAVING AVG(score) >= 80`。
后一种写法得到 `(1,85.0)`。两个条件看起来相近，回答的却是不同问题。

## COUNT 和 NULL 的陷阱

空值（NULL）表示缺失或未知，不等同于数字 0。COUNT 的两种常见写法并不完全相同。

- `COUNT(*)` 计算行数，即使该行的 score 为 NULL 也计入。
- `COUNT(score)` 只计算 score 非 NULL 的行。
- `AVG(score)` 忽略 NULL；没有非 NULL 输入时返回 NULL，而不是 0。

在实验中把代码替换为下面这段，可以实际比较：

```sql
INSERT INTO scores VALUES (1, NULL);
SELECT student_id, COUNT(*) AS rows_count,
       COUNT(score) AS scored_count, AVG(score) AS average_score
FROM scores
GROUP BY student_id
ORDER BY student_id;
```

学生 1 得到 `rows_count = 3`、`scored_count = 2`、`average_score = 85.0`。
这里 NULL 没有变成 0 参加平均，也没有让整组被删除。学生 2 仍是 `1、1、60.0`。
如果把缺失成绩替换成 0 再平均，学生 1 会变成 `170 / 3`，业务含义已经改变，不能随意替换。

## 一个会报错的写法

```sql
SELECT student_id, COUNT(*)
FROM scores
WHERE COUNT(*) >= 2
GROUP BY student_id;
```

WHERE 在逻辑上作用于原始行，此时不能在这里用当前分组的 COUNT 作为条件。
SQLite 会报告聚合函数使用不当（`misuse of aggregate function COUNT()`）；具体错误文本可能随版本变化。
把该条件移到 `GROUP BY student_id` 后的 `HAVING COUNT(*) >= 2`，才表达“保留至少两行的组”。

## 另一个更隐蔽的错误

```sql
SELECT student_id, score, AVG(score)
FROM scores
GROUP BY student_id;
```

学生 1 有 80、90 两个 score，却只输出一行，裸露的 `score` 列究竟取哪一个没有在语义中说清。
SQLite 允许部分这样的非标准裸列写法，但不能把任意选出的 score 理解成该组的明确代表值。
其他数据库或严格模式可能直接拒绝。需要最高分就写 `MAX(score)`，需要全部原始记录则不应把它们压成一行。

## 面试回答

GROUP BY 按指定表达式分组，COUNT、SUM、AVG 等聚合函数在组内计算结果。
WHERE 过滤分组前的原始行，HAVING 过滤分组结果，因此二者可能改变不同层面的数据。
COUNT(*) 统计行数，COUNT(列) 忽略该列的 NULL；AVG 也忽略 NULL。结果排序要明确写 ORDER BY，不能依赖分组顺序。

## 选择题

某组的 score 为 80、90、NULL。COUNT(*)、COUNT(score)、AVG(score) 分别是多少？

- A. 3、3、约 56.67。
- B. 3、2、85。
- C. 2、2、85。
- D. 3、2、NULL。

**答案：B。** COUNT(*) 计三行；COUNT(score) 和 AVG(score) 忽略 NULL，因此分别是 2 和 `(80+90)/2`。A 把 NULL 当成 0，C 把计行数误当计非空值，D 忽略了 AVG 仍有两个有效输入。

## 面试追问

“COUNT(student_id) 等于学生人数吗？”不一定；同一个学生有多行时会重复计数。统计不同非空编号可使用 `COUNT(DISTINCT student_id)`，本例为 2。
“为什么学生 3 没有结果？”输入 scores 中根本没有他的记录。要包括没有成绩的学生，需要从 students 出发处理连接关系，不能仅修改聚合函数。
“没有任何输入行时 COUNT 与 AVG 呢？”不带 GROUP BY 的聚合查询仍产生一行，COUNT 为 0，AVG 为 NULL；有 GROUP BY 时没有组就不会产生分组结果行。

## 官方参考

- [SQLite：SELECT](https://www.sqlite.org/lang_select.html)，WHERE、分组、HAVING 与裸列的语义。
- [SQLite：Aggregate Functions](https://www.sqlite.org/lang_aggfunc.html)，COUNT、AVG、NULL 与 DISTINCT 的规则。
