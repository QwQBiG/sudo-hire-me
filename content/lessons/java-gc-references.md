---
slug: "java-gc-references"
title: "Java 有垃圾回收为什么仍会内存泄漏"
description: "沿强引用、弱引用和可达性走一遍对象命运，区分有资格回收与立即回收。"
subject: "Java 语言机制"
order: 191
minutes: 17
lab: "workbench"
objectives: ["解释强可达与仅弱可达的差别", "说清取消变量引用不等于立刻回收", "识别集合长期保留对象的逻辑泄漏"]
prerequisites: ["stack-vs-heap", "object-identity-equality"]
---

# Java 可达性：对象什么时候能被回收

## GC 看的是引用路径

以 Java SE 21 的 `java.lang.ref` 规则为范围，垃圾回收（Garbage Collection，GC）依据对象可达性决定能否清理。普通变量、字段等形成的强引用（Strong Reference）路径仍能从运行中的线程等根到达对象时，对象是强可达的。弱引用（Weak Reference）不阻止其目标日后被回收；当收集器认定目标仅弱可达时会清除相应弱引用。**“有资格被回收”不等于“执行到这一行就立刻回收”**。[Java SE 21：java.lang.ref 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/package-summary.html)

## 一段不依赖 GC 时机的代码

```java
import java.lang.ref.Reference;
import java.lang.ref.WeakReference;

public class Main {
    public static void main(String[] args) {
        Object strong = new Object();
        Object alias = strong;
        WeakReference<Object> weak = new WeakReference<>(strong);
        System.out.println(strong == alias);
        System.out.println(weak.get() == alias);
        Reference.reachabilityFence(alias);
        strong = null;
        alias = null;
        System.out.println("strong variables cleared");
        // 不在此处断言 weak.get() 必须为 null。
    }
}
```

预期三行输出是 `true`、`true`、`strong variables cleared`。前两行有强引用参与比较，`Reference.reachabilityFence(alias)` 进一步明确保证目标至少活到这一行；所以第二次比较不是依赖碰巧尚未 GC。最后两次赋值只是清除了这两个局部变量保存的引用；`weak.get()` 何时变为 `null` 取决于后续可达性和收集动作，不给它编造一个固定输出。即使调用 `System.gc()`，也不能把“立即完成本次回收”当作程序契约。[Java SE 21：Reference.reachabilityFence](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/Reference.html#reachabilityFence(java.lang.Object))、[WeakReference](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/WeakReference.html)

## 逐步推演

### 创建与别名

`strong` 指向新对象；`alias=strong` 又建立一条强引用路径。`strong==alias` 为 `true`，因为是同一对象。

### 再创建弱引用

`weak` 是一个独立的引用对象，指向目标但不负责把目标保持强可达。此时强引用仍在，`weak.get()==alias` 为 `true`。

### 清除本例两个局部强引用

令 `strong=null`、`alias=null`。若系统里没有其他强或软引用路径，目标之后可能变成弱可达并被清理；代码不再读取 `weak.get()` 来预测某个必然时刻。

### 对照逻辑泄漏

如果把每个对象都加入长期存活的 `static List<Object>`，集合字段会继续强引用元素。GC 会正常工作，但这些对象依然可达，不能把“有 GC”理解成“放着不管也一定回收”。

## 面试回答

Java GC 按可达性处理对象。只要从根仍有强引用路径，对象就不会因为某个局部变量设为 `null` 而立即消失；仅有弱引用不会阻止后续回收，但清除发生时机不能承诺。长期存活集合误持有不再需要的元素，是有 GC 仍会出现的逻辑内存泄漏；应查清引用链和缓存生命周期，而不是靠 `System.gc()` 猜时机。

## 选择题

某对象仅被一个 `WeakReference` 引用，哪项正确？

- A. 调用 `weak.get()` 必须立即返回 `null`
- B. 弱引用不阻止其目标以后被回收，但何时清除不可据此确定
- C. 弱引用与普通强引用一样保证目标一直存活
- D. `System.gc()` 保证下一行 `weak.get()` 是 `null`

**答案：B。** 弱引用提供非保活的引用机制，清除与回收受收集器时机影响。A、D 强行规定时刻；C 把弱引用误当强引用。

## 参考资料

- [Java SE 21：java.lang.ref 的可达性定义](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/package-summary.html)
- [Java SE 21：WeakReference](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/WeakReference.html)
