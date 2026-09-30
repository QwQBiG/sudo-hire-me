---
slug: "null-option-absence"
title: "空值与显式的缺失"
description: "查找偶数时分清没有结果和结果恰好为零，对照 null、None 与 Option 的表达方式。"
subject: "编程基础与面向对象"
order: 30
minutes: 18
lab: "workbench"
objectives: ["区分缺失和合法零值", "理解 Rust Option 的 Some/None", "说明 null 与异常、Result 的问题维度不同"]
prerequisites: ["generic-programming-basics", "error-handling-models"]
---

# 没有值，还是值刚好为零

## 用查找结果提出问题

函数从整数数组里查找第一个偶数。输入 `[1,3,8]` 得到 8；`[1,3]` 没有结果；`[1,3,0]` 则应得到真实的 0。若约定“返回 0 表示没找到”，最后两种情况无法区分。缺失（Absence）是一个需要表达的状态，不应随意借用业务上合法的值。[Rust 标准库：`Option<T>`](https://doc.rust-lang.org/std/option/enum.Option.html)

## 逐步推演

### 第一步：列出三种输入的契约

| 输入 | 第一个偶数 | 是否找到 |
| --- | ---: | --- |
| `[1,3,8]` | 8 | 是 |
| `[1,3]` | 无 | 否 |
| `[1,3,0]` | 0 | 是 |

“0”和“无”在表里是不同状态；若返回类型只能是一枚整数，没有额外协议就无法同时清楚表达两者。

### 第二步：用 Rust Option 写完整例子

```rust
fn first_even(items: &[i32]) -> Option<i32> {
    items.iter().copied().find(|value| value % 2 == 0)
}

fn main() {
    println!("{:?}", first_even(&[1, 3, 8]));
    println!("{:?}", first_even(&[1, 3]));
    println!("{:?}", first_even(&[1, 3, 0]));
}
```

三行预期为 `Some(8)`、`None`、`Some(0)`。`Option<i32>` 是一个可表示两种分支的类型：`Some(value)` 装真实结果，`None` 表示缺失。它不是“一个可能指向无效内存的 i32 指针”。

### 第三步：处理缺失而不丢信息

调用方可 `match` 分别处理两种分支；若业务确实允许“没找到就使用 0”，可调用 `unwrap_or(0)`，但这样得到的整数已无法再区分原本的 `None` 和 `Some(0)`。默认值是一项**业务选择**，不是类型系统自动证明二者等价。

### 第四步：区分缺失、失败与语言空值

查找不到元素是正常的“没有结果”，适合 `Option`。若输入文本不是整数、文件读取失败等，通常还需要错误信息，Rust 常用 `Result<T,E>`；不能把所有失败都压成 `None`。Java 对象引用可为 `null`，直接调用其方法可能抛 `NullPointerException`；`Optional<T>` 可显式表达某些返回值的缺失。Kotlin 用 `T?` 区分可空类型，Python 使用 `None`，Zig 使用 `?T` 可选类型，但各语言的检查和语义不同。[Kotlin 官方文档：空安全](https://kotlinlang.org/docs/null-safety.html)、[Zig 官方语言参考：Optionals](https://ziglang.org/documentation/master/#Optionals)

## 面试回答

空值或可选类型表达“值可能不存在”；不能用合法业务值如 0 随意充当缺失标记。Rust 的 `Option<T>` 用 `Some(T)` 与 `None` 明确两种情况，`Some(0)` 不等于 `None`。Java `null`、Python `None`、Kotlin `T?`、Zig `?T` 都涉及缺失，但语言规则不同；若需要说明**为什么失败**，应考虑异常或 `Result` 等错误通道，而不把所有错误隐藏成“没有值”。

## 常见错误

- **“没有找到就返回 0，不会有歧义。”** 0 本身可能是合法结果。
- **“`Option` 等于会自动抛异常的空指针。”** Rust 的 `Some`/`None` 是可匹配的分支；错误使用 `unwrap` 另当别论。
- **“`None` 与任何错误都是同义词。”** 缺失可以是正常结果，错误可能需要原因和传播。
- **“Java 只要使用 Optional 就不存在任何 null。”** 现有 API、字段和互操作仍可能出现 null，需按具体契约处理。

## 选择题

本课查找第一个偶数时，输入 `[1,3,0]`。Rust `first_even` 应返回什么？

- A. `None`
- B. `Some(0)`
- C. `Err(0)`
- D. 必定 panic

**答案：B。** 0 是数组里真实存在的偶数，应作为成功值保留。A 混淆缺失与零，C 把正常结果当错误，D 与本例安全迭代不符。

## 参考资料

- [Rust 标准库：`Option<T>`](https://doc.rust-lang.org/std/option/enum.Option.html)
- [Rust 标准库：`Result<T,E>`](https://doc.rust-lang.org/std/result/)
- [Kotlin 官方文档：可空与不可空类型](https://kotlinlang.org/docs/null-safety.html)
- [Zig 官方语言参考：可选类型](https://ziglang.org/documentation/master/#Optionals)
