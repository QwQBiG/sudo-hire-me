---
slug: "blocking-nonblocking-io"
title: "阻塞、非阻塞、就绪通知与异步 I/O"
description: "拿空管道读操作比较等待方式、EAGAIN、就绪通知和异步完成，避免把四种说法混成一种。"
subject: "操作系统"
order: 99
minutes: 21
lab: "io-mode"
objectives: ["判断空管道在有写者与无写者时的返回结果", "区分非阻塞重试、就绪通知和异步完成", "解释就绪不保证本次读取成功"]
prerequisites: ["system-call", "file-descriptor", "ipc-pipe"]
---

# 阻塞、非阻塞、就绪通知与异步 I/O

## 同一个空管道，问题是“调用何时返回”

设读端面对空管道，但写端仍打开，未来可能送来数据。默认**阻塞 I/O**（Blocking Input/Output）下，`read` 可等待到有数据、EOF、信号或错误；调用方在等待期间不能继续执行这条调用之后的代码。设置 `O_NONBLOCK` 后，空且有写者时 `read` 立即失败并给出 `EAGAIN`（某些接口也称 `EWOULDBLOCK`），并不代表连接永久失败。[Linux manual：pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)

若最后一个写端也关闭、缓冲区已空，`read` 返回 `0`（EOF）；它不是因为“非阻塞”而返回 `EAGAIN`。这一区别在处理流结束时尤其重要。

## 四种等待路径

| 路径 | 空管道、有写者时 | 数据到达后还需要做什么 |
| --- | --- | --- |
| 阻塞 `read` | 这次调用等待 | `read` 返回实际读到的字节数 |
| 非阻塞 `read` | 立即返回 `-1/EAGAIN` | 稍后重试 `read` |
| `poll`/`epoll` 等就绪通知 | 先等待“可能可读”的事件 | 仍要调用 `read` 取数据，通常配合非阻塞 fd |
| 异步 I/O 提交 | 提交请求后不在此调用等数据 | 稍后观察完成事件/结果 |

就绪通知（Readiness Notification）报告的是**可以尝试 I/O**，不是数据已经进入应用缓冲区。多个线程竞争、事件与实际读取之间的状态变化，或者读取请求量大于可用数据，都可能让一次 `read` 读不到预期字节；使用非阻塞 fd 可避免误把就绪事件当成未来一直有数据的保证。[Linux manual：epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)

异步 I/O（Asynchronous I/O）的接口语义则是先提交 I/O 请求，操作在之后完成，再取完成状态和结果；“提交立即返回”不同于非阻塞 `read` 立即返回 `EAGAIN`，也不同于 `epoll` 只报就绪。具体实现可能使用内核功能或辅助线程，不能仅从 API 名称推断底层一定零线程。[Linux manual：aio(7)](https://man7.org/linux/man-pages/man7/aio.7.html)

## 实验时看三个时刻

实验固定一条空管道，可以选择读方式，再让写者写入 `OK` 或关闭写端。先问“读调用现在返回什么”，再问“数据到来后谁通知、谁执行读取”，最后问“这次结果是字节、等待、EAGAIN 还是 EOF”。这里的异步模式只演示**提交与完成的语义差别**，不是在浏览器里真正调用操作系统异步 I/O API。

## 面试回答

阻塞与非阻塞描述一次 I/O 调用在条件不满足时是否等待：阻塞读可挂起，非阻塞读立即返回 `EAGAIN`。`poll/epoll` 等就绪通知帮助等待“现在可以尝试读”，通知后仍须执行读取；异步 I/O 则提交操作并稍后取得完成结果。空管道有写者和没有写者的返回不同，后者数据耗尽时是 EOF。判断时要说明具体操作系统与 API 语义，不能把“非阻塞”等同“异步”。

## 常见误区

- **“`EAGAIN` 是永久错误。”** 这里只表示目前没有可取数据，可以等待事件再重试。
- **“epoll 已经帮程序读完数据。”** 它报告就绪，真正读还需调用 `read`。
- **“空管道一定 EAGAIN。”** 若所有写端已关且缓冲区空，则读返回 `0`。

## 选择题

Linux 管道当前无数据、还有写端打开；读端设为 `O_NONBLOCK`，此时调用 `read`，最符合预期的是？

- A. 一直阻塞直到数据到达。
- B. 立即返回 `-1`，错误为 `EAGAIN`。
- C. 立即返回 `0`，表示 EOF。
- D. 自动订阅 `epoll` 并等待完成。

**答案：B。** 有潜在写者但当前无数据，非阻塞读不能取得字节；C 只有没有写者且数据已读尽时才对应 EOF，D 不是 `read` 自带的订阅行为。

## 参考资料

- [Linux manual：pipe(7)](https://man7.org/linux/man-pages/man7/pipe.7.html)
- [Linux manual：epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)
- [Linux manual：aio(7)](https://man7.org/linux/man-pages/man7/aio.7.html)
