---
slug: "sql-join"
title: "SQL 左连接"
subject: "数据库"
description: "没有成绩的学生去了哪里？从两张小表开始理解 JOIN 与 NULL。"
order: 130
minutes: 15
lab: "sql"
objectives: ["解释一对多连接结果","保留没有匹配的行","区分 COUNT(*) 与 COUNT(列)"]
prerequisites: ["sql-basics"]
---

# SQL：没有成绩的学生为什么会消失？

## 从零理解

结构化查询语言（Structured Query Language，SQL）可以连接多张表。左外连接（left outer join，SQL 写作 `LEFT JOIN`）保留左表中没有匹配的行。
表由行和列组成。一行学生记录描述一个学生，一行成绩记录描述一次成绩登记。
`students.id` 标识学生，`scores.student_id` 指出成绩属于谁。
相同列名不是连接的依据，`ON r.student_id = s.id` 才明确了匹配条件。
表别名 `s` 和 `r` 是查询中对两个表的简短称呼，不会改动原表名称。

`NULL` 表示缺失或未知等需要另行解释的状态，不等于数字 0，也不等于空字符串。
查询里判断缺失值使用 `IS NULL`，不能把 `= NULL` 当成普通相等判断。
本课使用 SQLite 语法；实验数据库已经准备好下列两个表。

## 看清输入数据

学生表 `students`：

| id | name |
| --- | --- |
| 1 | Lin |
| 2 | Zhou |
| 3 | Xu |

成绩表 `scores`：

| student_id | score |
| --- | --- |
| 1 | 80 |
| 1 | 90 |
| 2 | 60 |

Lin 有两条成绩，Zhou 有一条成绩，Xu 完全没有成绩记录。
匹配成功的 `r.student_id` 与非空的学生编号相等，可以用它统计真实匹配记录。

## 实验代码

```sql
SELECT s.id, s.name, r.score
FROM students AS s
LEFT JOIN scores AS r ON r.student_id = s.id
ORDER BY s.id, r.score;
```

| id | name | score |
| --- | --- | --- |
| 1 | Lin | 80 |
| 1 | Lin | 90 |
| 2 | Zhou | 60 |
| 3 | Xu | NULL |

上述表格是查询的预期结果。不同工具可能把 `NULL` 显示为空白，本课统一写成 `NULL`。
`ORDER BY` 明确排序；不写它时，不应把某次显示顺序当成 SQL 保证。

## 一步一步推演

1. 对 Lin，找到 `student_id = 1` 的 80、90 两条成绩，分别组成两行。
2. 对 Zhou，找到 `student_id = 2` 的一条成绩，组成一行。
3. 对 Xu，找不到 `student_id = 3` 的记录，保留学生信息，并给右表列补 `NULL`。
4. 按学生编号和成绩排序，得到上面的四行。

这是帮助理解的逻辑推演，不要求数据库引擎必须逐个学生扫描整张成绩表。
如果改成 `INNER JOIN`，没有匹配记录的 Xu 会被排除；另外两名学生仍然保留。
`ON` 判断的是学生编号相等，不是成绩是否存在。

## 再统计每个学生

```sql
SELECT s.id, s.name,
       COUNT(*) AS joined_rows,
       COUNT(r.student_id) AS records,
       COUNT(r.score) AS known_scores
FROM students AS s
LEFT JOIN scores AS r ON r.student_id = s.id
GROUP BY s.id, s.name
ORDER BY s.id;
```

| id | name | joined_rows | records | known_scores |
| --- | --- | --- | --- | --- |
| 1 | Lin | 2 | 2 | 2 |
| 2 | Zhou | 1 | 1 | 1 |
| 3 | Xu | 1 | 0 | 0 |

`GROUP BY` 先把同一个学生对应的结果行归为一组，三个 `COUNT` 分别在组内统计。
Xu 的组有一条补齐行，因此 `COUNT(*)` 是 1；该行的右表列都是 `NULL`，另外两项是 0。
若再为 Zhou 登记一条 `score` 为 `NULL` 的记录，其 `records` 会变成 2，`known_scores` 仍为 1。
因此“有记录但成绩未知”和“根本没有成绩记录”应分别处理，不能只看成绩列是否为空。
若成绩为 0，`COUNT(r.score)` 会计入它；被忽略的是 `NULL`，不是数值 0。

## 常见错误

- **“左连接后每个学生只有一行。”** 一对多匹配会产生多行；需要统计时应明确分组。
- **“COUNT(*) 就是成绩次数。”** 它包含没有匹配时保留下来的补齐行。
- **“COUNT(score) 总是成绩记录数。”** 实际记录的成绩列也可能为 `NULL`。
- **“加 DISTINCT 就能修好重复。”** 先明确要每次成绩还是每个学生，不能借去重隐藏关系。
- **“WHERE 和 ON 中的条件完全一样。”** `WHERE r.score >= 60` 会排除补齐行；放入 `ON` 则限制匹配，仍保留左表学生。

## 面试回答

`LEFT JOIN` 保留左表的每一行，并按 `ON` 条件连接右表匹配的记录。
匹配多条右表记录时产生多行；完全没有匹配时，右表各列用 `NULL` 补齐。
`COUNT(*)` 统计结果行数，`COUNT(表达式)` 只统计表达式结果不是 `NULL` 的行数。
所以统计匹配记录应选择本来不会为空的右表标识列，不能直接用 `COUNT(*)`。

## 选择题

在本课数据中，Xu 的 `COUNT(*)`、`COUNT(r.student_id)`、`COUNT(r.score)` 依次是多少？

- A. `0, 0, 0`。
- B. `1, 0, 0`。
- C. `1, 1, 1`。
- D. `NULL, NULL, NULL`。

**正确答案：B。**

- A 忽略了左连接为 Xu 保留的一条结果行。
- B 正确，结果行存在，但来自右表的两个被统计列都是 `NULL`。
- C 把补齐行当成了右表中的真实非空记录。
- D 混淆了缺失值与计数结果；这里的 `COUNT` 返回整数计数。

## 面试追问

怎样列出所有学生及其不低于 85 分的成绩，并仍然保留没有符合条件成绩的学生？
参考思路：在连接条件中增加 `AND r.score >= 85`，不要在 `WHERE` 中筛掉补齐行。
结果中 Lin 对应 90，Zhou 和 Xu 的右表列为 `NULL`；条件作用于匹配过程。

## 官方参考

- [SQLite：SELECT](https://www.sqlite.org/lang_select.html)，对应外连接、ON、WHERE、分组与排序。
- [SQLite：Aggregate Functions](https://www.sqlite.org/lang_aggfunc.html)，对应 `count(*)` 与 `count(X)` 的统计规则。
