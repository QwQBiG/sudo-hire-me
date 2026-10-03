---
slug: "kotlin-val-collections"
title: "Kotlin val 和 List 为什么不等于完全不可变"
description: "对比只读视图、可变别名和 toList 快照，分清绑定不可变、接口只读与深度不可变。"
subject: "Kotlin 语言机制"
order: 225
minutes: 16
lab: "workbench"
objectives: ["区分 val 与对象可变性", "解释 List 视图可观察外部修改", "说明 toList 不深拷贝元素"]
prerequisites: ["mutability-aliasing", "shallow-deep-copy"]
---

# val 保护变量绑定，不冻结整个对象图

## 面试回答

Kotlin 的 val 限制变量重新赋值，var 允许重绑定，二者不直接决定对象能否修改。List 是只读集合接口（Read-Only Collection Interface），没有 add 等修改方法，但同一集合可能经 MutableList 别名修改，List 视图仍会看到变化。toList() 可形成内容快照用于隔离后续集合结构修改，不深拷贝其中的可变对象。“val List”不能直接等同深度不可变（Deep Immutability）或线程安全。

## 两条引用，一份集合

source 是 `[1,2]` 的 MutableList，view: List 指向 source，snapshot=source.toList()。执行 source.add(3) 后 source 和 view 都是 `[1,2,3]`，snapshot 仍是 `[1,2]`。通过 view 看不到 add 接口，不代表其他人没有写权限。

如果元素换成可变 User，snapshot 中仍保存同一批 User 引用；修改某个 User.age，所有指向它的集合都可观察到变化。这是集合结构快照，不是深拷贝。

## 实验代码

```kotlin
fun main() {
    val source = mutableListOf(1, 2)
    val view: List<Int> = source
    val snapshot: List<Int> = source.toList()
    source.add(3)
    println(view)
    println(snapshot)
}
```

预期 `[1, 2, 3]` 与 `[1, 2]`。source 本身是 val，add 仍合法；尝试给 source 赋另一个列表才违反 val 的绑定约束。网页只用不可变整数元素，不能据此证明复杂对象也深度隔离。

## 面试追问

只读 API 有用吗？有，它减少接收者可执行的操作，表达不通过此接口修改集合的意图。但需要稳定快照、跨线程分享或持久化数据结构时，应单独设计复制和同步策略。不能为了证明某具体 List 实现可变而强制转换后随意修改：接口承诺、运行时实现与平台可能不同。数据类（Data Class）的 copy 也通常是属性级浅复制，不自动递归复制全部集合与元素。

## 选择题

val source 是 MutableList，val view: List 指向 source，source.add(3) 后？

A. 编译失败，因为 source 是 val

B. view 必定保持原内容

C. view 能观察到同一集合新增元素

D. Kotlin 自动深拷贝集合

**答案：C。** A 混淆绑定与对象；B/D 假设只读接口自动隔离底层对象。获取快照需要显式策略，元素不可变性仍是另一个问题。

## 参考

- [Kotlin 官方：集合概览](https://kotlinlang.org/docs/collections-overview.html)
