---
slug: "rust-borrowing-lifetimes"
title: "Rust 借用与生命周期从哪里判断"
description: "沿共享借用到可变借用的切换过程，理解引用有效期、冲突检查与不能返回局部引用。"
subject: "Rust 语言机制"
order: 188
minutes: 19
lab: "walkthrough"
objectives: ["区分共享引用与可变引用", "根据最后一次使用判断借用是否重叠", "解释返回局部变量引用为何无效"]
prerequisites: ["rust-ownership", "pointer-reference-basics"]
---

# Rust 借用：引用什么时候还活着

## 不转移所有权也能访问

本课以稳定 Rust 2021/2024 Edition 的基础安全代码为范围。借用（Borrowing）是通过引用访问由别人持有的值：`&T` 是共享引用（Shared Reference），可读取；`&mut T` 是可变引用（Mutable Reference），允许修改。在同一段有效借用期间，可以有多个共享引用，或一个独占可变引用，但不能同时用活跃共享引用和可变引用访问同一个值。生命周期（Lifetime）描述引用必须保持有效的范围；编译器据此拒绝悬空引用。[Rust 官方书：引用与借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)

## 合法路径：先读，再改

```rust
fn main() {
    let mut text = String::from("hi");
    let read = &text;
    println!("{read}");
    let write = &mut text;
    write.push('!');
    println!("{text}");
}
```

预期输出是两行 `hi` 与 `hi!`。`read` 最后一次使用在第一条 `println!`；到创建 `write` 时，那个共享借用已不再活跃。代码虽然把两个变量写在同一个词法作用域里，也不等于它们的**使用期**必然重叠。Rust 的非词法生命周期分析（Non-Lexical Lifetimes，NLL）正是这里的关键。[Rust 官方书：引用作用域与最后一次使用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)

## 两种会被编译器拒绝的要求

这段只用于阅读，不是可运行实验：

```text
let read = &text;
let write = &mut text;
println!("{read} {write}");
```

末行还要用 `read`，因此其共享借用与新建的可变借用重叠；编译器会拒绝。另一个常见错误是函数里创建局部 `String`，再返回指向它的引用：局部拥有者结束时值被销毁，返回引用就没有有效指向。应返回拥有的 `String`，或在确实借用输入时把返回引用的有效期与输入引用联系起来；生命周期标注**不会延长已销毁对象的寿命**。[Rust 官方书：生命周期与悬空引用](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)

## 逐步推演

### 创建拥有者

`text` 持有 `String("hi")`；后续引用不拿走该值的所有权。

### 共享借用只读

`read=&text` 后用它打印 `hi`。这一打印是 `read` 的最后一次使用；此处没有可变引用同时使用它。

### 可变借用接着写

第一段借用结束后创建 `write=&mut text`，执行 `push('!')`，值变成 `hi!`。

### 结束可变借用再看拥有者

`write` 最后一次使用在 `push`；之后通过 `text` 打印 `hi!`。拥有者一直存在，引用不悬空。

## 面试回答

Rust 借用用 `&T` 共享只读访问，或用 `&mut T` 独占可写访问，不改变拥有者。编译器阻止活跃共享借用与可变借用重叠，也阻止引用比所指值活得更久。判断是否冲突要看引用最后一次使用和实际有效范围，不能只看是否写在同一对花括号里；生命周期标注描述关系，不负责让局部值额外存活。

## 选择题

合法示例中，为什么 `println!("{read}")` 后能创建 `&mut text`？

- A. `&T` 和 `&mut T` 永远可以同时活跃
- B. `read` 的最后一次使用已过去，两个借用不再重叠
- C. `String` 自动复制了一份给 `write`
- D. `println!` 把 `text` 销毁并重新创建

**答案：B。** 编译器可判断共享借用在最后一次使用后不再活跃。A 忽略独占规则；C、D 都没有发生。

## 参考资料

- [Rust 官方书：References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [Rust 官方书：Validating References with Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)
