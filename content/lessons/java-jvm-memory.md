---
slug: "java-jvm-memory"
title: "JVM 栈堆方法区：引用与对象放在哪里"
description: "沿方法调用和对象可达性区分线程私有帧、共享堆与规范中的方法区，避免背死具体 HotSpot 布局。"
subject: "Java 语言机制"
order: 223
minutes: 20
lab: "workbench"
objectives: ["解释局部引用与堆对象的区别", "区分规范区域与具体实现", "判断方法返回和对象回收的关系"]
prerequisites: ["stack-vs-heap", "java-gc-references"]
---

# 局部变量是引用，不等于对象就在局部栈里

## 先区分引用与回收

垃圾回收（Garbage Collection，GC）管理不可达对象的存储；它不等于方法返回时逐个析构对象。下面先按 JVM 规范区分区域，再讨论具体实现的优化与回收时机。

## 面试回答

Java 虚拟机（Java Virtual Machine，JVM）规范定义运行时数据区：线程私有的程序计数器、JVM 栈与本地方法栈，以及共享的堆和方法区等。方法调用创建栈帧（Stack Frame），包含局部变量表、操作数栈和运行时常量池引用等；局部变量可保存对象引用，规范模型中的类实例与数组在堆上分配。方法区是规范概念，不等于某个版本具体内存结构；HotSpot 的元空间（Metaspace）只是相关实现的一部分。即时编译器（Just-In-Time Compiler，JIT）还可能进行逃逸分析与标量替换，不能从源码机械断言物理布局。

## 用 User u = new User() 拆开

u 是局部变量，里面保存引用值；new 创建的 User 是被引用对象。调用 helper(u) 时传递引用值，helper 得到自己的局部形参，两个引用可指向同一对象。helper 返回，其帧结束，不代表对象马上回收：外部 u 仍可达，或对象被放进全局集合而继续可达。

| 项目 | 规范层面用途 | 常见误解 |
| --- | --- | --- |
| JVM 栈 | 每线程方法调用帧 | “里面只能放基本类型” |
| 堆 | 类实例与数组，供线程共享 | “所有对象物理上绝不优化掉” |
| 方法区 | 类结构与相关运行时信息 | “一定就是永久代/全部等于元空间” |
| 运行时常量池 | 每类/接口的常量信息 | “所有常量都在同一固定地址” |

## 实验代码

```java
class Main {
    static class User { int age=18; }
    static void birthday(User u) { u.age++; }
    public static void main(String[] args) {
        User a=new User();
        birthday(a);
        System.out.println(a.age);
    }
}
```

预期 19。形参 u 是引用值的复制，但修改的是共同对象；不是 Java 采用了 C++ 引用传参，也不是两个 User 对象。网页 GC 按钮是可达性模型，不预测 JVM 何时真正执行回收。

## 面试追问

StackOverflowError 与 OutOfMemoryError 有什么区别？前者常见于调用深度超出允许栈容量，后者表示所需内存资源无法满足，可能涉及堆、元空间或其他区域；不是“只要递归就一定前者”。局部变量出作用域是否立刻 GC？没有这个保证，回收取决于可达性、收集器与运行状态；源码作用域和优化后引用存活也不必逐字对应。不要依赖 System.gc() 保证某对象当场回收。

## 选择题

方法返回后，其内部创建并返回给调用者的对象会怎样？

A. 与方法栈帧一起必定销毁

B. 只要仍可达就不能按不可达对象回收

C. 返回时自动复制完整对象到调用者栈

D. 永远不能回收

**答案：B。** A 把帧和对象寿命绑定，C 混淆引用返回，D 忽略后续可能失去可达引用。何时物理回收仍取决于具体实现与运行状态。

## 参考

- [JVM 规范：运行时数据区与栈帧](https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-2.html)
