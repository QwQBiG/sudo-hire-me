---
slug: "oop-encapsulation"
title: "封装不只是 private"
description: "用账户余额的不变量，理解为什么对象要把有效操作和内部状态放在一起。"
subject: "编程基础与面向对象"
order: 19
minutes: 16
lab: "workbench"
objectives: ["说明封装、访问控制和不变量的联系", "追踪非法操作是否保持原状态", "识别暴露可变内部对象的反例"]
prerequisites: ["oop-classes-objects"]
---

# 封装：保护的是对象始终有效

## 从一个坏状态说起

假设账户以整数“分”记录余额。业务规则是**余额始终不小于零**，这叫不变量（Invariant）：在对象对外完成一次操作后，它必须继续成立。如果余额字段可被任意代码写成 `-50`，再多的“取余额”方法也救不了对象的有效性。

封装（Encapsulation）把相关状态和操作集中在对象里，限制外部对内部表示的直接依赖，并用公开操作维护规则。访问控制（Access Control）如 Java 的 `private`、`public` 是实现封装的工具，但封装的目标不仅是“把字段改成 private”：公开方法如果允许任意非法值，规则仍会被破坏。[Java 语言规范：访问控制](https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6)

## 逐步推演

### 第一步：设定可检查的账户规则

本例只处理**单线程、整数分、余额范围 `0..Integer.MAX_VALUE`**。不讨论货币汇率、并发事务和小数舍入。用 Java 定义完整示例：

```java
class Account {
  private int cents;

  Account(int initialCents) {
    if (initialCents < 0) throw new IllegalArgumentException("negative balance");
    cents = initialCents;
  }

  int balance() { return cents; }

  boolean deposit(int amount) {
    if (amount <= 0 || amount > Integer.MAX_VALUE - cents) return false;
    cents += amount;
    return true;
  }

  boolean withdraw(int amount) {
    if (amount <= 0 || amount > cents) return false;
    cents -= amount;
    return true;
  }
}

public class Main {
  public static void main(String[] args) {
    Account account = new Account(100);
    System.out.println(account.withdraw(120));
    System.out.println(account.deposit(50));
    System.out.println(account.withdraw(80));
    System.out.println(account.balance());
  }
}
```

字段不对外开放任意赋值；构造器拒绝负初值。`deposit` 先排除零、负数和会超出 `int` 上限的加法；`withdraw` 先排除零、负数和超额扣款。这样每条成功路径都可以证明余额仍在允许范围内。

### 第二步：超额扣款必须保持原状态

初始 `cents = 100`。调用 `withdraw(120)` 时，`120 > 100`，方法立即返回 `false`，**没有执行减法**，余额仍是 100。

如果写成“先 `cents -= amount`，再检查是否为负”，对象会短暂进入非法状态，还必须小心回滚；更直接的做法是在修改前检查条件。外部可通过返回值知道操作失败，但不能绕过方法直接把 `cents` 写成负数。

### 第三步：合法存款与扣款各更新一次

接着 `deposit(50)`：`50 > 0`，`50 <= Integer.MAX_VALUE - 100`，因此余额变成 150，返回 `true`。然后 `withdraw(80)`：`80 <= 150`，余额变成 70，返回 `true`。

| 调用 | 是否接受 | 操作后余额（分） |
| --- | --- | --- |
| 构造 `Account(100)` | 是 | 100 |
| `withdraw(120)` | 否 | 100 |
| `deposit(50)` | 是 | 150 |
| `withdraw(80)` | 是 | 70 |

`balance()` 只能读出当前整数，不允许通过返回值改写内部字段。代码若被正确编译并运行，四次打印的预期内容为 `false`、`true`、`true`、`70`。

### 第四步：检查边界条件而不是只检查成功案例

`deposit(0)` 与 `withdraw(-1)` 都返回 `false`，状态不变；接近 `Integer.MAX_VALUE` 时的存款也会因预先检查被拒绝，避免普通有符号整数加法越界。这是本例“不变量”的具体证明范围。

**并发是另一层问题**：如果多个线程同时调用没有同步的账户方法，单线程的检查顺序不足以保证并发下的不变量。封装接口让规则有统一入口，但不自动使操作原子化。

## 面试回答

封装把对象的状态与维护该状态的操作放在一起，对外暴露稳定的行为接口，限制外部直接依赖或破坏内部表示。`private` 是访问控制手段，不是封装本身；关键是公开方法也要维护不变量。例如账户余额非负，超额扣款必须拒绝且原状态不变。若返回内部可变对象的直接引用，或者公开一个可写入任意余额的 setter，即使字段是 private，封装仍可能被绕过。线程安全需要另外设计，不能由 private 自动推出。

## 一个容易忽略的泄漏

假设对象有 `private List<String> records`，却在公开方法里直接 `return records`。调用方得到同一个可变列表后可以 `clear()`，绕过原本的添加与校验操作。较稳妥的接口可只提供受控查询、不可变快照或只读视图；选择要结合是否需要实时反映变化。**“字段私有”不等于“内部可变状态没有泄漏”。**

不同语言的访问修饰符与可见性边界并不完全一样；这里的 `private` 结论针对示例 Java 代码，不能直接照搬到 Python 的命名约定或 Rust 的模块可见性规则。

## 常见错误

- **“把字段都设成 private、自动生成 getter/setter 就完成封装。”** 不受约束的 setter 仍可能写出非法状态。
- **“操作失败可以先扣款，稍后有空再恢复。”** 对外可观察的中间非法状态和异常路径会增加错误风险；本例先校验再修改。
- **“getter 绝不会破坏封装。”** 返回可变内部对象的引用可能让外部直接修改对象内容。
- **“private 保证线程安全。”** 访问可见性不等于并发互斥或原子性。

## 选择题

账户初始余额 100 分，依次调用 `withdraw(120)`、`deposit(50)`、`withdraw(80)`。按本课的返回约定与单线程实现，最终余额是多少？

- A. `-50` 分
- B. `-20` 分
- C. `70` 分
- D. `150` 分

**答案：C。** 超额扣款失败且不改状态，随后 `100 + 50 - 80 = 70`。A、B 把失败操作算进了余额；D 忽略最后一次合法扣款。

## 面试追问

**为什么代码还检查 `Integer.MAX_VALUE - cents`？** 即使不允许负余额，直接算 `cents + amount` 仍可能超过 Java `int` 上限并回绕。先用不会溢出的边界比较拒绝超额存款，才能保持“余额在合法范围内”的完整不变量。[Java 语言规范：整数加法溢出](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.18.2)

## 参考资料

- [Java 语言规范：成员访问控制](https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.6)
- [Java 语言规范：整数加法行为](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.18.2)
- [Java Collections 官方 API：不可变副本与可变视图](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html#copyOf(java.util.Collection))
