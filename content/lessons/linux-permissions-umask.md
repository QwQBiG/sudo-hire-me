---
slug: "linux-permissions-umask"
title: "Linux rwx 权限和 umask 怎样计算"
description: "以普通文件与目录的创建模式计算权限位，区分按位去除、目录搜索权限和删除目录项。"
subject: "操作系统"
order: 227
minutes: 18
lab: "workbench"
objectives: ["换算三组 rwx 与八进制", "按位计算请求模式和掩码", "解释目录 x 与文件 x 的区别"]
prerequisites: ["file-system-inode", "bitwise-operations"]
---

# umask 是掩掉权限，不是做减法

## 面试回答

传统 Linux 权限把用户分为所有者、所属组和其他人，每组有读写执行 rwx 三位，分别对应八进制 4、2、1。没有默认访问控制列表（Access Control List，ACL）等额外规则时，新对象权限由请求模式与文件创建掩码（File Mode Creation Mask，umask）计算：`mode = requested & ~umask`。例如文件请求 0666，umask=0022，得到 0644；目录请求 0777 则得到 0755。umask 不增加权限，不改变已经存在文件，目录的执行位表示搜索/穿越，不等同执行目录里的所有文件。

## 用位图算一次

0666 是 `rw- rw- rw-`，0022 去掉组和其他人的写位，结果 `rw- r-- r--`，即 0644。若请求 0600、掩码 0077，结果仍是 0600；八进制减法 `0600-0077` 得到无关数值，因此不能用“请求减掩码”口诀。

| 请求 | umask | 结果 | 含义 |
| --- | --- | --- | --- |
| 0666 | 0022 | 0644 | 所有者读写，其他只读 |
| 0666 | 0077 | 0600 | 只有所有者读写 |
| 0777 | 0027 | 0750 | 所有者全部、组读搜索、其他无权限 |

创建普通文件通常不请求执行位，所以 0000 掩码也不会把 0666 变成 0777。后续 chmod 是另一种主动修改权限的操作。

## 实验代码

```python
def creation_mode(requested, mask):
    if not 0 <= requested <= 0o777 or not 0 <= mask <= 0o777:
        raise ValueError("only nine permission bits")
    return requested & ~mask & 0o777
print(oct(creation_mode(0o666, 0o022)))
print(oct(creation_mode(0o600, 0o077)))
```

预期 `0o644`、`0o600`。代码只计算位，不修改系统 umask 或创建文件，网页展示相同九位模型。默认 ACL、setgid 继承、文件系统挂载策略等需要另看具体环境。

## 多语言示例

这些函数只计算位，输入须是 0000..0777 的整数，不修改操作系统。`(0666,0022)` 应返回 0644，`(0600,0077)` 返回 0600；真实 ACL 和进程身份判断不在这些片段中。

### C

```c
unsigned creation_mode(unsigned requested, unsigned mask) {
    return requested & ~mask & 0777u;
}
```

C 的前导 0 表示八进制；无符号类型避免把负输入当有效模式。

### C++

```cpp
unsigned creation_mode(unsigned requested, unsigned mask) { return requested & ~mask & 0777u; }
```

同一按位语义，调用者仍应检查输入范围。

### Python 3

```python
def mode(requested, mask):
    return requested & ~mask & 0o777
```

末尾掩码保留九位；本片段假定范围已经验证。

### Rust

```rust
fn mode(requested: u32, mask: u32) -> u32 { requested & !mask & 0o777 }
```

Rust 整数的按位取反使用 !，不是 ~。

### Zig

```zig
fn mode(requested: u9, mask: u9) u9 { return requested & ~mask; }
```

Zig 0.15.2 的 u9 在类型层面限定九位，调用处用 0o 八进制字面量。

### Java

```java
class Modes { static int mode(int requested, int mask) { return requested & ~mask & 0777; } }
```

Java 八进制使用前导 0；结果被限制为九位非负值。

### Kotlin

```kotlin
fun mode(requested: Int, mask: Int): Int = requested and mask.inv() and 511
```

Kotlin 无八进制字面量，此处十进制 511 等于八进制 0777；函数 and 是整数位运算，不能和 Boolean 的 && 混淆。

## 面试追问

文件不可写就不能删除吗？删除的是父目录中的目录项，主要取决于父目录的写与搜索权限及粘滞位（Sticky Bit）等规则，不是只看文件自己的写位。目录 r 允许列举名称，x 允许按名称查找/穿越，二者不能混淆。权限判断还要匹配进程身份、组、ACL 和能力等，网页不模拟完整内核访问控制。

## 选择题

请求 0600、umask 0077，在九位传统权限模型下最终是？

A. 0521

B. 0677

C. 0600

D. 0000

**答案：C。** 请求里已经没有组/其他位，掩码不能再去掉不存在的权限。A 是错误减法，B 错在增加权限，D 误把掩码理解成全部拒绝。

## 参考

- [Linux umask(2)](https://man7.org/linux/man-pages/man2/umask.2.html)
