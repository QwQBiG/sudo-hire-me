---
slug: "sql-pagination"
title: "ORDER BY 与分页边界"
subject: "数据库"
description: "同分记录如何稳定分到两页，为什么 LIMIT 不能替代明确排序。"
order: 135
minutes: 17
lab: "sql"
objectives: ["解释无 ORDER BY 时结果顺序不受保证", "给并列排序键添加唯一破平局键", "区分 OFFSET 分页与游标分页的风险"]
prerequisites: ["sql-basics", "sql-grouping"]
---

# ORDER BY 与分页边界

## 面试回答

SQL 查询只有写出 `ORDER BY` 才能要求特定输出顺序；分页时应让排序键足以确定每行的相对位置，例如分数降序后再按唯一记录编号升序。`LIMIT n OFFSET m` 在已排序结果中跳过 m 行再取 n 行，但深分页可能需要处理许多先前行，而且数据在两次请求间插入或删除会导致重复、遗漏。游标分页（Keyset Pagination）用上一页末行的排序键继续查询，适合按稳定排序向后翻页；它也不是数据库快照的一般替代品。[SQLite 官方文档：SELECT](https://www.sqlite.org/lang_select.html)

## 同分时为什么需要第二个键

实验的 `scores` 初始行按 SQLite `rowid` 为 `(1,1,80)、(2,1,90)、(3,2,60)`，三元组依次是 `(rowid, student_id, score)`。再插入 `(4,3,80)` 后，按分数降序排列时，两条 80 分记录谁先谁后若没有第二个排序键就没有保证。用唯一的 `rowid ASC` 打破平局：

```text
排序后：(rowid 2, 90) → (rowid 1, 80) → (rowid 4, 80) → (rowid 3, 60)
第一页 2 行：2、1
第二页 2 行：4、3
```

这里使用 SQLite 普通有 rowid 的表；在其他数据库或 `WITHOUT ROWID` 表中，应使用业务定义的唯一主键，而不是照搬 `rowid`。[SQLite 官方文档：Rowid Tables](https://www.sqlite.org/rowidtable.html)

## 实验代码

```sql
INSERT INTO scores (student_id, score) VALUES (3, 80);

SELECT rowid AS record_id, student_id, score
FROM scores
ORDER BY score DESC, rowid ASC
LIMIT 2 OFFSET 0;

SELECT rowid AS record_id, student_id, score
FROM scores
ORDER BY score DESC, rowid ASC
LIMIT 2 OFFSET 2;
```

运行后，两份结果分别对应上面的第一页和第二页。把 `rowid ASC` 去掉，当前这次运行**可能**仍然得到看似相同的顺序，但不构成查询语义保证。把 `ORDER BY` 完全去掉，不能用偶然观察到的插入顺序当作可靠分页规则。[SQLite 官方文档：ORDER BY](https://www.sqlite.org/lang_select.html#the_order_by_clause)

## OFFSET 的两个问题

假设第一页查询后，有新纪录插入并排到原第一页前面。第二页仍用 `OFFSET 2`，它跳过的是**新结果集**的前两行，可能把上一页最后一行再次取出。删除也可能造成漏行。即使排序键唯一，独立执行的两个分页查询不自动共享同一个数据快照。深分页还可能为了跳过很多行而做大量工作，具体代价由索引和执行计划决定。

游标方式可以记录上页末行 `(score=80,rowid=1)`，按本例降序/升序顺序继续时，后续条件可写为 `score < 80 OR (score = 80 AND rowid > 1)`，再配合同样的 `ORDER BY` 与 `LIMIT`。若业务必须看到完全一致的静态结果，还要考虑事务快照或其他一致性方案。

## 常见误区

- **“LIMIT 自带固定顺序。”** LIMIT 只限制行数，不能替代 ORDER BY。
- **“ORDER BY score 就足够稳定分页。”** 分数并列时还需要唯一的破平局键。
- **“游标分页彻底解决并发更新问题。”** 它减轻 OFFSET 的位移问题，但排序键变动或跨请求快照差异仍须处理。

## 选择题

按 `score DESC` 每页显示两行，多条记录同分。为了使页面边界有确定顺序，最关键的补充是什么？

- A. 去掉 ORDER BY，让数据库选择最快的顺序
- B. 在 ORDER BY 最后加入唯一且稳定的记录键
- C. 只增加 OFFSET 数值
- D. 将 LIMIT 改为更大的数字

**答案：B。** 唯一的破平局键确定同分行的相对顺序。A 没有顺序保证，C、D 都不会解决并列键的未定义顺序。

## 参考资料

- [SQLite 官方文档：SELECT](https://www.sqlite.org/lang_select.html)
- [SQLite 官方文档：Rowid Tables](https://www.sqlite.org/rowidtable.html)
