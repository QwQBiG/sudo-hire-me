---
slug: "oop-classes-objects"
title: "类、对象与实例状态"
description: "用两个计数器和一个别名，看清类的定义、对象创建、引用与独立状态。"
subject: "编程基础与面向对象"
order: 17
minutes: 15
lab: "workbench"
objectives: ["区分类的定义与运行中的对象", "追踪两个实例和引用别名的状态", "辨别实例成员与类级成员"]
prerequisites: ["function-arguments"]
---

# 类和对象：同一份定义为什么能有不同状态

## 定义、实例与引用

面向对象编程（Object-Oriented Programming，OOP）常用类（Class）描述一类对象有什么数据和操作。按 Java 术语，字段（Field）保存状态，方法（Method）描述行为，构造器（Constructor）参与新对象的初始化。类是**类型定义**；对象（Object）或实例（Instance）是运行时创建的具体实体。仅写下类的定义不会自动创建一个可使用的实例。

本课使用 Java 的 `Counter`：每个计数器对象有自己的 `value` 字段；`increment()` 修改**接收这次调用的对象**。多个对象共享同一份方法定义，却可以各自保存不同的 `value`。Java 变量 `first` 保存的是对象引用值；它不是把整个对象内容塞进局部变量里。[Java 语言规范：类实例创建](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9)

## 逐步推演

### 第一步：只定义一个 Counter 类

下面是完整的单文件 Java 示例，可放入 `Main.java`：

```java
class Counter {
  private int value;

  Counter(int start) { value = start; }
  void increment() { value++; }
  int value() { return value; }
}

public class Main {
  public static void main(String[] args) {
    Counter first = new Counter(0);
    Counter second = new Counter(0);
    Counter alias = first;
    alias.increment();
    System.out.println(first.value() + " " + second.value());
    System.out.println(first == alias);
    System.out.println(first == second);
  }
}
```

`Counter` 定义了字段、构造器和两个方法；此时还没有说 `first` 与 `second` 是否指向同一个对象。这里 `private` 只限制字段在类外直接访问，下一课专门解释封装。

### 第二步：两次 new 创建两个实例

`new Counter(0)` 被执行**两次**，所以有两个不同对象，每个初始 `value = 0`。可以把引用关系画成：

```text
first  ──→ 对象 A：value = 0
second ──→ 对象 B：value = 0
```

“两个对象当前字段值相等”并不意味着它们是同一个对象。`first == second` 比较这两个 Java 引用是否指向同一对象，结果为 `false`；不要把引用身份比较和业务上的内容相等混为一谈。

### 第三步：给引用起别名没有创建新对象

`Counter alias = first;` 复制了引用值，`alias` 和 `first` 都指向对象 A，`second` 仍指向对象 B：

```text
first ──┐
        ├──→ 对象 A：value = 0
alias ──┘
second ─────→ 对象 B：value = 0
```

所以 `first == alias` 为 `true`。如果以后仅执行 `alias = second`，是改变 `alias` 变量的指向，不会把对象 A 的字段改成对象 B 的值。

### 第四步：通过别名修改 A，B 仍独立

`alias.increment()` 的接收对象是 A，于是 A 的 `value` 从 0 变 1。`first.value()` 读到 1，而 `second.value()` 仍是 0。本例的三行预期输出依次为 `1 0`、`true`、`false`。

对象 A 与 B 的 `increment` 方法使用相同定义，操作的是各自的实例状态（Instance State）。调用 `first.increment()` 与 `second.increment()` 的差别在于接收对象不同，而不是编译出两个不相干的函数源码。

## 面试回答

类定义一类对象可拥有的状态和行为，对象是运行时创建的具体实例。`new Counter(0)` 执行两次得到两个不同对象，各自有独立的实例字段；把 `first` 赋给 `alias` 只复制引用，两者仍指向同一对象。通过 `alias` 修改对象，`first` 能看见变化，但另一个对象 `second` 不受影响。Java 的 `==` 在对象引用上比较是否同一对象，不等同于按字段内容比较。

## 实例成员和类级成员

在 Java 中，不带 `static` 的字段属于具体实例；每创建一个 `Counter`，就有对应的 `value`。若定义 `static int createdCount`，它属于类级状态，不会每个对象各有一个独立副本。方法也可有实例方法与 `static` 方法；静态方法不能凭空知道要修改哪个对象的实例字段。[Java 语言规范：类变量与实例变量](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.3)

术语和对象模型随语言而异。例如 Python 允许对象与类在运行时更动态地增加或查找属性；C、Rust、Zig 可以用结构体、函数和其他机制组织数据，但不能因此说它们与 Java 的类继承规则完全相同。

## 常见错误

- **“创建两个初值为零的对象，它们就是同一个对象。”** 内容相等不等于身份相同；本例执行了两次 `new`。
- **“`alias = first` 又复制了一个 Counter 对象。”** 复制的是 Java 引用值，没有调用构造器。
- **“通过 alias 修改字段只会影响 alias。”** `alias` 和 `first` 指向同一对象 A，观察到的是同一份实例状态。
- **“static 字段也为每个实例各保存一份。”** `static` 字段是类级状态，不能拿它演示实例独立性。

## 选择题

按本课示例执行 `Counter alias = first; alias.increment();` 后，下列哪项正确？

- A. `first.value()` 为 1，`second.value()` 为 0
- B. `first.value()` 为 0，`second.value()` 为 1
- C. `first`、`second`、`alias` 都指向同一个对象
- D. `alias.increment()` 会自动创建第三个对象

**答案：A。** `alias` 与 `first` 指向 A，所以 A 变成 1；`second` 指向独立的 B，仍为 0。B 指错了对象；C 忽略两次 `new`；D 把方法调用误当成对象创建。

## 面试追问

**为什么 `==` 与 `equals` 在 Java 对象上可能不同？** `==` 比较引用是否同一对象；`equals` 是方法，其内容相等规则可由类设计和重写。没有理解类的 `equals` 实现时，不应猜两个字段相同的对象一定 `equals` 为真。[Java `Object.equals` 官方 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))

## 参考资料

- [Java 语言规范：对象创建表达式](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9)
- [Java 语言规范：实例变量与类变量](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.3)
- [Java `Object` API：引用身份与内容相等](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object))
