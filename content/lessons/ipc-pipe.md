---
slug: "ipc-pipe"
title: "进程间通信中的管道是什么"
description: "从两个文件描述符和一段字节流出发，推演读写、关闭写端、EOF 与消息边界。"
subject: "操作系统"
order: 98
minutes: 18
lab: "walkthrough"
objectives: ["区分匿名管道的读端与写端", "解释管道是字节流而非消息队列", "判断读到 EOF 和写入 EPIPE 的条件"]
prerequisites: ["process-thread", "file-descriptor"]
---

# 进程间通信中的管道是什么

## 从两个文件描述符开始

进程间通信（Inter-Process Communication，IPC）让彼此独立的进程交换数据。以 POSIX 风格的匿名管道（Pipe）为例，`pipe(fd)` 创建读端 `fd[0]` 和写端 `fd[1]`；进程可以在 `fork` 后继承两端，再各自关闭不使用的一端。写入的字节进入内核中的有限容量缓冲区，读端按顺序取得字节。可移植的管道语义是单向的；想双向通信可用两条管道或其他机制。[Linux manual：pipe(2)](https://man7.org/linux/man-pages/man2/pipe.2.html) · [Linux manual：pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)

管道不是“共享一块可随机读写的内存”。读端不能 `lseek` 到某个偏移；也不是按 `write` 次数划分消息的队列。读写的单位是**字节流**，应用若要知道一条消息何时结束，需自己约定长度前缀、分隔符等协议。

## 逐步推演

### 父子进程分别保留所需端

父进程要发数据，关闭自己的读端，只保留写端；子进程要收数据，关闭自己的写端，只保留读端。关闭多余的副本不仅节省描述符，还影响内核判断“是否已经没有任何写者”。如果子进程自己仍持有写端，即使父进程关闭写端，子进程也可能一直等不到 EOF。

### 写两次，读者不保证按两次返回

父进程依次写 `ABC`、`DEF`，管道里形成连续字节 `ABCDEF`。子进程请求 `read(fd, buf, 4)`：如果当时至少有数据，返回多少字节由实际可用数据和调用语义决定，**不能把某次 `write` 当作必然的一次 `read`**。假设六字节已全部到达，可能先读 `ABCD`，再读 `EF`；程序应依据每次 `read` 的返回值处理实际字节数。[Linux manual：read(2)](https://man7.org/linux/man-pages/man2/read.2.html)

### 关闭最后一个写端后才到 EOF

父进程关闭写端，且系统中已没有其他写端副本。子进程先读完缓冲区残余的 `EF`，下一次 `read` 才返回 `0`，表示文件结束（End of File，EOF）。反过来，若所有读端都关了，继续 `write` 会触发 `SIGPIPE`；若该信号被忽略或捕获，调用可返回 `-1` 并设置 `EPIPE`。[Linux manual：pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)

## 匿名管道、命名管道与 socket

匿名管道的描述符通常通过父子进程继承或显式传递，因此在面试常见的 `fork` 示例里最自然。没有共同祖先或描述符传递关系的进程，也可用命名管道（FIFO）按路径打开，或用 Unix 域套接字等 IPC。**“进程间通信”是目标，管道只是其中一种机制**；别把它等同于 TCP 网络连接。

## 面试回答

管道是内核提供的单向字节流 IPC，创建后有读端和写端，进程可通过继承描述符收发数据。它不保留每次 `write` 的消息边界，缓冲区也有限；空管道有写者时阻塞读可能等待，没有任何写者且数据已读尽时读返回 `0`，所有读者关闭后写入会遇到 `SIGPIPE/EPIPE`。无关进程可考虑 FIFO 或套接字，不能笼统说匿名管道天然适合任意进程。

## 常见误区

- **“两次 write 对应两次 read。”** 管道是字节流，应用必须自行解析消息。
- **“父进程关写端就一定 EOF。”** 还要看别的进程是否保留了写端副本。
- **“管道满了仍可无限写。”** 有容量上限，写入可能阻塞或报 `EAGAIN`。

## 选择题

子进程持有空管道的读端，父进程已关闭写端，但子进程还保留一份继承来的写端。此时子进程做阻塞读，最可能出现什么？

- A. 因父进程已关闭写端，立即返回 EOF。
- B. 因仍存在打开的写端副本，可继续等待数据而不返回 EOF。
- C. 一定收到 `SIGPIPE`。
- D. 返回此前 `write` 调用的次数。

**答案：B。** EOF 要求所有写端副本都关闭且已无缓冲数据；A 漏掉子进程自己的副本，`SIGPIPE` 则是无读者时的写入情况。

## 参考资料

- [Linux manual：pipe(2)](https://man7.org/linux/man-pages/man2/pipe.2.html)
- [Linux manual：pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)
