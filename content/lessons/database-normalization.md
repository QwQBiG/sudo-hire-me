---
slug: "database-normalization"
title: "从订单表理解第一到第三范式"
description: "用订单和商品明细逐步找出重复值、部分依赖和传递依赖，再拆成可关联的表。"
subject: "数据库"
order: 136
minutes: 23
lab: "workbench"
objectives: ["指出多值单元格和重复组的问题", "沿复合键找出部分依赖", "沿客户编号找出传递依赖并拆表"]
prerequisites: ["sql-basics", "sql-join"]
---

# 从订单表理解第一到第三范式

## 先问每行代表什么

数据库规范化（Database Normalization）先看数据代表的事实，再看字段之间的函数依赖（Functional Dependency）。若 `X → Y`，意思是在本业务规则下，一旦确定 X，就能确定 Y；它不表示 SQL 执行顺序。我们设定：一个订单可以有多种商品，但同一商品在一个订单中至多出现一行；订单号决定下单日期和客户编号；商品号决定当前商品名；客户编号决定客户名。这些是**本例业务前提**，换业务规则就要重新判断键和依赖。[IBM：Database Normalization](https://www.ibm.com/think/topics/database-normalization)

原始记录可能写成一行：`订单 100，日期 2026-01-02，客户 C7 Lin，商品栏 P1×2、P2×1`。如果把两个商品塞进一个 `items` 字符串，查询某件商品、改数量或关联商品表都要拆字符串。下面按第一范式（First Normal Form，1NF）、第二范式（Second Normal Form，2NF）、第三范式（Third Normal Form，3NF）依次处理；先理解重复从哪里来，再记名称。

## 逐步推演

### 第一步：确定商品明细的单位

把 `items = "P1×2; P2×1"` 拆成一行一个订单商品；不使用 `product1、product2、product3` 这样的重复列。1NF 在本例要求每个商品明细位置只放一个商品编号及其数量；“单值”是相对于这个业务域，**不是**要求把文字拆成一个个字符。这样得到下列明细行，但还没有解决所有冗余。

| order_id | order_date | customer_id | customer_name | product_id | product_name | quantity |
| --- | --- | --- | --- | --- | --- | --- |
| 100 | 2026-01-02 | C7 | Lin | P1 | Keyboard | 2 |
| 100 | 2026-01-02 | C7 | Lin | P2 | Mouse | 1 |
| 101 | 2026-01-03 | C7 | Lin | P1 | Keyboard | 1 |

### 第二步：用复合键检查“只依赖一半”的列

根据本例“订单内同商品只出现一次”的规则，明细行可由 `(order_id, product_id)` 唯一标识，而且本例没有其他候选键。`quantity` 由这两个值一起决定；但 `order_date` 和 `customer_id` 只由 `order_id` 决定，`product_name` 只由 `product_id` 决定。这种非键属性只依赖复合候选键的一部分，叫部分依赖（Partial Dependency），不符合 2NF。[IBM：Second Normal Form](https://www.ibm.com/think/topics/database-normalization)

如果改商品 P1 的名称，原表中订单 100 和 101 的两行都要改，漏改就不一致。只删除订单 100 的 P2 行，并不应把 Mouse 的商品资料也删除；若所有订单明细都被删，原表却会失去唯一保存的商品信息，这也是异常来源。

### 第三步：把订单、商品和两者关系分开

拆为 `orders(order_id, order_date, customer_id, customer_name)`、`products(product_id, product_name)`、`order_items(order_id, product_id, quantity)`。`orders` 的键是 `order_id`，`products` 的键是 `product_id`，`order_items` 在本例的复合键仍是 `(order_id, product_id)`。订单日期不再随每件商品重复，商品名称也不再随每次购买重复；`order_items` 的 `quantity` 仍依赖完整复合键。

这解决了刚才的**部分依赖**，但 `orders` 里客户 C7 的姓名仍可能随着不同订单重复。2NF 不等于“表里没有任何重复值”；它解决的是特定的键依赖问题。

### 第四步：沿非键字段再追一次依赖

在 `orders` 中有 `order_id → customer_id → customer_name`。`customer_name` 不是由订单本身直接决定，而是由非键字段 `customer_id` 决定；这就是本例违反 3NF 的传递依赖（Transitive Dependency）。再拆出 `customers(customer_id, customer_name)`，订单表只保留 `customer_id`。客户改名时更新客户表的一行，而非逐张订单找姓名。

最终四张表为 `customers(customer_id, customer_name)`、`orders(order_id, order_date, customer_id)`、`products(product_id, product_name)`、`order_items(order_id, product_id, quantity)`；`orders.customer_id`、`order_items.order_id` 和 `order_items.product_id` 可通过外键维护引用。需要显示订单 100 的商品和客户名时，再按键连接这些表。拆表不是丢数据，设计正确的键与关联才使事实可还原。[IBM：Third Normal Form](https://www.ibm.com/think/topics/database-normalization)

## 为什么不只背一句口诀

“1NF 原子、2NF 完全依赖、3NF 消除传递依赖”只有在**属性含义与候选键已确定**时才有用。若同一商品允许在一张订单中出现多次明细，`(order_id, product_id)` 就不能唯一标识一行，需要订单行号等新的键；第二步必须重新分析。若业务要求保存**下单当时的商品名称快照**，订单明细里有一份名称可能是有意保存历史事实，而不是错误重复。规范化是逻辑设计依据，实际反规范化应清楚维护规则和一致性代价。[IBM：Database Design with Denormalization](https://www.ibm.com/docs/en/db2-for-zos/13.0.0?topic=design-database-denormalization)

## 面试回答

先确定每行代表的事实和候选键，再判断函数依赖。1NF 在本例避免把多商品塞进一个单元格或重复列；2NF 要求非键属性不只依赖复合候选键的一部分，所以把订单资料、商品资料与明细分开；3NF 进一步处理订单号经客户编号决定客户名的传递依赖。拆表后用主键、外键关联，减少更新异常。不能在没说明业务规则和键的情况下机械判断范式。

## 选择题

在本课的一行一商品表中，候选键为 `(order_id, product_id)`，而 `product_id → product_name`。最准确的判断是什么？

- A. `product_name` 只依赖复合键的一部分，构成违反 2NF 的部分依赖。
- B. 只要有复合键，就自动满足 3NF。
- C. `quantity` 必然只由 `product_id` 决定。
- D. 把 `product_name` 复制到更多订单行能消除异常。

**答案：A。** 商品名由商品号一列决定，不需要订单号，故是本例的部分依赖。B 忽略依赖关系，C 与本例“每订单购买数量不同”相反，D 会增加重复更新的风险。

## 参考资料

- [IBM：Database Normalization](https://www.ibm.com/think/topics/database-normalization)
- [IBM Informix：Summary of Normalization Rules](https://www.ibm.com/docs/en/informix-servers/12.10.0?topic=SSGU8G_12.1.0%2Fcom.ibm.ddi.doc%2Fids_ddi_191.htm)
- [IBM Db2：Database Design with Denormalization](https://www.ibm.com/docs/en/db2-for-zos/13.0.0?topic=design-database-denormalization)
