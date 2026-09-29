---
slug: "file-descriptor"
title: "文件描述符为什么只是一个整数"
description: "沿 open、dup、read、close 看进程自己的 fd 表，以及共享的文件偏移如何变化。"
subject: "操作系统"
order: 81
minutes: 19
lab: "fd"
objectives: ["解释 fd 与进程描述符表的关系", "推导 dup 后共享文件偏移的行为", "说明 close 后 fd 可重用而副本仍可用"]
prerequisites: ["system-call", "process-thread"]
---

# 文件描述符为什么只是一个整数

## 一个数字为什么能代表打开的文件

在 Unix/Linux 风格接口里，文件描述符（File Descriptor，fd）是进程可用的一个非负整数。成功 `open` 后，进程得到一个 fd；后续 `read(fd, ...)`、`write(fd, ...)` 等操作用它指明要访问哪一个已打开资源。这个整数可以看作**当前进程描述符表的索引**，不是磁盘上文件的永久编号，也不是跨所有进程唯一的号码。[Linux manual：`open(2)`](https://man7.org/linux/man-pages/man2/open.2.html)

描述符表项引用“打开文件描述”（Open File Description）。后者保存当前文件偏移与文件状态标志等；它也不是路径字符串本身。两个独立的 `open` 通常产生两个打开文件描述，即使路径相同；`dup` 则让两个 fd 引用**同一个**打开文件描述，因此共享偏移。[Linux manual：`open(2)`，Open File Descriptions](https://man7.org/linux/man-pages/man2/open.2.html#NOTES)

## 从 fd 3 开始手算

假设本进程的 0、1、2 已被标准输入、标准输出、标准错误占用，`note.txt` 的内容为 `ABCDE`。这是本课模型的明确前提，不能把“每个进程都必有三个已打开的 fd”当作定律。

| 操作 | 本进程 fd 表的变化 | 共享偏移与结果 |
| --- | --- | --- |
| `open("note.txt", O_RDONLY)` | 最低可用编号 3 → 打开文件描述 F1 | F1 偏移 0 |
| `dup(3)` | 最低可用编号 4 → 同一个 F1 | fd 3、4 共用 F1 偏移 |
| `read(3, 2)` | 表项不变 | 读到 `AB`，F1 偏移变 2 |
| `read(4, 2)` | 表项不变 | 读到 `CD`，F1 偏移变 4 |
| `close(3)` | 表项 3 释放 | fd 4 仍引用 F1，可继续读 |

上面假设每次读取都成功得到两字节。真实 `read` 的返回长度可能更短；偏移变化要依据实际读取和文件类型判断，不能把表中的数字套到所有设备。`dup` 共享的是打开文件描述中的文件偏移和状态标志，不代表两个 fd 号码相同；文件描述符自身的标志（例如 close-on-exec）不是这样共享的。[Linux manual：`dup(2)`](https://man7.org/linux/man-pages/man2/dup.2.html)

## close 之后再 open

`close(3)` 使这个进程的编号 3 不再引用 F1；只要 fd 4 还指向 F1，F1 对本例进程就没有因为关闭 3 而消失。随后 `open("other.txt", O_RDONLY)` **可能**再次取得最低空闲编号 3，此时新的 fd 3 指向新打开的 F2，不是“复活”的 F1。Linux `open` 在成功时选当前进程最低未占用 fd；实际资源限制或错误也可能让 `open` 失败。[Linux manual：`open(2)`](https://man7.org/linux/man-pages/man2/open.2.html)；[Linux manual：`close(2)`](https://man7.org/linux/man-pages/man2/close.2.html)

另一个进程也有自己的 fd 表，它的数字 3 可以指向完全不同的打开资源。进程之间也**可能**通过继承或传递共享打开文件描述，所以“表不同”不等于“底层对象绝不共享”；本课实验只展示单进程，避免一次把继承规则混进来。

## 在实验里操作表项

按 `open → dup → read(3,2) → read(4,2) → close(3)` 操作，观察表项 3 和 4 如何指向同一 F1，以及一次读取为什么改变另一个 fd 的下一次读取位置。尝试重复关闭或在空 fd 上读取，实验会给出错误提示；这只是**教学模型**，不调用设备或真实内核。重置后可按不同顺序尝试，看看关闭哪个编号会影响后续动作。

## 面试回答

fd 是进程描述符表里的整数索引，成功 `open` 会建立一个描述符，使其引用打开文件描述；后者保存文件偏移和状态标志。`dup` 产生新 fd，但引用同一个打开文件描述，所以两个 fd 的读取共享偏移；`close` 只解除该 fd 的引用，其他副本仍可用。编号只在所属进程和当前时刻有意义，关闭后可被重新使用，不能把 fd 当成全局文件 ID。

## 常见误区

- **“fd 3 永远代表同一个文件。”** 关闭后编号可复用；不同进程的 3 也没有必然关系。
- **“dup 复制了文件内容。”** 它复制引用，两个 fd 可以共享同一个打开文件描述和偏移。
- **“close(3) 一定让 dup 出来的 4 失效。”** 4 仍持有自己的描述符表项。
- **“同一个路径 open 两次一定共享偏移。”** 两次独立 open 通常是两个打开文件描述，和 dup 不同。

## 选择题

本课模型中，`open` 返回 3、`dup(3)` 返回 4。接着 `read(3,2)` 从 `ABCDE` 读到 `AB`，再 `read(4,2)` 最可能读到什么？

- A. `AB`，因为 fd 4 的偏移独立从 0 开始。
- B. `CD`，因为 fd 3、4 共享打开文件描述的偏移。
- C. `EF`，因为 dup 把偏移加倍。
- D. 一定报错，因为 dup 只复制号码不复制引用。

**答案：B。** `dup` 后两项指向同一 F1；第一次读取把 F1 偏移推到 2，第二次从那里读到 `CD`。A 把 dup 误当第二次独立 open；C 没有相应规则；D 错在 fd 4 的引用有效。

## 参考资料

- [Linux manual：open(2)](https://man7.org/linux/man-pages/man2/open.2.html)
- [Linux manual：dup(2)](https://man7.org/linux/man-pages/man2/dup.2.html)
- [Linux manual：close(2)](https://man7.org/linux/man-pages/man2/close.2.html)
