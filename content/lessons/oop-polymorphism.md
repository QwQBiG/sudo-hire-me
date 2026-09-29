---
slug: "oop-polymorphism"
title: "重写、重载与动态派发"
description: "同一只 Dog 经 Animal 引用调用方法，为什么 speak 看对象而 feed 看声明类型？"
subject: "编程基础与面向对象"
order: 23
minutes: 18
lab: "dispatch"
objectives: ["根据声明类型和实际对象分别判断方法调用", "区分方法重写与重载", "说明 Java 动态派发适用的成员范围"]
prerequisites: ["oop-inheritance-composition"]
---

# 多态：一个 Animal 引用为什么会“汪”

## 先分清两种类型

多态（Polymorphism）在本课特指：通过一个父类型引用调用方法，运行中的子类对象可以表现出自己的实现。Java 语句 `Animal pet = new Dog();` 里，变量 `pet` 的**声明类型/静态类型**是 `Animal`，它实际指向的对象类型/运行时类型是 `Dog`。这两个信息都重要，但负责不同阶段的决定。

编译器先根据 `Animal` 检查 `pet` 可调用哪些方法；如果所选的是可被重写的实例方法，运行时再根据实际对象找对应实现。方法重写（Method Overriding）是在子类提供父类实例方法的对应实现；方法重载（Method Overloading）是同名方法具有不同参数列表，调用点先选中某个方法签名。不能仅看“名字都一样”就说它们是同一种机制。[Java 语言规范：方法调用](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12)

## 逐步推演

### 第一步：准备一个可运行的 Java 例子

```java
class Animal {
  String speak() { return "动物叫声"; }
}

class Dog extends Animal {
  @Override String speak() { return "汪"; }
}

class Cat extends Animal {
  @Override String speak() { return "喵"; }
}

public class Main {
  static String feed(Animal pet) { return "feed(Animal)"; }
  static String feed(Dog pet) { return "feed(Dog)"; }
  static String feed(Cat pet) { return "feed(Cat)"; }

  public static void main(String[] args) {
    Animal pet = new Dog();
    System.out.println(pet.speak());
    System.out.println(feed(pet));
  }
}
```

`Dog.speak()` 与 `Animal.speak()` 的参数列表和返回类型相容，属于重写；三个 `feed` 参数类型不同，属于重载。这里 `feed` 特意定义成 `static`，便于单独观察**编译期选重载签名**，不再混入实例方法的动态派发。

### 第二步：让 pet 的声明与实际类型分开

`Animal pet = new Dog();` 只创建**一个 Dog 对象**，没有额外创建 Animal 对象。`pet` 的声明类型为 `Animal`，因此编译期知道它能调用 `Animal` 声明的 `speak()`；运行时发现实际对象为 `Dog`。

| 决策所需信息 | 本例数据 |
| --- | --- |
| 调用表达式的静态类型 | `Animal` |
| 实际接收对象类型 | `Dog` |
| 编译期确认的方法签名 | `speak()` |
| 运行期使用的重写实现 | `Dog.speak()` |

### 第三步：重写跟着运行时对象走

执行 `pet.speak()` 时，Java 对这个普通实例方法进行动态查找（Dynamic Dispatch），最后调用 `Dog.speak()`，按代码逻辑返回 `汪`。把右边的 `new Dog()` 换成 `new Cat()`，声明类型仍是 `Animal`，相同调用表达式会返回 `喵`。[Java 语言规范：动态方法查找](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.4.4)

这不是说“所有成员访问都由实际类型决定”。Java 的字段访问与 `static` 方法调用不按此规则；`private` 方法不被子类重写，`final` 实例方法不能被重写。讨论动态派发先说明讨论的是可重写的实例方法。

### 第四步：重载先看调用点的静态参数类型

执行 `feed(pet)` 时，实参表达式 `pet` 的静态类型是 `Animal`；三个重载里匹配的是 `feed(Animal)`，即使它运行时指向 `Dog`。所以本例两行预期输出为 `汪` 与 `feed(Animal)`。

若另写 `Dog dog = new Dog(); feed(dog);`，实参静态类型变为 `Dog`，会选 `feed(Dog)`。调用点选择了哪个**重载签名**主要在编译期确定；若被选中的签名是可重写的实例方法，之后仍可能对该签名进行运行时派发。本例使用 `static feed`，没有这一额外步骤。[Java 语言规范：重载选择](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12.2)

