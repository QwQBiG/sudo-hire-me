---
slug: "rust-rc-arc-weak"
title: "Rc Arc Weak 的计数和循环引用"
description: "跟踪 clone downgrade upgrade 与 drop，理解最后一个强引用释放载荷和弱引用不能复活对象。"
subject: "Rust 语言机制"
order: 220
minutes: 18
lab: "workbench"
objectives: ["区分 clone 句柄与复制载荷", "解释 Weak 升级的可选结果", "识别强引用环"]
prerequisites: ["rust-ownership", "rust-send-sync"]
---

# clone 的是拥有权句柄，不是里面的 String

## 名称与职责

Rc 表示引用计数句柄（Reference Counted），Arc 表示原子引用计数句柄（Atomically Reference Counted），Weak 表示弱观察句柄；区别是拥有关系与计数同步，不是三个不同版本的字符串复制。

## 面试回答

引用计数（Reference Counting）让多个句柄共同拥有同一载荷。Rc 面向单线程非原子计数；Arc 使用原子计数并在满足类型边界时可跨线程。clone 新建强拥有者，不深复制载荷；最后一个强引用释放时载荷被 drop。Weak 是非拥有观察者，downgrade 不延长载荷寿命，upgrade 返回 `Option<Rc<T>>` 或 `Option<Arc<T>>`；对象还活着是 Some，已释放是 None。强引用环仍可能泄漏，可用适当的弱边打断。

## 可核对的计数轨迹

| 操作 | 强引用 | 显式弱句柄 | 载荷 |
| --- | ---: | ---: | --- |
| new | 1 | 0 | 存活 |
| clone | 2 | 0 | 同一个载荷 |
| downgrade | 2 | 1 | 存活 |
| drop 第一个强句柄 | 1 | 1 | 存活 |
| drop 最后一个强句柄 | 0 | 1 | 已 drop |
| upgrade | 0 | 1 | None，不复活 |

实现可能含隐式弱计数，表只显示用户显式 Weak，不把它当内存布局说明。Weak 仍关联分配的计数信息，不代表 T 仍存在。

## 实验代码

```rust
use std::rc::Rc;
fn main() {
    let a = Rc::new(String::from("hello"));
    let b = Rc::clone(&a);
    let w = Rc::downgrade(&a);
    println!("{}", Rc::strong_count(&a));
    drop(a);
    println!("{}", b.as_str());
    drop(b);
    println!("{}", w.upgrade().is_none());
}
```

预期 `2`、`hello`、`true`。将这里 Rc 改为 Arc 不意味着载荷可无锁修改，也不意味着引用计数解决了循环问题。

## 面试追问

节点 parent 强持有 child，child 是否必须强持有 parent？通常 child 只是观察父节点，应使用 Weak，否则父子形成环；具体取舍取决于“谁应延长谁的寿命”。Rc::get_mut 在满足唯一访问条件时才返回可变借用，Rc::make_mut 有写时复制语义；不应把 clone 和 make_mut 混成深拷贝。Rust 防止许多内存安全错误，但安全代码仍可能发生资源泄漏。

## 选择题

两个节点互相 Rc 强引用，外部句柄全释放后会怎样？

A. 一定自动识别环并回收

B. 一定编译失败

C. 可能计数互相维持，载荷无法自动释放

D. Arc 能自动解决同样的环

**答案：C。** 引用计数不是追踪式垃圾回收。A/D 都假设自动环检测，B 错在安全类型并不禁止所有引用环。应该依据关系语义引入 Weak，而不是随意移除所有权。

## 参考

- [Rust 官方书：引用环与 Weak](https://doc.rust-lang.org/book/ch15-06-reference-cycles.html)
