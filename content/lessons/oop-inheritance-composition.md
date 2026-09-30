---
slug: "oop-inheritance-composition"
title: "继承与组合怎么选"
description: "从汽车和发动机的关系出发，再用正方形反例检查子类能否真正替代父类。"
subject: "编程基础与面向对象"
order: 22
minutes: 17
lab: "workbench"
objectives: ["区分 is-a 与 has-a 的建模关系", "说明继承与组合的代码耦合差别", "通过可变矩形反例检查行为可替代性"]
prerequisites: ["oop-classes-objects", "oop-encapsulation"]
---

# 继承与组合：不仅要看名字像不像

## 两种关系解决不同问题

继承（Inheritance）让一个类基于另一类获得类型关系或实现。在 Java 中，`Car extends Vehicle` 表示 `Car` 对象可作为 `Vehicle` 使用，并可能复用或重写其方法。组合（Composition）让对象把另一个对象作为组成部分，例如 `Car` 有一个 `Engine` 字段，并把启动工作委托给它。前者常称“是一个”（is-a），后者常称“有一个”（has-a）。

“汽车有发动机”不表示“汽车是发动机”。用 `Car extends Engine` 只为少写一行字段，看似复用了 `start()`，却建立了错误的类型关系。反过来，也不能机械说“永远不要继承”：若子类确实满足父类型的行为约定，需要让调用方把它当父类型使用，继承或接口实现有其价值。[Java 语言规范：类继承](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.4)

## 逐步推演

### 第一步：把两个问题分别画出来

假设 `Vehicle` 承诺车辆可以 `move()`，`Engine` 提供 `start()` 操作。`Car` 既是一种 `Vehicle`，又拥有一个 `Engine`：

```text
Car ──继承──→ Vehicle：可作为车辆使用
Car ──持有──→ Engine：启动时委托给发动机
```

继承箭头表达对外类型承诺；持有关系表达实现依赖。即使换成另一款发动机，汽车仍然是车辆；它不应因此变成发动机的子类。

### 第二步：用具体对象核对继承和组合

以下 Java 程序同时展示两种关系：

```java
class Vehicle {
  String move() { return "moving"; }
}

class Engine {
  String start() { return "engine on"; }
}

class Car extends Vehicle {
  private final Engine engine;
  Car(Engine engine) { this.engine = engine; }
  String start() { return engine.start(); }
}

public class Main {
  public static void main(String[] args) {
    Car car = new Car(new Engine());
    Vehicle vehicle = car;
    System.out.println(vehicle.move());
    System.out.println(car.start());
  }
}
```

`vehicle` 和 `car` 指向同一个汽车对象；`vehicle.move()` 可调用继承来的车辆行为。`car.start()` 则进入汽车方法，再委托给被持有的发动机。按代码逻辑，预期依次打印 `moving` 和 `engine on`。把 `engine` 字段设为 `private final`，调用方不能直接替换这份引用；真实产品仍需设计注入、错误与生命周期规则。

### 第三步：检验“是一个”背后的行为约定

类型名称合适还不够。另设一个**可变** `Rectangle`，契约允许分别设置宽与高；调用方先 `setWidth(2)` 再 `setHeight(3)`，预期 `area()` 为 6。

```java
class Rectangle {
  protected int width, height;
  void setWidth(int value) { width = value; }
  void setHeight(int value) { height = value; }
  int area() { return width * height; }
}

class Square extends Rectangle {
  @Override void setWidth(int side) { width = height = side; }
  @Override void setHeight(int side) { width = height = side; }
}
```

如果 `Rectangle shape = new Square(); shape.setWidth(2); shape.setHeight(3);`，最后宽高都是 3，`area()` 是 **9**。虽然数学上正方形是矩形，这个**可变 Rectangle API** 承诺独立设置两边，`Square` 却破坏了依赖该契约的程序。这是行为可替代性（Behavioral Subtyping）的问题，不是编译器的类型错误。[Liskov 与 Wing：行为子类型原始论文](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf)

### 第四步：选择更准确的边界

若调用方只需要 `area()`，可以让矩形和正方形分别实现一个面积接口，各自持有适合自己的尺寸数据；不必让可变正方形继承独立宽高的可变矩形。若只是想复用某段计算或服务，可以把帮助对象组合进来，或者提取一个无状态函数。

决定时依次问：调用方是否真的需要把子类当父类型？子类能否遵守父类型的行为承诺？复用的是**类型契约**还是仅仅一段实现？这些问题比“哪个写法代码行数少”更可靠。

## 面试回答

继承建立子类可作为父类型使用的关系，组合让对象持有并委托另一个对象工作。汽车可以继承车辆类型，但应组合发动机，而不应继承发动机。选择继承时不仅看“is-a”字面关系，还要检查子类能否满足父类型的行为契约：若可变矩形允许宽高独立设置，可变正方形重写 setter 后导致原本预期面积 6 的程序得到 9，就不适合作为该矩形 API 的子类。只是为了复用实现时优先考虑组合；真正需要可替代的抽象时再用继承或接口。

## 语言边界

Java 类单继承，但可实现多个接口；Kotlin 的类和成员默认是 `final`，若要作为可继承实现必须显式 `open`，接口也有自己的规则。[Kotlin 官方文档：继承与 open](https://kotlinlang.org/docs/inheritance.html)

C、Rust、Zig 没有与 Java `extends` 完全相同的类继承机制；它们同样可以组织数据与行为，使用结构体组合、C 的函数指针、Rust trait 等能力，但不能把这些机制直接等同于 Java 的类继承。面试先说明语言，再谈“继承”的具体语义。

## 常见错误

- **“只要现实分类中 A 是 B，代码里就应 extends B。”** 代码还必须满足父类型公开操作的行为预期，可变正方形反例说明这一点。
- **“组合就是复制 Engine 的全部代码进 Car。”** 组合是持有或引用一个 Engine 对象并委托；不是把实现文本粘贴进去。
- **“继承总比组合快，应该为了性能使用。”** 没有具体平台、调用路径和测量时，不能从关系类型推出性能结论。
- **“Java、Rust、Zig 的继承语法只差关键字。”** 语言对象模型不同，不能把类继承规则硬套到 trait 或结构体上。

## 选择题

调用方依赖“设置宽度后再设置高度，二者互不改变”的可变 `Rectangle` 契约。`Square` 覆盖两个 setter，使每次都把宽高改成同一个值。哪项判断最准确？

- A. 因为正方形在数学上是矩形，所以该继承必然正确
- B. 只要编译通过，就证明 `Square` 可安全替代任何 `Rectangle`
- C. 该子类可能破坏调用方依赖的父类型行为契约
- D. 继承会自动把 setter 改为按面积计算

**答案：C。** 按题设操作顺序，调用方预期面积 6，子类实际给出 9，说明无法满足这一特定可变 API 的约定。A 与 B 忽略行为契约；D 没有这样的语言规则。

## 面试追问

**“组合优于继承”是否绝对？** 不是。它提醒不要为了复用一点代码就建立强类型耦合；若确实存在稳定的可替代抽象，继承或接口是合理工具。组合仍需处理依赖对象的创建、生命周期和失败传播，不能仅因为用了字段就自动得到好设计。[Kotlin 官方文档：委托作为实现继承的替代](https://kotlinlang.org/docs/delegation.html)

## 参考资料

- [Java 语言规范：类继承关系](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.1.4)
- [Kotlin 官方文档：继承与可覆写成员](https://kotlinlang.org/docs/inheritance.html)
- [Kotlin 官方文档：通过委托复用实现](https://kotlinlang.org/docs/delegation.html)
- [Liskov 与 Wing：A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf)
