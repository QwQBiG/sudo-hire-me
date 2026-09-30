---
slug: "oop-static-instance-members"
title: "静态成员与实例成员"
description: "创建两个计数器后分别修改实例值，观察类级创建次数为何共享。"
subject: "编程基础与面向对象"
order: 26
minutes: 15
lab: "workbench"
objectives: ["判断字段属于类还是对象", "推导两个实例和一个静态计数器的值", "解释静态方法缺少隐式实例接收者"]
prerequisites: ["oop-classes-objects", "constructor-initialization"]
---

# 一个类创建两次，哪些数据只有一份

## 两种归属

在 Java 中，不带 `static` 的实例字段（Instance Field）是每个对象各有一份的状态；`static` 类字段（Class Field）属于类级状态，不因创建两个对象就变成两份。实例方法有接收对象 `this`，类方法（Static Method）不带特定对象的隐式 `this`。这讲的是**语言成员归属**，不是保证它们分别处于某个固定的物理内存地址。[Java 语言规范：类变量与实例变量](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.1.1)

## 逐步推演

### 第一步：定义两种字段

```java
class Counter {
  private static int created = 0;
  private int value = 0;

  Counter() { created++; }
  void tick() { value++; }
  int value() { return value; }
  static int createdCount() { return created; }
}

public class Main {
  public static void main(String[] args) {
    Counter first = new Counter();
    Counter second = new Counter();
    first.tick();
    System.out.println(first.value() + " " + second.value());
    System.out.println(Counter.createdCount());
  }
}
```

本例假设单线程、这一进程中尚未另行创建 `Counter`，不讨论多类加载器。`created` 从 0 开始；`first` 和 `second` 各有自己的 `value`。

### 第二步：两次构造只更新同一个类字段

第一次 `new Counter()` 后 `created=1`，对象 first 的 `value=0`；第二次后 `created=2`，对象 second 的 `value=0`。构造器中的 `created++` 指向同一个类字段。若误以为静态字段也随对象复制，会错算成两个互不相关的 1。

### 第三步：实例方法只修改其接收对象

`first.tick()` 让 first 的 `value` 由 0 变 1；second 仍为 0。因此预期第一行输出 `1 0`，第二行输出 `2`。`Counter.createdCount()` 不需要任何特定对象，因为它读取的是类字段。

| 对象/类级状态 | 调用后值 |
| --- | ---: |
| first.value | 1 |
| second.value | 0 |
| Counter.created | 2 |

### 第四步：确认 static 方法不能凭空访问实例值

若在 `createdCount()` 中直接写 `return value;`，没有 `this` 指定要读 first 还是 second，Java 会拒绝。静态方法**可以接收对象参数**并通过该对象读取实例值，例如 `static int read(Counter c) { return c.value; }`；“静态方法不能访问任何实例成员”说得过满。它只是没有隐式接收对象。[Java 语言规范：静态方法限制](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.2)

## 面试回答

Java 实例成员属于每个具体对象，类级 `static` 字段由类共享；静态方法没有隐式 `this`，不能直接决定要读哪个对象的实例字段，但可以通过显式对象参数访问。本例创建两个计数器使共享 `created=2`，只给 first 调用 `tick()` 则实例值为 1 和 0。`static` 讲归属，不等于对象线程安全，也不保证某种特定内存区域布局。

## 常见错误

- **“每 new 一个对象就复制一份 static 字段。”** 同一个类级变量在本例被两个构造调用更新。
- **“静态方法完全不能接触实例数据。”** 它可经显式传入的实例访问。
- **“对 `private static int created` 做自增天然线程安全。”** 自增不是凭 `static` 或 `private` 自动获得原子性。
- **“static 一定在物理栈或物理堆中的固定地方。”** 语言归属不推出具体存储布局。

## 选择题

按本课单线程代码，两次创建 `Counter` 后只调用 `first.tick()`，`first.value()`、`second.value()`、`Counter.createdCount()` 分别是？

- A. 1、0、2
- B. 1、1、2
- C. 1、0、1
- D. 2、2、2

**答案：A。** 两个实例字段独立，类字段累计两次构造。B、D 把实例状态共享，C 漏算一次构造。

## 参考资料

- [Java 语言规范：静态字段与实例字段](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.1.1)
- [Java 语言规范：静态方法](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.4.3.2)
