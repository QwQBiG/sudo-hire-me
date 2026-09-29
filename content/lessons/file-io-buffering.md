---
slug: "file-io-buffering"
title: "写文件后为什么还可能没落盘"
description: "沿 C 标准库缓冲区、内核页缓存到持久介质追踪 ABC，区分 fflush、write 与 fsync。"
subject: "操作系统"
order: 97
minutes: 21
lab: "io-buffer"
objectives: ["区分用户态 stdio 缓冲和内核页缓存", "判断 fflush 与 fsync 分别推进到哪一层", "说明成功写入与崩溃后持久化不是同一承诺"]
prerequisites: ["system-call", "file-descriptor", "file-system-inode"]
---

# 写文件后为什么还可能没落盘

## 三处位置，不是一个“缓存”

以 Linux 上 C 标准 I/O 库（Standard Input/Output，stdio）的普通文件为例，`fprintf(stream, "ABC")` 写的数据可能先留在**用户态 stdio 缓冲区**；`fflush(stream)` 要求把它通过底层写操作交给内核。内核对普通文件的缓冲写入又可能进入**页缓存**（Page Cache），由系统稍后回写。`fsync(fd)` 则请求把相应文件的已修改内核数据与所需元数据同步到持久存储。三者不是同一层，`fflush` 与 `fsync` 不能互换。[Linux manual：fflush(3)](https://man7.org/linux/man-pages/man3/fflush.3.html) · [Linux manual：fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html)

本课实验只建模一个普通文件、一次短写入 `ABC`，并假设调用都成功、没有并发写者。实际库的缓冲策略可因流类型、配置和实现而变化；直接调用 `write(2)` 不经过这个 stdio 缓冲区，但也不能凭 `write` 返回成功推断已持久化。

## 一条可追踪的写入路径

| 时刻 | 用户态 stdio 缓冲 | 内核待回写数据 | 模型中的持久介质 |
| --- | --- | --- | --- |
| `fprintf("ABC")` 后 | `ABC` | 空 | 空 |
| `fflush(stream)` 后 | 空 | `ABC` | 仍可能为空 |
| `fsync(fileno(stream))` 成功后 | 空 | 已同步 | `ABC` |

如果只执行 `fsync`，却没有先把仍留在 stdio 缓冲里的 `ABC` 交给内核，`fsync` 并不知道这三个用户态字节。若系统在 `fflush` 后、`fsync` 前崩溃并重启，**不能保证** `ABC` 一定还在；也不能断言它一定丢失，内核可能已经自行回写。实验用“可保证的持久层”展示最小承诺，而不是模拟磁盘物理时序。[Linux manual：fflush Notes](https://man7.org/linux/man-pages/man3/fflush.3.html)

## 还有目录项与错误路径

对已有文件内容同步时，`fsync` 是重要步骤；但**新建文件的名字**属于父目录元数据，对文件 fd 做 `fsync` 不必然保证目录项也已持久化。需要崩溃一致性时还要按目标文件系统的规则同步目录，并检查 `fflush`、`fsync` 的返回值和错误。`fclose` 通常会刷新 stdio 输出，但不等于显式的持久化保证。[Linux manual：fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html)

## 面试回答

普通缓冲写文件可能经过用户态 stdio 缓冲、内核页缓存和持久介质。`fflush` 把 stdio 已缓冲输出交给底层写操作，不保证磁盘持久；`fsync` 同步内核中该文件的修改，但无法同步还没 `fflush` 的用户态字节。`write` 成功通常只表示数据已被系统接受，不能概括为“已落盘”。若是新建文件，还要考虑父目录项持久化与错误检查；具体保证受 OS、文件系统和设备约束。

## 常见误区

- **“调用 fflush 就已落盘。”** 它只处理 stdio 用户态缓冲。
- **“先 fsync 再 fflush 效果一样。”** fsync 看不到还在应用缓冲中的字节。
- **“系统崩溃前没 fsync，数据必丢。”** 缺少保证不等于必然丢失。

## 选择题

`ABC` 仍只在 `FILE*` 的用户态缓冲区中，此时直接对对应 fd 调用 `fsync`。最准确的是？

- A. `fsync` 必把用户态的 `ABC` 先写进内核，再落盘。
- B. `fsync` 不会自动读取该 stdio 缓冲；应先成功 `fflush` 再同步文件。
- C. `ABC` 已经在磁盘上，因为 `fprintf` 成功。
- D. 无论是新文件还是旧文件，`fsync(fd)` 都自动保证父目录项持久。

**答案：B。** `fsync` 针对文件 fd 所见的内核修改；用户态尚未提交的 `ABC` 不在其范围内。D 还混淆文件与目录项。

## 参考资料

- [Linux manual：fflush(3)](https://man7.org/linux/man-pages/man3/fflush.3.html)
- [Linux manual：fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html)
- [Linux manual：write(2)](https://man7.org/linux/man-pages/man2/write.2.html)
