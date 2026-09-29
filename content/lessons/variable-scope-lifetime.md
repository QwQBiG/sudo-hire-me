---
slug: "variable-scope-lifetime"
title: "作用域与生命周期"
description: "用 C 同名局部变量、静态局部变量和 Java 对象引用，分清名字在哪里可见与对象何时仍有效。"
subject: "编程基础与面向对象"
order: 6
minutes: 17
lab: "walkthrough"
objectives: ["区分词法作用域与对象存储期", "按块规则判断同名变量遮蔽", "解释名字结束不等于对象立即消失"]
prerequisites: ["function-arguments", "stack-vs-heap"]
---

# 名字看不见了，值就消失了吗

## 两个问题别混问

作用域（Scope）问：在程序文本的哪一段，某个名字可用于指代某个声明？存储期（Storage Duration）或对象生命周期（Lifetime）问：相应对象何时存在、何时可安全使用？二者相关，但不是同一个维度。C 的静态局部变量名字只在函数块里可见，却能在多次调用间保留值；Java 的局部引用名离开块后不可见，它曾指向的对象若仍由其他引用到达，可继续使用。[ISO C N1570：作用域与存储期](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)

## 逐步推演

### 第一步：看同名声明怎样遮蔽

```c
#include <stdio.h>

int main(void) {
  int x = 1;
  {
    int x = 2;
    printf("%d\n", x);
  }
  printf("%d\n", x);
  return 0;
}
```

内层块的 `x` 是另一变量，暂时遮蔽外层同名声明，预期先输出 2；离开内层块后外层 `x` 再次可用，输出 1。内层 `x` 生命周期结束不等于外层 `x` 的值也被改为 2。

### 第二步：局部名字也可以关联静态存储期对象

另一段独立 C 程序：

```c
#include <stdio.h>

int next(void) {
  static int count = 0;
  return ++count;
}

int main(void) {
  int first = next();
  int second = next();
  printf("%d %d\n", first, second);
  return 0;
}
```

两次调用放在先后两条语句中，`first` 得到 1，`second` 得到 2，预期打印 `1 2`。`count` 名字只在 `next` 的函数块里可见，所关联对象却在整个程序执行期间保留；第二次调用不会重新创建一个值为 0 的 `count`。

### 第三步：Java 局部引用名退出块后，对象可仍存在

```java
public class Main {
  public static void main(String[] args) {
    StringBuilder saved;
    {
      StringBuilder temp = new StringBuilder("A");
      saved = temp;
    }
    saved.append("B");
    System.out.println(saved);
  }
}
```

`temp` 在内层块外不可引用，`saved` 却仍指向同一对象，所以可继续追加。对象是否被回收由运行时可达性和实现决定，**不是局部变量名退出块就立刻回收**。[Java 语言规范：局部作用域](https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.3)

### 第四步：把三个对象画在不同时间线上

| 示例 | 名字何时可见 | 对象何时有效 |
| --- | --- | --- |
| C 内层 `x` | 仅内层块 | 该块执行期 |
| C `static count` | 仅 `next` 的块内 | 程序执行期间 |
| Java `temp` 与其目标对象 | `temp` 仅内层块 | 目标只要仍可达就可继续使用 |

这也解释为什么“作用域越小，对象一定越快释放”不是跨语言的可靠定律。

## 面试回答

作用域决定名字在哪段代码可见；生命周期或存储期决定对象何时存在和可用。C 内层同名 `x` 会遮蔽外层变量，离开内层后外层变量仍在；C 静态局部变量名字局部可见，但值跨调用保留。Java 局部引用退出块后，该名字不可再用，但对象如果仍被其他引用持有不会仅因此消失。回答时分别指出语言规则、名字和目标对象，不能把它们混成同一件事。

## 常见错误

- **“内层 `x=2` 把外层 `x=1` 改了。”** 示例声明了两个不同变量。
- **“静态局部变量离开函数就销毁。”** C 的静态存储期使它跨调用保留。
- **“Java 局部引用名出了块，对象就必定马上被回收。”** `saved` 仍指向它。
- **“`count` 写在函数里，就必定每次调用从零开始。”** `static` 让同一个对象跨调用保留。

## 选择题

C 函数 `next()` 内有 `static int count=0; return ++count;`，顺序执行 `int a=next(); int b=next();`，`a` 和 `b` 是多少？

- A. 1 和 1
- B. 1 和 2
- C. 2 和 1
- D. 0 和 0

**答案：B。** 同一个静态局部对象先变 1、再变 2；两条完整语句确定调用顺序。A 错当成每次重建，C 颠倒顺序，D 忽略自增。

## 参考资料

- [ISO C N1570：作用域、存储期和表达式求值](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)
- [Java 语言规范：声明作用域](https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html#jls-6.3)
