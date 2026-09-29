---
slug: "sql-correlated-subquery"
title: "相关子查询怎么借用外层的当前行"
description: "计算每个部门的平均工资，再找高于本部门平均值的员工。"
subject: "数据库"
order: 133
minutes: 18
lab: "sql"
objectives: ["识别子查询对外层别名的引用", "手算相关子查询的条件值", "区分逻辑语义与优化器实际执行"]
prerequisites: ["sql-basics", "sql-grouping"]
---

# 相关子查询怎么借用外层的当前行

## 先看问题

“找出工资高于**自己部门**平均工资的员工”不能只算全公司一个平均值：每位员工需要与其所属部门的平均值比较。**相关子查询**（Correlated Subquery）会引用外层查询当前行的列，下面的关键连接是 `x.department_id = e.department_id`。从逻辑上可把它想成对每位 `e` 员工求一个部门平均值；实际数据库优化器可能改写或缓存，不能断言物理上必定逐行完整运行。[SQLite：Correlated Subqueries](https://www.sqlite.org/lang_expr.html#subq)

## 实验代码

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER NOT NULL,
  salary INTEGER NOT NULL
);
INSERT INTO employees VALUES
  (1, 'Ada', 1, 80), (2, 'Bo', 1, 60),
  (3, 'Cai', 2, 90), (4, 'Dan', 2, 90);
SELECT e.name, e.salary,
       (SELECT AVG(x.salary)
          FROM employees AS x
         WHERE x.department_id = e.department_id) AS dept_avg
FROM employees AS e
WHERE e.salary > (
  SELECT AVG(x.salary)
  FROM employees AS x
  WHERE x.department_id = e.department_id
)
ORDER BY e.name;
```

输出仅 `Ada | 80 | 70`。部门 1 的平均值是 `(80+60)/2=70`，所以 Ada 入选、Bo 不入选；部门 2 的平均值是 90，Cai 与 Dan 都等于平均值，不满足严格大于。`SELECT` 列里的子查询只为显示计算依据；`WHERE` 里的子查询执行筛选。

## 别名错了会怎样

内层 `x` 是当前参与求平均的员工，外层 `e` 是待判断的员工。如果把条件写成 `x.department_id = x.department_id`，内层就不再依赖外层：它会算全公司平均 80，逻辑变了。若 `department_id` 允许 NULL，还要注意 SQL 中 NULL 比较结果是 UNKNOWN；本例用 `NOT NULL` 收紧条件，便于先抓住相关性。也可以先按部门 `GROUP BY` 算平均值，再与员工表 `JOIN`；两种写法的计划和成本要看数据与索引。[SQLite：SELECT](https://www.sqlite.org/lang_select.html)

## 面试回答

相关子查询引用外层当前行，因此其条件或结果随外层行变化。本题内层用 `e.department_id` 限定部门，求得该员工所在部门平均工资，再用外层 `e.salary` 比较。讲执行时可以按行手算语义，但别声称数据库一定机械地逐行执行，优化器可能改写。

## 常见误区

- **“子查询里出现两个别名就必然相关。”** 关键是内层实际引用了外层 `e`。
- **“高于平均值包含等于平均值。”** `>` 不包含 `=`，部门 2 无人入选。

## 选择题

若把内层条件误写成 `x.department_id = x.department_id`，本例求出的平均值变成多少？

- A. 70
- B. 80
- C. 90
- D. NULL

**答案：B。** 四名员工工资合计 320，平均 80；这个条件没有按外层部门筛选。

## 参考资料

- [SQLite：SQL Language Expressions](https://www.sqlite.org/lang_expr.html#subq)
- [SQLite：SELECT](https://www.sqlite.org/lang_select.html)
