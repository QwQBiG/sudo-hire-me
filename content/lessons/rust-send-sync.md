---
slug: "rust-send-sync"
title: "Send 和 Sync 到底允许跨线程做什么"
description: "比较 String Rc Cell RefCell 与 Arc 的类型边界，理解移动所有权和共享引用是两种能力。"
subject: "Rust 语言机制"
order: 219
minutes: 20
lab: "workbench"
objectives: ["分别解释 Send 与 Sync", "按泛型载荷判断 Arc 边界", "区分内部可变性与线程同步"]
prerequisites: ["rust-borrowing-lifetimes", "mutex-vs-semaphore"]
---

# Send 能发送值，Sync 能共享引用

## 面试回答

Rust 的 Send 标记类型能安全地在线程之间转移所有权，Sync 标记类型能安全地跨线程共享引用；关系是 `T: Sync` 当且仅当 `&T: Send`。多数类型由组成字段自动推导这些自动 trait（Auto Trait）。Rc 的引用计数非原子，因此不是 Send/Sync；Arc 使用原子引用计数，但是否可跨线程仍取决于载荷 T。`Arc<RefCell<T>>` 不会因为套了 Arc 就获得线程同步；多线程内部修改常用 `Arc<Mutex<T>>` 等明确同步结构。

## 固定载荷后再列规则

下面只讨论安全标准类型，载荷是 i32 或 String。

| 类型 | Send | Sync | 为什么 |
| --- | --- | --- | --- |
| String | 是 | 是 | 可转交所有权，共享引用不直接修改 |
| `Rc<String>` | 否 | 否 | 非原子共享计数 |
| `Cell<i32>` | 是 | 否 | 可整体转交，共享修改不含线程同步 |
| `RefCell<i32>` | 是 | 否 | 动态借用检查不等于跨线程锁 |
| `Arc<String>` | 是 | 是 | 计数原子且载荷满足边界 |
| `Arc<RefCell<i32>>` | 否 | 否 | Arc 的相应实现需要载荷满足 Send+Sync |

“Cell 可转交”和“Cell 可同时共享”并不矛盾：转交后原线程不再拥有它，和多个线程都握着 &Cell 是两回事。

## 实验代码

```rust
use std::sync::{Arc, Mutex};
fn main() {
    let count = Arc::new(Mutex::new(0));
    let child = Arc::clone(&count);
    let handle = std::thread::spawn(move || {
        *child.lock().unwrap() += 1;
    });
    handle.join().unwrap();
    println!("{}", *count.lock().unwrap());
}
```

预期 1。Arc 管理共享拥有，Mutex 管理排他访问，join 等待子线程结束；三者职责不同。unwrap 在这里简化错误处理，生产代码还需考虑线程 panic 与锁中毒（Poisoning），不能说类型检查消除了所有失败。

## 面试追问

Sync 是“任意并发操作都正确”吗？不是，它保证相应安全共享能力，不证明业务顺序、无死锁或无丢失更新。Send 是“值必须复制”吗？不是，move 可以转移非 Copy 类型。不要为了通过编译随便 unsafe impl Send/Sync；实现者必须证明内部所有不安全操作满足线程边界。

## 选择题

为什么 `Arc<RefCell<i32>>` 不能替代 `Arc<Mutex<i32>>` 做多线程共享修改？

A. Arc 不是引用计数

B. RefCell 的运行时借用检查不提供跨线程同步，载荷不满足 Arc 的边界

C. i32 不支持 Send

D. Mutex 只能用于单线程

**答案：B。** A 错，Arc 正是原子引用计数；C 错，i32 可转交与共享；D 错，Mutex 用于相应同步。容器外壳不能把不安全载荷自动变安全。

## 参考

- [Rust 官方书：Send 与 Sync](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html)
