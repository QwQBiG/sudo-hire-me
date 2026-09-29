---
slug: "tcp-close-four-way"
title: "TCP 为什么通常用四段报文关闭"
description: "把双向数据流分别关掉，按 FIN、ACK 的序列位置手算客户端与服务器状态。"
subject: "计算机网络"
order: 114
minutes: 20
lab: "tcp"
objectives: ["按两个发送方向解释 FIN 的含义", "追踪 FIN-WAIT 与 CLOSE-WAIT 等关键状态", "说明为什么抓包不必恰好看到四个独立报文"]
prerequisites: ["tcp-connection", "tcp-reliability"]
---

# TCP 为什么通常用四段报文关闭

## 一个连接包含两个独立发送方向

传输控制协议（Transmission Control Protocol，TCP）连接是全双工（Full-Duplex）的：A→B 和 B→A 两个方向可分别结束。A 发送终止标志（Finish，FIN）表示“**我**没有更多数据要发送”，不表示 B 已发完。B 先确认 A 的 FIN，再等自己的应用完成发送后才发 B 的 FIN；因此典型示意是 `FIN → ACK → FIN → ACK`。这描述逻辑事件，不要求线上永远是四个独立段；B 若已准备结束，可以把对 A 的 ACK 与自己的 FIN 合在同一段。[RFC 9293：Connection Closing](https://www.rfc-editor.org/rfc/rfc9293.html)

## 用序号把两个方向分别算完

假设连接已建立、没有应用数据，客户端下一可用序号 `1001`、服务器下一可用序号 `5001`，客户端先关闭：

| 次序 | 报文 | 客户端状态 | 服务器状态 |
| --- | --- | --- | --- |
| 1 | 客户端 `FIN seq=1001` | FIN-WAIT-1 | 收到后 CLOSE-WAIT |
| 2 | 服务器 `ACK=1002` | 收到后 FIN-WAIT-2 | CLOSE-WAIT |
| 3 | 服务器 `FIN seq=5001` | 收到后 TIME-WAIT | LAST-ACK |
| 4 | 客户端 `ACK=5002` | TIME-WAIT | 收到后 CLOSED |

FIN 占一个序列位置，所以确认客户端 FIN 用 `1002`，确认服务器 FIN 用 `5002`；没有承载数据的纯 ACK 不再消耗新的序号。客户端在 FIN-WAIT-2 时，只结束了自身发送方向；在普通半关闭（Half-Close）场景里仍可继续接收服务器数据。如果服务器先返回两字节 `OK`，它之后的 FIN 序号就要跳过这两字节，不再是 `5001`。[RFC 9293：Closing States](https://www.rfc-editor.org/rfc/rfc9293.html)

## 在现有实验里观察哪两处

选择报文时序实验，先完成三次握手，再按“发送下一报文”推进到客户端 `FIN+ACK` 与服务器纯 `ACK`。此时看**客户端 FIN-WAIT-2、服务器 CLOSE-WAIT**：前者等对方结束，后者等本地应用决定何时结束。再推进到服务器 FIN 和客户端最后 ACK，看服务器进入 CLOSED、客户端暂留 TIME-WAIT。实验刻意没有应用数据且以客户端主动关闭，不代表其他关闭方式不存在。

## 面试回答

TCP 两个发送方向可独立关闭。主动关闭方发 FIN 后等待确认，进入 FIN-WAIT 系列状态；被动方确认后进入 CLOSE-WAIT，仍可发送未完成的数据，等本地也发 FIN，主动方再确认。典型时序是 FIN、ACK、FIN、ACK，两个 FIN 各消耗一个序列位置；ACK 和 FIN 可合并，同时关闭或 RST 异常结束也不遵循这张四段示意图。不能把收到 FIN 解读成“整个连接已经双向关闭”。

## 常见误区

- **“服务器一收到客户端 FIN 就不能再发送。”** 它只是获知客户端发送方向结束。
- **“关闭一定抓到四个包。”** FIN 可与 ACK 合并，还可能重传、同时关闭或复位。
- **“纯 ACK 让本端序号加一。”** 本例纯 ACK 不占序列空间。

## 选择题

客户端发 `FIN seq=1001`，服务器正确接收且没有其他数据；服务器确认该 FIN 应使用哪个 ACK 值？

- A. 1000
- B. 1001
- C. 1002
- D. 5002

**答案：C。** FIN 占用一个序列位置，下一期待序号是 1002；D 是另一方向服务器 FIN 被确认时的示例值。

## 参考资料

- [RFC 9293：Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)
