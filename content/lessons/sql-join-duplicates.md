---
slug: "sql-join-duplicates"
title: "JOIN 后行数为什么突然变多"
description: "从一对多关系数出每一行，避免 COUNT(*) 把没有订单的客户误算为一单。"
subject: "数据库"
order: 131
minutes: 17
lab: "sql"
objectives: ["按匹配数推算 JOIN 结果行数", "区分 COUNT(*) 与 COUNT(右表主键)", "辨别真实一对多和错误的连接条件"]
prerequisites: ["sql-join"]
---

# JOIN 后行数为什么突然变多

## 先数关系，不急着加 DISTINCT

客户甲有两笔订单，客户乙没有订单。`LEFT JOIN` 会为甲生成两行，为乙生成一行、订单列为 NULL。SQL 查询结果允许重复行（更准确地说具有多重集语义）；JOIN 后“行数膨胀”可能是业务关系本来就是一对多，也可能是连接条件漏了。先检查键与匹配数，不能一见重复就套 `DISTINCT`。[SQLite：JOIN and LEFT JOIN](https://www.sqlite.org/lang_select.html#join)

## 实验代码

```sql
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL);
INSERT INTO customers VALUES (1, '甲'), (2, '乙');
INSERT INTO orders VALUES (10, 1), (11, 1);

SELECT c.name, COUNT(*) AS joined_rows,
       COUNT(o.id) AS order_count
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;
```

输出为 `甲 | 2 | 2` 与 `乙 | 1 | 0`。`COUNT(*)` 计算 JOIN 结果的行数，乙也有一行；`COUNT(o.id)` 只数非 NULL 的订单 ID，所以乙是 0。若两张表都可能在连接键上有多行，一个键的结果行数会按匹配组合数相乘。

## 什么时候才用 DISTINCT

如果问题是“哪些客户曾下单”，可用 `EXISTS` 或 `SELECT DISTINCT c.id ... INNER JOIN ...` 得到客户集合；如果问题是“每位客户有几笔订单”，则应按客户聚合并计数订单键。`DISTINCT` 不能修复漏写 `ON` 条件造成的错误笛卡尔组合，也可能掩盖本应保留的真实订单行。`COUNT(o.id)` 依赖 `o.id` 非 NULL，这里主键满足。[SQLite：Aggregate Functions](https://www.sqlite.org/lang_aggfunc.html)

## 面试回答

JOIN 按连接条件产生匹配组合，一对多关系会把左表一行展开为多行。`LEFT JOIN` 对没有右侧匹配的左行仍保留一行，右侧列为 NULL，因此 `COUNT(*)` 在该组可能是 1，而 `COUNT(右表非空主键)` 是 0。先确认业务基数和 `ON` 条件，再选择聚合、`EXISTS` 或 `DISTINCT`，不要用去重掩盖错误连接。

## 常见误区

- **“LEFT JOIN 后乙没有行。”** 乙有一行，右表列为 NULL。
- **“COUNT(*) 就是订单数。”** 对无订单客户也会数到保留的左表行。

## 选择题

本课的客户乙在 `LEFT JOIN` 后，其 `COUNT(*)` 与 `COUNT(o.id)` 分别是多少？

- A. 0、0
- B. 1、0
- C. 1、1
- D. 2、0

**答案：B。** LEFT JOIN 保留一行，但该行右表订单 ID 为 NULL。

## 参考资料

- [SQLite：SELECT and JOIN](https://www.sqlite.org/lang_select.html)
- [SQLite：Aggregate Functions](https://www.sqlite.org/lang_aggfunc.html)
