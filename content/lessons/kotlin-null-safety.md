---
slug: "kotlin-null-safety"
title: "Kotlin 的问号如何挡住空值错误"
description: "从 String? 到安全调用与 Elvis 默认值，推导可空输入的结果和 !! 的风险。"
subject: "Kotlin 语言机制"
order: 192
minutes: 17
lab: "workbench"
objectives: ["区分 String 与 String?", "推导 ?. 与 ?: 组合的结果", "指出 !! 和 Java 平台类型仍可能产生运行时空值错误"]
prerequisites: ["null-option-absence"]
---

# Kotlin 空安全：先在类型里说清“可能没有”

## 类型上的问号是什么意思

本课以 Kotlin 2.x/JVM 的常见语义为范围。`String` 是不可空类型，正常 Kotlin 代码不能直接把 `null` 赋给它；`String?` 是可空类型（Nullable Type），允许字符串或 `null`。对 `String?` 直接写 `.length` 会被编译器拒绝；安全调用（Safe Call）`?.` 在接收者为 `null` 时返回 `null`，Elvis 运算符 `?:` 在左侧为 `null` 时才求值右侧默认表达式。[Kotlin 官方文档：空安全](https://kotlinlang.org/docs/null-safety.html)

## 一段完整的双输入例子

```kotlin
fun lengthOrZero(text: String?): Int = text?.length ?: 0

fun main() {
    println(lengthOrZero("hi"))
    println(lengthOrZero(null))
}
```

预期输出两行 `2` 和 `0`。`"hi"?.length` 得到 `2`（以 UTF-16 代码单元计，当前 ASCII 字符各占一个）；左侧不是 `null`，因此不用 0。空输入的 `text?.length` 为 `null`，再由 `?: 0` 给出 0。若本题换成补充平面 Unicode 字符，Kotlin/JVM `String.length` 不等于用户感知的字符数；本例刻意用 ASCII 排除这个额外问题。[Kotlin 官方文档：安全调用与 Elvis](https://kotlinlang.org/docs/null-safety.html)

## 逐步推演

### 声明输入契约

形参 `String?` 明确允许无值，因此函数必须在读取长度前处理 `null`；若改为 `String`，普通 Kotlin 调用点传 `null` 会被拒绝。

### 传入 hi

`text?.length` 检查非空并得到 2；`?:` 左边已有值，最终返回 2。

### 传入 null

安全调用不访问 `.length`，先产生 `null`；`?:` 取右边 0，最终返回 0。

### 对照不安全断言

把实现改成 `text!!.length` 后传 `null`，`!!` 会在运行时抛空指针异常。它是程序员主动断言“这里必非空”，并没有让原值自动变非空。

## 空字符串与 UTF-16 长度

先区分三个容易混淆的输入。下表把默认值改成 9，便于看出右侧是否真的被使用：

| `text` | `text?.length` | `text?.length ?: 9` | `text!!.length` |
| --- | --- | --- | --- |
| `null` | `null`，跳过长度访问 | 9，求值默认分支 | 空指针异常 |
| `""` | 0 | 0，不求值默认分支 | 0 |
| `"null"` | 4 | 4，不求值默认分支 | 4 |

**Elvis 检查的是 null，不是零、空字符串或其他语言的“假值”。** 实验单独设置“输入为 null”，因此空文本不会自动变成缺失。`"null"` 只是包含四个字母的字符串。

16 位 Unicode 转换格式（16-bit Unicode Transformation Format，UTF-16）按代码单元（Code Unit）编码。补充平面字符 U+1F600 使用代理对（Surrogate Pair）`D83D DE00`，在 Kotlin/JVM 中长度是 2；这不代表屏幕上显示两个字符。实验展示十六进制代码单元，避免把 `length` 当成用户感知字符数。[Java SE 21：String 的 UTF-16 表示](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)

## 编译期保证的边界

Kotlin 还支持在编译器能证明变量未变时，经过 `if (text != null)` 后智能转换（Smart Cast）为非空类型；对可变化且无法证明稳定的值，不能保证任意检查都能智能转换。与没有空值注解的 Java API 互操作时还可能出现平台类型（Platform Type），编译器缺少完整空值信息，运行时仍可能收到 `null`。因此“用了 Kotlin 就不可能出现空指针异常”是错误的。[Kotlin 官方文档：Java 互操作与平台类型](https://kotlinlang.org/docs/java-interop.html#null-safety-and-platform-types)

## 面试回答

Kotlin 在类型上区分不可空 `T` 与可空 `T?`。访问可空值可用 `?.` 安全调用、`?:` 提供默认值，或在满足条件时由编译器智能转换。`!!` 只是强制断言，遇到 `null` 仍会抛异常；Java 平台类型等互操作边界也可能带来运行时空值。因此空安全能提前拦住很多错误，不是绝对消灭所有 NPE。

## 选择题

`fun f(s: String?): Int = s?.length ?: 0`，调用 `f(null)` 得到什么？

- A. 0
- B. `null`
- C. 一定抛空指针异常
- D. 编译失败，因为 `String?` 不允许 `null`

**答案：A。** `?.` 产生 `null`，随后 `?:` 选择 0；函数返回类型为 `Int`。B 忽略默认值，C 混淆安全调用和 `!!`，D 颠倒可空类型含义。

## 参考资料

- [Kotlin 官方文档：Null safety](https://kotlinlang.org/docs/null-safety.html)
- [Kotlin 官方文档：Java 互操作的平台类型](https://kotlinlang.org/docs/java-interop.html#null-safety-and-platform-types)
