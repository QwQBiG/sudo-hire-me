---
slug: "java-volatile-synchronized"
title: "volatile 为什么不能保证 count++ 正确"
description: "把读改写拆成操作，比较可见性与互斥，用 happens-before 解释 volatile 与 synchronized 的保证。"
subject: "Java 语言机制"
order: 224
minutes: 20
lab: "workbench"
objectives: ["解释 volatile 的可见性关系", "发现复合操作丢失更新", "比较锁与原子计数器"]
prerequisites: ["memory-ordering-visibility", "atomic-cas-basics"]
---

# 看见最新写入，仍然可能把更新覆盖掉

## 面试回答

Java 内存模型（Java Memory Model，JMM）中，volatile 写与同一变量后续 volatile 读建立相应同步关系，可用 happens-before 解释可见性与排序保证；但 `count++` 是读、计算、写的复合操作，不因 count 声明 volatile 就整体原子。synchronized 对同一监视器（Monitor）的临界区提供互斥，并通过解锁与后续加锁建立可见性关系。简单计数可以用 AtomicInteger.incrementAndGet；多个字段的不变量仍需保护整体，而不是把每个字段分别声明 volatile。

## 最小丢失更新轨迹

初始 count=0，A/B 各加一次：A 读 0，B 读 0，A 写 1，B 写 1，最终 1 而不是 2。每次读写都可以满足可见性约束，但两个线程都基于旧值计算。同一把锁包住完整 count++ 时，B 只能在 A 完成后再读，得到 1 并写 2。

### local 与 count 不是同一个位置

把一次 `count++` 拆成三件事：读取共享 `count` 到线程局部值 `local`；计算 `local + 1`；把结果写回 `count`。这里的 local 是帮助理解的临时值，不是要求编译器一定生成某个局部变量或三条硬件指令。读到 0、计算出 1，都还没有改变共享 count。

| 调度 | A 的局部值 | B 的局部值 | 共享 count |
| --- | --- | --- | --- |
| A 读 | 0 | 尚未读取 | 0 |
| B 读 | 0 | 0 | 0 |
| A 算、B 算 | 1 | 1 | 0 |
| A 写 | 1 | 1 | 1 |
| B 写 | 1 | 1 | 1 |

第二次写入是覆盖 `count = 1`，不是“再把 1 加到 count”。这正是更新丢失（Lost Update）的原因。换成 A 完成读、算、写后才调度 B，最终会是 2；volatile 版本偶尔得到正确答案并不构成线程安全证明。

在网页模型中，两线程各有三个有序操作，保持各自线程顺序共有 `C(6,3) = 20` 种交错。最终值为 1 或 2；数量只是这个有限模型的穷举结果，不是 JVM 调度概率。同一把锁把每个递增包成临界区，只剩 A 先或 B 先，两者都得到 2。原子计数器也把一次递增视为不可交错的整体，但不保证多个计数器或多字段业务规则一起原子。

| 工具 | 单变量可见性 | count++ 整体 | 多字段业务不变量 |
| --- | --- | --- | --- |
| volatile int | 有相应保证 | 不保证 | 不自动保证 |
| AtomicInteger 的递增方法 | 有 | 原子 | 仍需协议 |
| 同一锁保护整体操作 | 有 | 互斥 | 能保护被纳入临界区的整体 |

## 实验代码

```java
import java.util.concurrent.atomic.AtomicInteger;
class Main {
    public static void main(String[] args) throws InterruptedException {
        AtomicInteger count=new AtomicInteger();
        Runnable add=() -> { for(int i=0;i<1000;i++) count.incrementAndGet(); };
        Thread a=new Thread(add), b=new Thread(add);
        a.start(); b.start(); a.join(); b.join();
        System.out.println(count.get());
    }
}
```

预期 2000；join 保证已经等待两个工作线程完成。改成无锁 volatile count++ 后某次也可能输出 2000，不能以此证明安全。网页选择的是一种合法交错，既不是所有交错，也不是特定 CPU 的指令跟踪。

## 面试追问

volatile 引用是否保护整个对象？它使引用本身的读写遵守对应规则，不让对象以后所有字段更新都自动同步。“永远从主内存读写”只是粗糙记忆句，不是 JMM 对缓存与寄存器的具体硬件承诺。synchronized 也不是“只管可见性”，同一锁的互斥很关键；如果两个线程各用不同锁，不能保护同一个临界区协议。

## 选择题

两个线程各执行一次 volatile int count 的 count++，最终可能为 1 的原因是？

A. volatile 必定完全没有可见性

B. 整个递增没有原子化，可交错读取同一旧值

C. Java 不支持多线程

D. 两次写入必定相加

**答案：B。** A 否认它实际提供的保证；C 错；D 把覆盖写误作加法。正确工具取决于要保护单个原子操作还是跨字段整体规则。

## 参考

- [Java 语言规范：线程与锁、happens-before](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html)
- [AtomicInteger：原子递增 API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html)
