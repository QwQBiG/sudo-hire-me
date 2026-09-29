---
slug: "error-handling-models"
title: "返回码、异常与结果类型"
description: "用解析端口号的成功、非法文本和越界输入，比较错误怎样从函数传给调用方。"
subject: "编程基础与面向对象"
order: 16
minutes: 19
lab: "walkthrough"
objectives: ["区分正常返回值与失败信号", "追踪调用方在三种错误模型中的处理路径", "解释错误传播和资源清理的责任"]
prerequisites: ["function-arguments"]
---

# 出错后，调用方怎样知道

## 先约定同一道题

输入文本应解析为 `0..65535` 的整数端口号。`"8080"` 成功得到 8080；`"abc"` 不是十进制整数；`"70000"` 超出允许范围。函数要让调用方区分成功和失败，不能用 `0` 充当失败标记，因为 0 在本题范围内可能是合法值。错误处理机制最核心的契约是：**成功值在哪里、错误信息在哪里、调用方忘记检查时会怎样**。

## 逐步推演

### 第一步：返回码加输出位置

在 C 风格接口中，可以让返回码表示状态，成功时经 `out` 指针写入结果：

```c
/* 示意接口：0 成功，1 格式错误，2 超出范围。 */
int parse_port(const char *text, unsigned short *out);

unsigned short port;
int status = parse_port("8080", &port);
if (status == 0) {
  /* 只有成功后才读取 port。 */
}
```

上述是**接口示意，不是完整可编译实现**。对 `"abc"`，函数返回格式错误码 1，调用方不读 `port`；对 `"70000"` 返回范围错误码 2。若调用方不检查状态就读取未被成功写入的 `port`，结果不可靠。POSIX 的 `open()` 是另一种具体约定：成功返回非负文件描述符，失败返回 `-1` 并设置 `errno`；并非所有 C 函数都按同一套返回码工作。[POSIX `open` 官方规范](https://pubs.opengroup.org/onlinepubs/9799919799/functions/open.html)

### 第二步：异常沿调用链转移控制

在 Java 中，`Integer.parseInt("8080")` 返回整数，`Integer.parseInt("abc")` 抛 `NumberFormatException`。对 `"70000"`，普通 `Integer.parseInt` **仍会成功返回 70000**，因为它只检查 `int` 的解析范围；端口上限是本题的业务规则，还须显式检查并抛合适异常或返回失败。异常（Exception）不是“任意不想要的数值自动转为错误”。

```java
int n = Integer.parseInt(text);
if (n < 0 || n > 65535) {
  throw new IllegalArgumentException("port out of range");
}
```

异常发生后，常规执行不会继续到下一条普通语句，而会寻找匹配的处理路径；资源关闭应放在可靠清理结构里，如 Java 的 try-with-resources。[Java 语言规范：`try` 与 `catch`](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20)

### 第三步：结果类型把两种结果放进返回类型

Rust 的 `Result<T, E>` 明确区分 `Ok(T)` 与 `Err(E)`。下面是**独立可运行**的小程序：

```rust
fn parse_port(text: &str) -> Result<u16, std::num::ParseIntError> {
    text.parse::<u16>()
}

fn main() {
    for text in ["8080", "abc", "70000"] {
        match parse_port(text) {
            Ok(port) => println!("{text}: {port}"),
            Err(_) => println!("{text}: error"),
        }
    }
}
```

按代码语义，三行预期为 `8080: 8080`、`abc: error`、`70000: error`。这里 `u16` 的表示范围正好是 `0..65535`，所以文本格式错误和越界都走 `Err`，但这个简短例子没有把两种错误区分成业务错误码。`?` 可在函数返回兼容错误类型时提前传播错误；调用方仍需在某处决定怎样处理。[Rust 标准库：`Result`](https://doc.rust-lang.org/std/result/)

### 第四步：比较传播和清理责任

| 方式 | 成功路径 | 失败路径 | 容易忘记的事 |
| --- | --- | --- | --- |
| 返回码 | 读返回状态后使用输出值 | 检查状态并停止使用无效输出 | 忽略返回码 |
| 异常 | 返回普通值 | 控制转到匹配处理器或继续传播 | 吞掉异常、漏清理资源 |
| `Result` / 错误联合 | 显式取成功分支 | 显式匹配或向上传播错误 | 随意 `unwrap`、丢失上下文 |

Zig 的错误联合（Error Union）用 `!T` 形如“成功的 T 或错误”；`try` 可传播错误，`catch` 可处理或提供替代值。它与 Rust `Result` 用途相近，**不是同一类型系统实现**。[Zig 官方语言参考：错误联合](https://ziglang.org/documentation/master/#Error-Union-Type)

## 面试回答

错误处理要先定义成功结果和失败信息如何传递。返回码让调用方显式检查状态；异常把控制转移到处理器；Rust `Result<T,E>` 或 Zig 错误联合把成功与失败放在返回类型里。任何方式都不能免除边界检查和资源清理：端口 `"70000"` 即使是合法 `int`，仍违反端口范围；把 0 当通用失败值会与合法结果冲突。选用哪种方式要看语言、接口契约、失败是否可恢复以及项目约定。

## 常见错误

- **“0 一定可以表示失败。”** 本题 0 在数值范围内，混用会失去区分能力。
- **“`Integer.parseInt("70000")` 会因为端口上限抛异常。”** 它不知道端口业务规则。
- **“异常一定会被当前函数处理。”** 可以继续传播；未处理时行为依环境与调用层决定。
- **“`Result` 就不用处理错误。”** 它把分支显式化，仍需匹配、传播或按契约转换。

## 选择题

本题端口范围为 `0..65535`。Java `Integer.parseInt("70000")` 后，最准确的判断是什么？

- A. 解析必定因不是整数而失败
- B. 解析可得到 70000，但还须执行端口范围检查
- C. 解析自动把结果截成 4464
- D. 解析自动变成 `null`

**答案：B。** `70000` 是合法的 Java `int` 文本，但超过端口规则上限。A 混淆格式与业务范围，C、D 不是 `parseInt` 的行为。

## 参考资料

- [POSIX `open`：失败返回值与 `errno`](https://pubs.opengroup.org/onlinepubs/9799919799/functions/open.html)
- [Java 语言规范：异常处理语句](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20)
- [Rust 标准库：`Result<T,E>`](https://doc.rust-lang.org/std/result/)
- [Zig 官方语言参考：错误联合、`try` 与 `catch`](https://ziglang.org/documentation/master/#Error-Union-Type)
