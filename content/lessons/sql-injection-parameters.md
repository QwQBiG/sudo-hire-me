---
slug: "sql-injection-parameters"
title: "SQL 参数绑定为什么能阻止数据变成语句"
description: "在真实 SQLite 中对照字符串拼接与 prepare bind，观察用户名输入如何改变查询条件。"
subject: "数据库"
order: 232
minutes: 20
lab: "workbench"
objectives: ["说明注入来自结构与数据混合", "使用占位符绑定值", "识别动态标识符与权限的额外边界"]
prerequisites: ["sql-basics", "authentication-authorization"]
---

# 不把用户数据拼进 SQL 语法

## 面试回答

SQL 注入（SQL Injection）发生在不可信输入被当成 SQL 结构解释时。直接拼接 `WHERE name='`、输入和结束引号，可能让引号与逻辑运算改变条件。参数化查询（Parameterized Query）先固定语句结构，再把输入作为值绑定；输入里的 SQL 关键字仍是数据，不改查询结构。参数占位符通常不能替代任意表名、列名或排序方向，动态结构应使用固定选项与允许列表。参数绑定不替代授权、最小权限与错误信息管理。

## 两个用户足以看到差异

虚构数据只有 alice/reader、bob/admin。正常输入 alice 时两种模式都匹配一行。输入 `' OR 1=1 --` 时，危险拼接变成 `WHERE name='' OR 1=1 --'`，恒真条件匹配两行；绑定查询保持 `WHERE name=?`，参数完整字符串不匹配任何用户名，所以返回 0 行。

这是**检索条件绕过**示例，不是完整登录系统；没有密码或真实账号。网页使用 Worker 中的 SQLite prepare/bind 实际执行，数据库每次重新创建。语法无效输入会显示真正的 SQLite 错误，而不是靠字符串关键词猜测是否注入。

## 实验代码

```python
import sqlite3
db = sqlite3.connect(":memory:")
try:
    db.execute("CREATE TABLE users(name TEXT, role TEXT)")
    db.executemany("INSERT INTO users VALUES(?, ?)",
                   [("alice", "reader"), ("bob", "admin")])
    attack = "' OR 1=1 --"
    rows = db.execute("SELECT name, role FROM users WHERE name = ?",
                      (attack,)).fetchall()
    print(rows)
finally:
    db.close()
```

预期 `[]`。Python 的单元素参数元组需要逗号；不能先用格式化构造完整 SQL 再交给 execute，并称它“用了数据库 API 所以安全”。占位符风格依驱动而异，不能把 SQLite 的 ? 机械复制到所有驱动。

## 为什么手工过滤不够

屏蔽 OR 或删除引号会破坏合法数据，例如姓名 O'Neil；不同编码、语法与上下文还可能绕过粗糙过滤。应让驱动处理值边界，而不是自己写转义器。LIKE 模式中的 `%` 和 `_` 即使被绑定仍是通配语义；参数绑定防语法注入，不保证业务检索范围符合预期。动态 ORDER BY 采用 `{"name":"name", "time":"created_at"}` 这样的固定映射，而不是把输入当 SQL 片段。

## 面试追问

用了 ORM 就一定安全吗？通过安全参数 API 的部分可受保护，但原生 SQL 拼接、动态表达式、存储过程内再拼接仍可能注入。预编译与参数化关系紧密，但服务器是否缓存执行计划是性能问题，不决定此处数据/结构分离的安全原理。即使查询没有注入，缺少对象授权仍会越权；不要把两类漏洞归成一个名字。

## 选择题

用参数绑定的正确理由是？

A. 删除所有用户输入中的引号

B. 让数据保持值的身份，不改变固定 SQL 结构

C. 让任何表名都能用 ? 替代

D. 自动赋予登录用户全部权限

**答案：B。** A 是脆弱过滤而非绑定；C 忽略标识符不能任意绑定；D 混淆查询构造与授权。仍需最小权限与适当的输入业务验证。

## 参考

- [SQLite：绑定参数 API](https://www.sqlite.org/c3ref/bind_blob.html)
- [OWASP：SQL 注入防护](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
