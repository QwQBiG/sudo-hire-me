---
slug: "sql-count-null"
title: "COUNT 星号 COUNT 列与 NULL 的统计区别"
description: "真实执行带重复值和 NULL 的 SQLite 聚合，对照空表、分组和连接后计数的含义。"
subject: "数据库"
order: 231
minutes: 18
lab: "sql"
objectives: ["分别统计行数与非空值", "解释 DISTINCT 的去重与 NULL", "避免把左连接占位行当有效子记录"]
prerequisites: ["sql-grouping", "sql-join"]
---

# COUNT(*) 数行，COUNT(column) 数非空值

## 面试回答

COUNT(*) 统计输入行数，COUNT(expression) 统计表达式非 NULL 的行数，COUNT(DISTINCT expression) 统计不同的非 NULL 值数。NULL 表示缺失或未知，不等于 0 或空字符串；这两者若非 NULL 都会被 COUNT(column) 统计。没有 GROUP BY 的空输入聚合仍返回一行：COUNT 为 0，SQLite SUM 通常为 NULL。左连接产生占位行时，COUNT(*) 可能为 1，但 COUNT(右表非空主键) 为 0，应根据统计目标选表达式。

## 五行数据，三种统计

score 依次为 80、80、NULL、0、NULL：COUNT(*)=5；COUNT(score)=3；COUNT(DISTINCT score)=2，分别对应 80 和 0。SQL 的 NULL 行在 DISTINCT 单独查询中可出现，但 COUNT(DISTINCT score) 仍不统计 NULL，别将两个规则混成一句。

## 实验代码

```sql
CREATE TABLE count_demo(id INTEGER PRIMARY KEY, score INTEGER);
INSERT INTO count_demo VALUES(1,80),(2,80),(3,NULL),(4,0),(5,NULL);
SELECT COUNT(*) AS rows_all,
       COUNT(score) AS non_null,
       COUNT(DISTINCT score) AS distinct_non_null
FROM count_demo;
SELECT COUNT(*) AS rows_all, SUM(score) AS total
FROM count_demo WHERE id < 0;
SELECT score, COUNT(*) AS group_rows, COUNT(score) AS present_scores
FROM count_demo GROUP BY score ORDER BY score;
```

网页真实 SQLite 第一结果 5、3、2；第二结果 0、NULL；第三结果 NULL 分组有 2 行但非空 score 数 0，0 分组 1/1，80 分组 2/2。编辑数据再执行，观察 0 与 NULL 不同。每次运行沙箱重新初始化，不影响其他课程。

## 面试追问：左连接该数什么

一名学生没有成绩，LEFT JOIN 后仍保留一行学生，右表字段全 NULL。COUNT(*) 数的是连接结果这一行；COUNT(score.student_id) 若右表连接键按契约非空，才表示实际匹配的成绩行数。统计学生数又是另一目标，不能机械拿成绩行数替代。先定义“数谁”，再看连接是否放大行数或制造占位。

## 性能与语义不要混谈

COUNT(1) 中常量 1 非 NULL，在相同输入下也数每行，语义等同 COUNT(*)；性能依引擎与计划，不应背“COUNT(1) 永远更快”。COUNT(nullable_column) 改变语义，不能作为无条件替换优化。WHERE 在聚合之前筛行，HAVING 筛聚合后的组；把前提筛选位置写错，统计结果就变了。

## 选择题

score 为 80、80、NULL、0、NULL，COUNT(score) 是？

A. 5

B. 3

C. 2

D. 1

**答案：B。** 只排除两个 NULL，不排除 0、不去重。A 是 COUNT(*)，C 是 COUNT(DISTINCT score)，D 错误丢掉重复与零值。明确表达式是否为 NULL 才能判断。

## 参考

- [SQLite：聚合函数](https://www.sqlite.org/lang_aggfunc.html)
