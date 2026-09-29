---
slug: "tcp-time-wait"
title: "TIME_WAIT 在等什么"
description: "假设最后一个 ACK 丢失，推演重传 FIN、再次确认和旧连接报文的隔离。"
subject: "计算机网络"
order: 115
minutes: 18
lab: "tcp"
objectives: ["说明通常由主动关闭方进入 TIME-WAIT", "追踪最后 ACK 丢失后的 FIN 重传", "解释 2 MSL 是协议时间尺度而非固定秒数"]
prerequisites: ["tcp-close-four-way"]
---

# TIME_WAIT 在等什么

## 最后一个 ACK 可能丢在路上

继续看客户端主动关闭、服务器随后关闭的典型路径。客户端收到服务器 FIN 后发送最后 ACK，并进入 TIME-WAIT；服务器在 LAST-ACK 中等待确认。如果这个 ACK 丢了，服务器并不知道客户端曾发送确认，会按重传机制重新发送 FIN。客户端若马上丢弃连接状态，就可能无法按原连接语义再次确认；保留 TIME-WAIT 可以接收这个重传 FIN、回 ACK。RFC 9293 规定在 TIME-WAIT 收到重传 FIN 时重新确认并重启等待计时。[RFC 9293：TIME-WAIT State](https://www.rfc-editor.org/rfc/rfc9293.html)

## 用一条丢包时间线看状态

| 时刻 | 客户端（先关闭） | 服务器（后关闭） |
| --- | --- | --- |
| t0 | 收到服务器 FIN，发 ACK；进入 TIME-WAIT | 已发 FIN，处于 LAST-ACK |
| t1 | 最终 ACK 在网络里丢失 | 仍未收到 FIN 的确认 |
| t2 | 仍保存连接状态 | 计时后重传 FIN |
| t3 | 收到重传 FIN，再发 ACK，并按规则重启等待 | 收到 ACK 后进入 CLOSED |

TIME-WAIT 还帮助隔离旧连接残留报文，降低同一连接四元组过快复用时旧报文混入新连接的风险。经典等待量为 `2 × MSL`，其中最大报文段生存时间（Maximum Segment Lifetime，MSL）是协议模型中的报文寿命界；不能把 `2 MSL` 翻译成所有系统都固定的某个秒数。现代实现还可能依时间戳等安全条件优化复用，回答时区分 RFC 规则和具体系统策略。[RFC 9293：TIME-WAIT and Reopening](https://www.rfc-editor.org/rfc/rfc9293.html)

## 在实验里亲手丢最后 ACK

先推进现有 TCP 报文实验的三次握手和两边的 FIN，直到即将发送客户端最后 ACK；勾选“丢弃下一份目标报文”后发送。观察客户端仍处于 TIME-WAIT、服务器仍在 LAST-ACK。再继续，让实验模拟服务器重传 FIN、客户端再次 ACK。实验没有真实时钟或实际网络延迟，只展示状态因果。勾选“丢弃下一个 FIN”会得到另一条恢复路径，不应与“最后 ACK 丢失”混淆。

## 角色不是“客户端永远等待”

普通单方主动关闭时通常是先发 FIN 的一方走到 TIME-WAIT；如果服务器先主动关闭，服务器也可能处于此状态。双方同时关闭时，两侧都可能经过 TIME-WAIT。它也不等于 HTTP 连接一定存在、一定不能再建立新的 TCP 连接；讨论的是**这一个连接标识与状态的处理**，而不是禁止整个主机通信。[RFC 9293：Simultaneous Close](https://www.rfc-editor.org/rfc/rfc9293.html)

## 面试回答

TIME-WAIT 是 TCP 典型主动关闭方在确认对端 FIN 后保留的一段连接状态。它让最后 ACK 丢失时仍能响应对端重传 FIN，并减少旧连接残留报文影响相同连接标识的新实例。RFC 的经典等待是 `2 × MSL`，不是所有平台固定多少秒；主动关闭方并不必然是客户端，同时关闭也可能两侧都等待。它是正常协议状态，不能看到就断定“连接泄漏”。

## 常见误区

- **“服务器一定没有 TIME-WAIT。”** 谁先主动关闭，谁更可能走到这个状态。
- **“最后 ACK 发出就可立即忘记连接。”** ACK 可能丢失，对端还会重传 FIN。
- **“TIME-WAIT 等于程序还在传业务数据。”** 它主要维护关闭后的协议安全边界。

## 选择题

客户端主动关闭，在 TIME-WAIT 收到服务器重传的 FIN，最符合 TCP 规范的处理是？

- A. 忽略它，因为此前已发送过 ACK。
- B. 再次确认这个 FIN，并按规则重启 TIME-WAIT 计时。
- C. 把它当作新连接 SYN。
- D. 让服务器立即进入 CLOSED，无须收到 ACK。

**答案：B。** 重传 FIN 说明对端未必收到最终确认；A、D 忽略了 ACK 丢失的可能，C 混淆 FIN 与 SYN。

## 参考资料

- [RFC 9293：Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)
