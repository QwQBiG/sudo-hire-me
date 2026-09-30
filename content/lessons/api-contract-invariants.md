---
slug: "api-contract-invariants"
title: "接口契约怎样保证状态不被破坏"
description: "用容量为二的令牌状态演算前置条件、成功与失败后置条件，以及每次调用后仍成立的不变量。"
subject: "编程基础与面向对象"
order: 21
minutes: 18
lab: "workbench"
objectives: ["分清调用者与实现者的责任", "逐步检查成功和拒绝路径的后置条件", "用具体范围写出可检查的不变量"]
prerequisites: ["function-arguments", "oop-encapsulation"]
---

# 接口契约：调用前允许什么，调用后保证什么

## 把模糊的“应该对”拆开

接口契约（API Contract）说明调用者应提供怎样的输入、实现者在这些条件下保证怎样的结果。前置条件（Precondition）约束调用前状态，后置条件（Postcondition）约束完成后的结果或副作用；不变量（Invariant）描述一系列允许操作之间始终应保持的性质。类型声明通常只表达其中一部分，例如 `int` 不能表达“值必须在 0..2”。这里讨论行为契约，不限于面向对象类或 `private` 字段。[MIT 6.031：Specifications](https://web.mit.edu/6.031/www/fa20/classes/06-specifications/)

## 给一个小接口写明确规则

设状态 `tokens` 是剩余令牌数，容量固定 2。本例选择**检查**无效状态并抛 `ValueError`：

```python
def consume(tokens: int) -> tuple[bool, int]:
    if type(tokens) is not int or not 0 <= tokens <= 2:
        raise ValueError("tokens must be an integer in 0..2")
    if tokens == 0:
        return False, tokens
    return True, tokens - 1

tokens = 2
for _ in range(3):
    accepted, tokens = consume(tokens)
    print(accepted, tokens)
```

以 Python 3.9+ 为范围，预期输出三行：`True 1`、`True 0`、`False 0`。合法输入条件是整数 `0..2`；成功时返回 `True` 且状态减一，失败（无令牌）时返回 `False` 且状态不变。每次**正常返回**后的不变量仍为 `0<=tokens<=2`。本实现没有原地修改外部对象，而是返回新整数状态；这也是契约应明确的影响范围。Python 类型标注本身不执行运行时检查，所以代码显式校验。[Python 官方文档：函数注解](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)

## 逐步推演

### 初始状态满足不变量

`tokens=2` 位于 0..2，因此可以调用；首次成功返回 `(True,1)`，1 仍在范围内。

### 第二次到达边界

输入 1，成功减至 0，返回 `(True,0)`；不变量仍成立，不能继续减成负数。

### 第三次拒绝但不改状态

输入 0，走拒绝分支 `(False,0)`。`False` 不是异常，表示正常的“容量已空”结果；状态保持 0。

### 非法输入单独处理

输入 -1 或 3 时，函数抛 `ValueError`，不会产生正常返回值。别把“超出容量”与合法状态下“暂时没有令牌”混成同一条路径。

## 面试回答

接口契约先说清前置条件、成功与失败的后置条件及可能抛出的错误；状态型接口还需说明每次允许操作后应保持的不变量。例如令牌数始终在 0..2，消耗时有令牌则减一，没有则返回失败且保持 0，无效输入明确报错。调用方按条件使用，实现方按保证实现；类型标注和访问控制都不能自动替代完整契约。

## 选择题

本例从 `tokens=0` 调用 `consume(0)`，哪项符合契约？

- A. 返回 `(True,-1)`
- B. 返回 `(False,0)`
- C. 抛 `ValueError`
- D. 返回 `(True,0)`

**答案：B。** 0 是合法输入但无令牌，拒绝消费且状态不变。A 破坏不变量，C 把合法失败误当无效输入，D 声称成功却未消耗。

## 参考资料

- [MIT 6.031：Specifications 与前后置条件](https://web.mit.edu/6.031/www/fa20/classes/06-specifications/)
- [Python 3：函数注解](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)
