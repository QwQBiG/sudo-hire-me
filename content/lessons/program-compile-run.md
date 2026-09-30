---
slug: "program-compile-run"
title: "程序从源码到运行"
description: "用一个跨文件函数调用辨清编译、链接、装载和执行分别解决什么问题。"
subject: "编程基础与面向对象"
order: 3
minutes: 16
lab: "workbench"
objectives: ["区分源码、目标文件和可执行程序", "解释编译错误与链接错误的不同", "说明解释器与编译器不是绝对对立的运行方式"]
prerequisites: ["cpu-execution"]
---

# 一段程序怎样从源码走到执行

## 先抓住两种“还没有运行”

源代码（Source Code）是给人编写、给语言工具处理的文本；处理成功不等于已经执行。编译（Compilation）把某种输入程序变成另一种表示，并检查该阶段能发现的问题。对常见 C 工具链，可以先把每个源文件变成目标文件（Object File），再由链接器（Linker）把它们与需要的库组合为可执行文件（Executable File）。

链接完成后，操作系统的程序装载机制（Program Loading）准备进程映像、所需库和初始执行环境，程序才开始运行。不同系统的装载、动态库与入口细节不一样；本课只抓住阶段职责，不把一个平台的命令格式当成所有语言的统一流程。

| 阶段 | 本例输入 | 关键问题 | 常见产物 |
| --- | --- | --- | --- |
| 编译 | `main.c`、`add.c` | 单个翻译单元的语法、类型与代码生成 | `main.o`、`add.o` |
| 链接 | 两个目标文件 | `add` 的调用能否找到定义 | 可执行程序 |
| 装载与执行 | 可执行程序 | 建立运行环境，执行入口与后续调用 | 运行结果或运行时错误 |

“声明可用”和“定义已经找到”是两回事。C 源文件看到 `int add(int, int);`，能知道如何检查调用形式；但函数实现可能位于另一个目标文件。仅编译 `main.c` 成功，不足以证明最终程序能链接。

## 逐步推演

### 第一步：看清两个文件的职责

设 `main.c` 包含函数声明和调用：

```c
#include <stdio.h>
int add(int a, int b);

int main(void) {
  printf("%d\n", add(2, 3));
  return 0;
}
```

另一个文件 `add.c` 提供实现：

```c
int add(int a, int b) {
  return a + b;
}
```

入口调用 `add(2, 3)`，预计打印 `5`。这时我们只看了源码，尚未验证工具链，也没有产生运行结果。

### 第二步：分别编译，不要求立刻找到函数实现

以 GCC 风格工具链为例，`gcc -c main.c -o main.o` 与 `gcc -c add.c -o add.o` 只生成目标文件，`-c` 明确停止在链接之前。`main.c` 中的声明让编译器能够检查参数数量和类型；`main.o` 仍保留一个等待链接时解决的 `add` 引用。[GCC 官方手册：`-c` 选项](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)

如果把 `printf` 写成未声明的标识符，或者把括号写错，问题可能在编译阶段就出现。具体诊断文本取决于语言标准、工具链和选项，不把某一条错误消息当成规范要求。

### 第三步：链接两个目标文件

使用 `gcc main.o add.o -o app` 作为示意，驱动程序调用链接器查找 `add` 的定义并组合所需代码。若遗漏 `add.o`，`main.o` 中对 `add` 的引用没有对应定义，链接不能完成，可能看到 `undefined reference to add` 一类诊断。[GNU ld 官方文档：链接器组合输入文件](https://sourceware.org/binutils/docs/ld.html)

把 `add.o` 放回链接输入，才能解决这个引用。修改源文件后也要重新处理相应文件；旧目标文件不会凭空知道源文件变更。

### 第四步：装载后才开始执行入口

链接产物交给操作系统启动。装载器准备地址空间和程序需要的资源，再转入运行时入口，最后到本例的 `main`。本例执行 `add(2, 3)` 得 5，`printf` 输出 `5` 后返回 0。**这些是代码正确构建并运行时的预期行为**，不是“编译器看见 `printf` 就已经打印”。

Windows 与类 Unix 系统的可执行文件格式、路径和启动命令不同；上面的 GCC 命令只用于说明阶段，不要求每个平台都生成同名文件。

### 第五步：把错误放回它发生的阶段

| 故障 | 更可能发生的阶段 | 原因 |
| --- | --- | --- |
| `main.c` 里少一个右括号 | 编译 | 语法不成立 |
| `add.c` 未参加最终组合 | 链接 | 需要的符号没有定义可用 |
| 程序读取不存在的输入文件 | 运行 | 已启动后才知道实际环境与输入 |

“编译通过就没有 bug”是错误结论：链接、装载与运行仍可能失败，程序即使输出了结果，也可能有逻辑错误。

## 面试回答

对典型 C 工具链，源码先经编译得到目标文件，链接阶段解决跨文件符号引用并产生可执行程序；启动时系统装载程序，之后才真正执行。编译错误通常与当前源码的语法或类型有关，链接错误通常与定义缺失或重复等跨文件组合有关，运行时错误发生在程序启动之后。不要把“解释型语言不用编译”当作通则：Python 可先生成字节码，Java 常先由 `javac` 生成类文件再由 Java 虚拟机（Java Virtual Machine，JVM）执行或进一步即时编译。

## 不同语言不是同一条流水线

Python 3 可以把源代码编译成字节码（Bytecode）再由解释器执行；是否持久化 `.pyc` 是实现与运行方式问题，**不能因为没看到 `.pyc` 就说完全没编译**。[Python 官方文档：`compile` 与代码对象](https://docs.python.org/3/library/functions.html#compile)

Java 的 `javac` 将 `.java` 编成 JVM 类文件（Class File），`java` 启动 JVM、装载指定类并调用 `main`；JVM 还可能解释或即时编译（Just-In-Time Compilation，JIT）热点代码。[Oracle `javac` 文档](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html)、[Oracle `java` 启动器文档](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)

因此“编译/解释”描述的是**转换和执行机制**，不是按语言名一刀切；同一语言可以有不同实现与运行模式。

## 常见错误

- **“有 `main.o` 就一定能运行。”** 目标文件可以留有尚未解决的外部引用，还不是最终程序。
- **“缺少 `add` 实现是语法错误。”** 声明让编译可进行，缺定义在本例的链接阶段暴露。
- **“解释器逐字符直接执行源码。”** 实现可能先解析并生成字节码等中间形式。
- **“编译通过就证明算法正确。”** 编译只验证它负责的规则，不验证需求与所有运行输入。

## 选择题

本课的 `main.c` 中保留 `int add(int, int);`，但最终链接只提供 `main.o`，没有 `add.o`。最恰当的判断是什么？

- A. `main.c` 必然无法词法分析
- B. `main.o` 中调用 `add` 会自动替换为零
- C. 编译 `main.c` 可能成功，但链接时缺少 `add` 定义
- D. 只有执行到 `add` 那一行才会检查函数是否存在

**答案：C。** 声明足以让编译器检查调用形式；找不到定义是这个独立目标文件组合时的链接问题。A 把声明与词法分析混淆，B 没有这种自动替换，D 把静态链接问题拖到了运行时。

## 参考资料

- [GCC 官方文档：编译、汇编与链接阶段控制](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)
- [GNU ld 官方文档：链接器的输入与输出](https://sourceware.org/binutils/docs/ld.html)
- [Python 官方文档：`compile` 函数](https://docs.python.org/3/library/functions.html#compile)
- [Oracle：`javac` 与 `java` 工具](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html)
