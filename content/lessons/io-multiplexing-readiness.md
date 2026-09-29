---
slug: "io-multiplexing-readiness"
title: "一个线程怎样等待多个文件描述符"
description: "从就绪列表理解 I/O 多路复用，并亲手比较水平触发和边缘触发的部分读取。"
subject: "操作系统"
order: 100
minutes: 20
lab: "io-readiness"
objectives: ["解释就绪通知并不等于读取完成", "追踪两个 fd 的就绪列表", "区分水平触发与边缘触发的排空要求"]
prerequisites: ["file-descriptor", "blocking-nonblocking-io"]
---

# 一个线程怎样等待多个文件描述符

## 从单个等待到多个等待

假设服务端同时关心 fd 3 和 fd 4。若分别对它们做阻塞式 `read`，线程停在 fd 3 时就不能处理已经有数据的 fd 4。**I/O 多路复用**（I/O Multiplexing）让线程向内核登记感兴趣的描述符与事件，再等待“哪些 fd 已就绪”的通知；Linux 的 `poll`、`epoll` 属于这类机制。就绪是**现在尝试某种 I/O 通常不会阻塞**，不是内核已经替程序把全部数据读好，更不是数据一定组成一条完整业务消息。[Linux manual：poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html)

实验把两个 fd 视为非阻塞描述符：fd 3 收到 4 字节、fd 4 收到 2 字节。只要它们仍有可读数据，水平触发（Level-Triggered，LT）通常会继续报告可读；边缘触发（Edge-Triggered，ET）强调就绪变化，若只读部分数据，不应期待剩余数据自动再产生同样的边缘。[Linux manual：epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)

## 动手看状态

先给 fd 3 送入 `ABCD`，给 fd 4 送入 `XY`。在 LT 下，只从 fd 3 读 2 字节后，它还剩 `CD`，下一轮等待仍可报告 fd 3；再读 fd 4，剩余就绪列表会变化。切到 ET 重置后只读 fd 3 的前 2 字节，可以看到：若没有新的状态变化，不能依赖下一次通知取出 `CD`。实际 ET 用法通常把 fd 设为非阻塞并持续读取，直到返回 `EAGAIN`，同时注意错误、关闭和并发等情形。[Linux manual：epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)

## 面试回答

I/O 多路复用把多个 fd 的就绪事件交给一个等待机制，线程醒来后再对相应 fd 做实际读写。LT 会在条件仍满足时反复报告；ET 侧重状态变化，因此非阻塞 fd 上通常要读到 `EAGAIN`，避免缓冲区留数据却不再收到预期通知。它解决的是“一个等待点关注多个 I/O”，不是让 `read` 自动变成异步完成，也不保证一次读取拿到完整消息。

## 常见误区

- **“收到可读通知就等于收到完整请求。”** TCP 是字节流，业务边界仍由协议解析。
- **“ET 只读一次也总会再次提醒剩余数据。”** 只读部分数据可能导致后续等待错过已有数据。
- **“epoll 一定比 poll 快且永远是 O(1)。”** 实际开销依赖就绪数量、注册操作、内核和使用场景。

## 选择题

ET 模式中，fd 3 有 4 字节可读，应用仅读走 2 字节。最稳妥的处理是什么？

- A. 等下一次相同边缘，保证拿到剩余 2 字节
- B. 在非阻塞模式下继续读，直到 `EAGAIN` 或处理到合适边界
- C. 直接关闭 fd 3
- D. 把 fd 4 改成阻塞模式

**答案：B。** ET 下剩余数据不保证重新触发同一就绪变化；实际代码还应正确处理错误与关闭。

## 参考资料

- [Linux manual：poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html)
- [Linux manual：epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html)
