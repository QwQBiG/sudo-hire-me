---
slug: "object-identity-equality"
title: "对象身份与内容相等"
description: "让两个不同的 Java String 拥有相同文本，分辨引用身份比较和 equals 内容比较。"
subject: "编程基础与面向对象"
order: 28
minutes: 17
lab: "identity"
objectives: ["根据引用关系判断对象身份", "区分 Java 的 == 与 String.equals", "说明相等性契约与跨语言差异"]
prerequisites: ["oop-classes-objects", "shallow-deep-copy"]
---

# 看起来一样，不代表是同一个对象

## 给“相等”选一个维度

对象身份（Object Identity）问两个引用是否指向**同一个对象**；内容相等（Value Equality）问对象按某个定义的规则是否具有相同值。Java 中，两个引用使用 `==` 时比较是否同一对象；`equals` 是可由类定义相等语义的方法。`String.equals` 按字符序列比较，而 `Object` 默认的 `equals` 行为是身份相等。[Java 语言规范：引用 `==`](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.21.3)、[Java `Object.equals` API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))

## 逐步推演

### 第一步：明确创建两个对象

```java
public class Main {
  public static void main(String[] args) {
    String first = new String("go");
    String second = new String("go");
    String alias = first;
    System.out.println(first == second);
    System.out.println(first.equals(second));
    System.out.println(first == alias);
  }
}
```

这里**显式执行两次 `new String(...)`**，创建两个不同的 String 对象；字符串字面量本身可能被驻留，但不改变这两次 `new` 的对象身份结论。`alias = first` 只复制引用，未创建第三个 String 对象。

### 第二步：画引用关系再比较身份

```text
first ──┐
alias ──┴──→ 对象 A："go"
second ────→ 对象 B："go"
```

`first == second` 为 `false`，因为 A 与 B 不同；`first == alias` 为 `true`，因为两个变量都指向 A。不要拿打印出来的文本或猜测内存地址判断对象是否同一实例。

### 第三步：用 String 的规则比较内容

`first.equals(second)` 为 `true`，因为两个 String 的字符序列均为 `go`。因此三行预期依次是 `false`、`true`、`true`。若第二个对象改为 `new String("hi")`，身份仍不同，内容比较也变成 `false`。

### 第四步：把规则放回集合与空值场景

若类自定义 `equals`，一般还应遵守自反、对称、传递、一致等契约，并使相等对象的 `hashCode` 相等，以便基于哈希的集合正确使用。相同哈希值**不反推**对象相等；哈希碰撞允许存在。`first.equals(null)` 可以返回 `false`，但对一个值为 `null` 的引用调用 `equals` 会抛 `NullPointerException`；需要空值安全比较时可用 `Objects.equals(a, b)`。[Java `Object.equals`/`hashCode` 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))

## 面试回答

Java 对象引用的 `==` 判断是否指向同一对象；`equals` 判断类定义的相等关系，String 按内容比较。两个显式 `new String("go")` 是不同对象，`==` 为假而 `equals` 为真；别名引用指向同一对象，`==` 为真。讨论 `equals` 时要说明具体类型实现，重写相等规则时还应维护 `hashCode` 契约；不要用字符串字面量的驻留行为代替通用对象规则。

## 语言边界

Python 以 `is` 比较身份、以 `==` 调用相等语义；Java 的 `==` 对**基本数值类型**又是数值比较，不是所有 `==` 都表示身份。Rust 的 `==` 依 `PartialEq` 实现，C 的指针比较也不是 Java `equals` 方法。先说明语言和操作数类型，再给结论。[Python 官方语言参考：身份比较](https://docs.python.org/3/reference/expressions.html#is-not)

## 常见错误

- **“两个对象内容相同，就必定是同一对象。”** A、B 内容都是 `go`，身份仍不同。
- **“Java 的 `==` 永远比较内存地址。”** 对基本类型它比较值；对引用比较是否同一对象，也不要求暴露原始地址。
- **“`equals` 总是比较所有字段。”** 具体相等规则由类型实现；`Object` 默认按身份。
- **“哈希值相同就等于对象相等。”** 不同对象可产生哈希碰撞。

## 选择题

Java 中 `String a = new String("go"); String b = new String("go");`，哪项正确？

- A. `a == b` 为真，`a.equals(b)` 为假
- B. `a == b` 为假，`a.equals(b)` 为真
- C. 二者都为真，因为文本一样
- D. 二者都必定抛异常

**答案：B。** 两次 `new` 创建不同对象；String 的 `equals` 比较字符序列。A、C 混淆身份与内容，D 与非空对象比较不符。

## 参考资料

- [Java 语言规范：引用相等运算符](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.21.3)
- [Java `Object` API：`equals` 与 `hashCode`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))
- [Python 官方语言参考：身份比较](https://docs.python.org/3/reference/expressions.html#is-not)
