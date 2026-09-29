---
slug: "tcp-byte-stream-framing"
title: "TCP 字节流如何还原一条完整消息"
description: "用两字节长度前缀，跨三次读取组出两条消息，并处理不完整与过长消息。"
subject: "计算机网络"
order: 116
minutes: 19
lab: "tcp-framing"
objectives: ["说明 TCP 不保留应用写入边界", "按长度前缀跨 read 维护解析状态", "处理截断与长度上限"]
prerequisites: ["tcp-udp", "blocking-nonblocking-io"]
---

# TCP 字节流如何还原一条完整消息

## 问题不在“粘包”这个名字

TCP 提供可靠、有序的**字节流**（Byte Stream），不承诺一次 `send` 对应一次 `recv`。发送端写入两条消息，接收端可能一次读到一条的一半，也可能一次读到两条；边界要由**应用层分帧**（Message Framing）规则定义。[RFC 9293：Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)

本课选简单的长度前缀协议：先用 2 字节无符号大端整数写正文长度，后跟该长度的 UTF-8 字节。示例 `00 03 43 41 54 00 02 4F 4B` 表示 `CAT` 和 `OK`；这是教学协议，不是 TCP 自带的头部。解析器设置正文上限 8 字节，避免任意声明长度导致过量缓存。

## 动手组帧

实验将字节分成三次到达：`00`、`03 43`、`41 54 00 02 4F 4B`。第一块连长度都不完整；第二块告诉我们正文需 3 字节，但只拿到 `C`；第三块先补出 `CAT`，又足够取出 `OK`。每次都先把新字节追加到缓冲区，再循环解析**所有完整帧**，把不足以构成下一帧的尾部留待下次。[POSIX：recv](https://pubs.opengroup.org/onlinepubs/9699919799/functions/recv.html)

如果连接结束时还有不完整的头或正文，协议层应报告截断，而非把残片当完整消息；声明长度超过约定上限时则应拒绝。在多字节字符消息中，长度数的是编码后的**字节**，不一定是字符数。

## 面试回答

TCP 只保证按序交付字节，`send` 和 `recv` 的次数及切分不构成消息边界。应用通常用定长、分隔符或长度前缀等方式分帧。长度前缀解析器要保存未消费缓冲区，凑够头后再等待指定长度的正文，一次 `recv` 可能解析零条、一条或多条。还应限制帧长，并在 EOF 时处理未完成帧。

## 常见误区

- **“一次 `recv` 最多收到一条。”** 一次读取也可能同时包含多条及下一条的一部分。
- **“再调用一次 `recv` 就一定补齐。”** TCP 不保证下次读取字节数；必须循环维护状态。
- **“长度 3 等于三个汉字。”** UTF-8 中汉字通常占多个字节。

## 选择题

长度头为 `00 03`，当前正文只收到 `43 41`。解析器应怎样做？

- A. 输出 `CA`
- B. 等待至少再收到 1 个正文的字节
- C. 将下一帧长度判为 3
- D. 丢弃整个 TCP 连接

**答案：B。** 正文约定为 3 字节，当前只有 2 字节，不满足完整帧条件。

## 参考资料

- [RFC 9293：Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)
- [POSIX：recv](https://pubs.opengroup.org/onlinepubs/9699919799/functions/recv.html)
