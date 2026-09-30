---
slug: "oop-overloading-overriding"
title: "同名方法：重载还是重写"
description: "用同一个 show 名称追踪参数类型选签名，再看子类是否重写选中的实例方法。"
subject: "编程基础与面向对象"
order: 24
minutes: 17
lab: "workbench"
objectives: ["按参数列表区分重载", "判断何时符合重写签名", "分两阶段计算同名方法调用"]
prerequisites: ["oop-polymorphism"]
---

# 同名，不代表同一种关系

## 先把“签名”说准确

本课按 Java 语义。方法重载（Method Overloading）发生在**同名但参数列表不同**的方法之间；只改返回类型不能单独构成有效重载。方法重写（Method Overriding）是子类对继承来的可重写实例方法提供对应实现，参数签名必须匹配，返回类型等也受兼容规则约束。一个子类可以同时重写某个签名，又增加另一个重载签名。[Java 语言规范：方法签名、重载、重写](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4)

前一课已讲“静态类型先选签名、实际对象再选实现”。这里重点用**相同方法名的两个签名**检验这一点，而不是重复“Animal 会叫 Dog 的声音”的例题。

## 逐步推演

### 第一步：列出候选方法

```java
class Base {
  String show(Number n) { return "Base Number"; }
}

class Child extends Base {
  @Override String show(Number n) { return "Child Number"; }
  String show(Integer n) { return "Child Integer"; }
}

public class Main {
  public static void main(String[] args) {
    Base baseRef = new Child();
    Child childRef = new Child();
    Integer x = 2;
    System.out.println(baseRef.show(x));
    System.out.println(childRef.show(x));
  }
}
```

`Child.show(Number)` 与父类 `Base.show(Number)` 参数列表一致，是重写；`Child.show(Integer)` 与 `show(Number)` 参数不同，是重载。`Number` 是 `Integer` 的父类，所以两种引用都可以把 `x` 交给 `show(Number)`。

### 第二步：先看 baseRef 看到哪些签名

表达式 `baseRef` 的**声明类型**为 `Base`。编译期可见的 `show` 候选只有 `show(Number)`；`Integer x` 可转换给它，因此选定此签名。运行时对象为 `Child`，这个实例方法已被重写，于是运行 `Child.show(Number)`，预期第一行是 `Child Number`。

### 第三步：再看 childRef 的重载选择

`childRef` 的声明类型为 `Child`，编译期可见 `show(Number)` 与 `show(Integer)`。实参 `x` 静态类型为 `Integer`，精确匹配 `show(Integer)`，预期第二行是 `Child Integer`。这一步还没有把 `show(Number)` 的重写机制抹掉；只是调用点先选了另一签名。

| 调用表达式 | 编译期可见的更合适签名 | 最后实现与结果 |
| --- | --- | --- |
| `baseRef.show(x)` | `show(Number)` | `Child.show(Number)` → `Child Number` |
| `childRef.show(x)` | `show(Integer)` | `Child.show(Integer)` → `Child Integer` |

### 第四步：把两个常见编译错误排除

在同一类里再声明 `int show(Number n)`，只改返回类型，不能用作新的重载，会与已有相同参数签名冲突。若把 `Child.show(Number)` 写成 `show(Integer)` 并加 `@Override`，它不是对父类 `show(Number)` 的重写，编译器会指出 `@Override` 不成立。`@Override` 有助于发现“本想重写，却意外创建重载”的笔误。

## 面试回答

Java 重载看同名方法的**参数列表差异**，调用点根据静态类型与适用性规则选签名；不能只靠返回类型重载。重写看子类是否为父类可重写实例方法提供对应签名，选定签名后可按实际对象动态派发。本例 `baseRef.show(Integer)` 先选 `show(Number)` 再调用子类重写实现；`childRef.show(Integer)` 先选更具体的重载 `show(Integer)`。重载与重写不是互斥关系，也不是“同名”两个字就能判定。

## 语言边界

C 没有按参数类型区分的函数重载；C++ 有函数重载，但虚函数动态派发需相应 `virtual` 规则；Kotlin 的覆盖成员通常要标记 `open`、`override`。Rust trait 方法解析与 Java 类继承不同，不应把其同名方法直接套成 Java 的重载/重写。[C++ 标准草案：重载函数](https://eel.is/c++draft/over)、[Kotlin 官方文档：继承](https://kotlinlang.org/docs/inheritance.html)

## 常见错误

- **“只改返回类型就是重载。”** Java 方法参数签名没变，不能靠返回类型区分调用。
- **“子类写了同名方法就一定重写。”** 参数不同可能只是重载；`@Override` 能帮助验证。
- **“静态类型是 Base，就必然运行 Base 实现。”** 签名可由 Base 选中，但重写实现可由实际 Child 对象决定。
- **“Java 的 static 同名方法也普通重写。”** 静态方法可能隐藏，不按实例方法的动态派发规则。

## 选择题

按本课代码，`baseRef.show(x)`（`baseRef` 声明为 `Base`，实际是 `Child`；`x` 为 `Integer`）返回什么？

- A. `Base Number`
- B. `Child Number`
- C. `Child Integer`
- D. 编译失败，`Integer` 不能作为 `Number`

**答案：B。** 编译期只能选 `Base` 可见的 `show(Number)`，运行期调用 `Child` 对该签名的重写实现。A 忽略重写；C 把子类新增重载当成 Base 引用可见；D 忽略继承类型关系。

## 参考资料

- [Java 语言规范：方法签名、重写与重载](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4)
- [Java 语言规范：方法调用选择](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12)
- [C++ 标准草案：重载规则](https://eel.is/c++draft/over)