## 面试回答

Java 多态调用要分两步：静态类型先决定某个方法名、参数列表是否可用，并在重载中选择签名；对可重写的实例方法，运行时对象类型再决定调用哪个重写实现。`Animal pet = new Dog();` 中，`pet.speak()` 使用 `Dog.speak()`，而本课的静态重载 `feed(pet)` 依据实参静态类型 `Animal` 选择 `feed(Animal)`。重写是子类实现父类已有的实例方法签名，重载是同名不同参数列表；不能把静态方法或字段也说成同样的动态派发。

## 实验：改变声明类型而不换运行机制

实验固定 Java 风格的 `Animal`、`Dog`、`Cat` 和三个 `static feed` 重载。先选实际对象，再选合法的声明类型。观察两条路径：`speak()` 的最后实现随实际对象变化；`feed(...)` 的重载签名随声明类型变化。尝试 `Dog` 对象分别用 `Animal` 和 `Dog` 引用来接收，`speak()` 都是“汪”，但 `feed` 的目标从 `feed(Animal)` 变成 `feed(Dog)`。

这是**按上述类关系计算选择结果的教学模型**，不在浏览器内编译 Java 程序，也不模拟所有 Java 重载规则、泛型、空值或多重继承。面板中只允许实际对象类型或其父类型作为声明类型，避免出现 `Cat pet = new Dog()` 这样的非法赋值。

## 其他语言的边界

C++ 需要把基类方法声明为 `virtual`，经适当的基类指针或引用调用时才按动态对象类型使用重写实现；不能直接照搬 Java “普通实例方法默认虚调用”的结论。Rust 可以用 trait 对象进行动态分发，Zig 可显式组织函数指针与数据，但它们没有 Java 类继承的同一套语义。Kotlin 类及成员默认 `final`，需要显式 `open` 才可重写。[C++ 标准草案：虚函数](https://eel.is/c++draft/class.virtual)、[Rust 官方教材：trait 对象](https://doc.rust-lang.org/book/ch18-02-trait-objects.html)、[Kotlin 官方文档：继承](https://kotlinlang.org/docs/inheritance.html)

## 常见错误

- **“Animal 引用指向 Dog，会调用 Animal.speak。”** 对本例可重写实例方法，运行时选 `Dog.speak()`。
- **“`feed(pet)` 会按 Dog 实例选 feed(Dog)。”** 本例的静态重载依据 `pet` 的声明类型 `Animal` 选签名。
- **“重载和重写都只是同名函数。”** 重写要求对应父类方法签名；重载通过不同参数列表区分，决策阶段也不同。
- **“Java 的 static 方法也能 override。”** 同名静态方法涉及隐藏（Hiding），不是普通实例方法的重写与动态派发。

## 选择题

在本课给出的 Java 类与重载定义下，执行 `Animal pet = new Dog();`，依次调用 `pet.speak()` 与 `feed(pet)`，哪项是预期结果？

- A. `动物叫声`、`feed(Animal)`
- B. `汪`、`feed(Dog)`
- C. `汪`、`feed(Animal)`
- D. 编译失败，因为 Animal 变量不能引用 Dog 对象

**答案：C。** `speak()` 是实例方法重写，按实际 Dog 对象派发；`feed(pet)` 的静态重载选择依据实参静态类型 Animal。A 忽略重写，B 把重载误当运行时选择，D 忽略父类型引用可以指向子类实例。

## 面试追问

**能否只凭对象的实际类型预测某个调用会选哪个重载？** 不能。还要看调用点的实参静态类型、可用候选方法与语言的重载解析规则；动态对象类型负责的是已经选定签名之后、可重写实例方法的具体实现选择。

## 参考资料

- [Java 语言规范：编译期重载解析与运行期方法调用](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12)
- [C++ 标准草案：虚函数与重写](https://eel.is/c++draft/class.virtual)
- [Rust 官方教材：trait 对象的动态分发](https://doc.rust-lang.org/book/ch18-02-trait-objects.html)
- [Kotlin 官方文档：open 与 override](https://kotlinlang.org/docs/inheritance.html)
