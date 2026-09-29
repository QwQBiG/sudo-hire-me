---
slug: "oop-interface-abstract-class"
title: "接口与抽象类怎么选"
description: "用可计价对象的共同能力与形状的共享状态，区分 Java interface 和 abstract class。"
subject: "编程基础与面向对象"
order: 25
minutes: 17
lab: "walkthrough"
objectives: ["说明 Java 接口和抽象类的成员能力", "根据是否需要共享基类状态选择边界", "解释默认方法并不等于实例字段"]
prerequisites: ["oop-abstraction", "oop-inheritance-composition"]
---

# 接口与抽象类：都能表达约束，侧重点不同

## 先限定为 Java

接口（Interface）可声明一组类型要提供的操作，让不同类遵守共同能力契约。抽象类（Abstract Class）是不能直接实例化的类，可包含抽象方法，也可包含构造器、实例字段和具体方法，供子类继承。**“接口绝不能有方法实现”已经不准确**：Java 接口可定义 `default`、`static`、`private` 方法，但不能像普通类那样以每个实例独有的可变字段保存状态。[Java 语言规范：接口](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)、[抽象类](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1.1)

## 逐步推演

### 第一步：定义横向能力与纵向基类

本例只计算整数面积，不讨论溢出与负尺寸输入：

```java
interface Area {
  int area();
}

abstract class Shape {
  private final String color;
  Shape(String color) { this.color = color; }
  String color() { return color; }
  abstract String kind();
}

class Square extends Shape implements Area {
  private final int side;
  Square(String color, int side) { super(color); this.side = side; }
  @Override String kind() { return "square"; }
  @Override public int area() { return side * side; }
}

public class Main {
  public static void main(String[] args) {
    Square square = new Square("red", 3);
    Area measurable = square;
    Shape shape = square;
    System.out.println(measurable.area() + " " + shape.color());
  }
}
```

`Area` 只要求“可求面积”；`Shape` 保存所有该类形状共同的颜色状态，并提供构造初始化与 `color()` 访问。`Square` 同时继承一个类、实现一个接口，预期打印 `9 red`。

### 第二步：从调用方分别看见什么

`Area measurable` 可调用接口中的 `area()`，但不能仅凭这个声明类型调用 `color()`；`Shape shape` 可调用 `color()` 和 `kind()`，但 `Shape` 没有承诺 `area()`。实际对象都是同一个 `Square`，**静态类型决定可见契约**。这也是为什么“接口更灵活”不能替代写清调用方究竟需要什么能力。

### 第三步：如果另有不同体系的可计价对象

一个 `FloorPlan` 不一定应该继承 `Shape`，却可以实现 `Area`。Java 类只能直接继承一个父类，但可以实现多个接口；这使接口适合表达跨不同类体系的能力。若确有稳定的共同状态和基类构造过程，抽象类更容易放置这些共享实现；继承仍须遵守行为契约，不应只为复用代码硬建立 is-a 关系。

### 第四步：解释默认方法边界

接口可提供 `default` 方法作为通用行为，但这不让接口获得每个实现对象的独立可变实例字段。抽象类可有字段和具体方法，但单继承限制使它不是“接口的更强版本”。两者都可能有抽象方法，选择依据应是对外能力契约、是否确有共同状态与单继承约束。[Java 语言规范：接口方法体](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4.3)

## 面试回答

在 Java 中，接口适合定义跨不同类都能提供的能力，类可实现多个接口；抽象类适合表达同一类体系的共同状态、构造过程和部分实现，但类只能直接继承一个父类。接口并非只能有抽象方法，它也可有默认、静态、私有方法；但它不是每个实例保存可变字段的普通类。选择时先看调用方需要什么契约，再看是否真的需要共享基类状态与继承关系。

## 语言边界

C++ 的纯虚函数与抽象类、Rust trait、Zig 显式接口式约定都能表达某些能力，但不具有与 Java `interface`/`abstract class` 完全相同的成员、继承和运行时规则。问“接口和抽象类区别”时，先声明回答的语言。[Rust 官方教材：trait](https://doc.rust-lang.org/book/ch10-02-traits.html)

## 常见错误

- **“Java 接口绝对不能有实现。”** `default` 等方法可有方法体。
- **“抽象类的每个方法都必须抽象。”** 它可以有具体方法和实例字段。
- **“实现接口就会得到接口里的每实例颜色字段。”** 本例颜色在 `Shape` 中。
- **“接口和抽象类只是写法不同，任何时候可互换。”** 单继承、实例状态和契约建模会影响选择。

## 选择题

按本课 Java 示例，变量 `Area measurable = new Square("red", 3);` 可以直接调用哪一个方法？

- A. `measurable.area()`
- B. `measurable.color()`
- C. `measurable.kind()`
- D. `measurable.super()`

**答案：A。** `Area` 声明了 `area()`；变量静态类型未提供 `color()` 或 `kind()`。B、C 忽略静态类型的可见契约，D 不是这种调用语法。

## 参考资料

- [Java 语言规范：接口声明和成员](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)
- [Java 语言规范：抽象类](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.1.1)
- [Rust 官方教材：trait 能力约束](https://doc.rust-lang.org/book/ch10-02-traits.html)
