---
slug: "constructor-initialization"
title: "构造与初始化顺序"
description: "用 Java 父子类与 C++ 成员初始化两个小例子，分清对象创建、默认值和构造器体。"
subject: "编程基础与面向对象"
order: 18
minutes: 18
lab: "workbench"
objectives: ["解释构造器和字段初始化的不同职责", "推导 Java 父子类的实例初始化顺序", "说明 C++ 成员按声明顺序初始化"]
prerequisites: ["oop-classes-objects"]
---

# new 之后，构造器第一行并非第一件事

## 先把术语分开

对象创建（Object Creation）是获得一个新对象的过程；初始化（Initialization）给对象及其部分建立初始状态；构造器（Constructor）是参与初始化的专门函数或语言结构。它们不是“`new` 一执行就直接跑本类构造器第一行”的同义词。不同语言对默认值、基类与成员的顺序有自己的规则，本课只具体讨论 **Java 与 C++**。[Java 语言规范：新类实例的创建](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5)、[C++ 标准草案：基类和成员初始化](https://eel.is/c++draft/class.base.init)

## 逐步推演

### 第一步：观察 Java 的完整小程序

```java
class Base {
  Base() { System.out.println("base constructor"); }
}

class Child extends Base {
  int value = announce();

  static int announce() {
    System.out.println("child field initializer");
    return 7;
  }

  Child() { System.out.println("child constructor: " + value); }
}

public class Main {
  public static void main(String[] args) {
    new Child();
  }
}
```

为免混淆，这里没有用户编写的 `static` 初始化块；`Child` 的静态方法只在字段初始化表达式求值时调用。

### 第二步：先准备对象，再执行父类构造路径

Java 为新对象分配空间并把实例字段先设为该类型的默认值；`Child.value` 起初为 `0`。接着构造链先完成 `Base` 的初始化，打印 `base constructor`。父类构造器运行时，不应假定子类字段初始化表达式已经执行完毕。尤其不要在父类构造器里调用可重写方法并指望子类字段都已准备好。[Java 语言规范：实例创建顺序](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5)

### 第三步：子类字段先于子类构造器体

回到 `Child`，按文本顺序执行它的实例字段初始化表达式和实例初始化块：`announce()` 打印 `child field initializer` 并返回 7，`value` 变成 7。最后执行 `Child()` 的构造器体，打印 `child constructor: 7`。因此预期三行顺序是：

```text
base constructor
child field initializer
child constructor: 7
```

这不是说每个 Java 类都一定只有一个构造器或都没有静态初始化；本例把额外路径去掉，单独看实例初始化链。

### 第四步：C++ 的成员顺序不看初始化列表书写顺序

另一段**独立的 C++ 程序**：

```cpp
#include <iostream>

struct Pair {
  int first;
  int second;
  Pair() : second(first + 1), first(7) {}
};

int main() {
  Pair pair;
  std::cout << pair.first << " " << pair.second << "\n";
}
```

尽管构造器初始化列表先写 `second(...)`，实际成员依**声明顺序**先初始化 `first=7`，再初始化 `second=first+1=8`，预期打印 `7 8`。编译器可能给出顺序警告，但这里读取 `first` 时它已初始化。若声明顺序反过来而表达式仍依赖尚未初始化的值，就会有问题。C++ 基类、成员、构造器体也有严格顺序，不能照搬 Java 默认值规则。[C++ 标准草案：初始化顺序](https://eel.is/c++draft/class.base.init)

## 面试回答

构造器负责参与对象初始化，但对象创建不只运行构造器体。Java 新对象先给实例字段默认值，然后沿构造链初始化父类，再按顺序执行本类字段初始化与实例初始化块，最后运行本类构造器体。C++ 基类与成员先于构造器体初始化，**成员按声明顺序**，不按初始化列表的书写顺序。解释顺序先明确语言和示例；不要把“字段声明处有初值”误认为先于父类构造器，也不要把 C++ 初始化列表的文本顺序误当执行顺序。

## 为什么父类构造器调用可重写方法危险

Java 的实例方法可动态派发到子类实现。若 `Base()` 调用被 `Child` 重写的方法，子类实现可能读取尚处于默认值 `0` 的子类字段；这不是子类“忘记赋值”，而是初始化顺序所致。规避方法是让构造阶段依赖稳定的基类私有状态或不可重写操作，并避免向外暴露未构造完毕的对象。[Java 语言规范：构造期间的方法派发](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5)

## 常见错误

- **“Java 子类字段先初始化，再运行父类构造器。”** 本例顺序恰好相反。
- **“构造器体第一行前所有字段都已拥有显式初值。”** Java 子类字段先有默认值，显式初始化稍后执行。
- **“C++ 成员按冒号后的书写顺序初始化。”** 它们按类里的声明顺序初始化。
- **“Java 与 C++ 对象构造规则完全相同。”** 两种语言的默认值、调用及初始化约束不同，必须分别查规范。

## 选择题

按本课 Java 示例，`new Child()` 的三行预期输出顺序是什么？

- A. `child field initializer`、`base constructor`、`child constructor: 7`
- B. `base constructor`、`child constructor: 0`、`child field initializer`
- C. `base constructor`、`child field initializer`、`child constructor: 7`
- D. 编译失败，因为子类不能定义实例字段

**答案：C。** 父类构造路径先完成，再执行子类字段初始化，最后进入子类构造器体。A、B 颠倒了阶段，D 与 Java 类定义规则不符。

## 参考资料

- [Java 语言规范：类实例创建与构造顺序](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.5)
- [C++ 标准草案：基类及成员初始化顺序](https://eel.is/c++draft/class.base.init)
