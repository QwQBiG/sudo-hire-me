---
slug: "mac-ip-port"
title: "MAC、IP 和端口分别标识什么"
description: "跟着一条跨路由的 TCP 请求，分清本跳链路接收者、网络目的地址和主机中的服务端口。"
subject: "计算机网络"
order: 108
minutes: 17
lab: "encapsulation"
objectives: ["从一次发包识别 MAC、IP、端口的不同作用", "说明跨路由时下一跳链路地址会变化", "指出 IP 地址和端口不能单独唯一表示一条 TCP 连接"]
prerequisites: ["network-layers", "tcp-udp", "arp-local-delivery"]
---

# MAC、IP 和端口分别标识什么

## 同一请求要回答三个不同问题

本机 `192.0.2.10:50000` 向服务器 `198.51.100.20:8080` 建立传输控制协议（Transmission Control Protocol，TCP）连接。为方便观察，假设两端之间有路由器，当前链路使用以太网（Ethernet），并且没有网络地址转换（Network Address Translation，NAT）。

- **介质访问控制地址**（Media Access Control Address，MAC 地址）在此以太网链路上说明“这**一跳**把帧交给哪个接口”。本机发出的第一帧目的 MAC 是默认网关相应接口的 MAC，不是远端服务器的 MAC。
- **互联网协议地址**（Internet Protocol Address，IP 地址）在此说明包的网络层源和最终目的。正常转发中路由器根据目的 IP 选下一跳，目的 IP 仍为 `198.51.100.20`；真实转发还会修改如 IPv4 TTL 等字段。NAT 会修改地址，本例暂不采用 NAT。[RFC 791：Internet Protocol](https://www.rfc-editor.org/rfc/rfc791.html)
- **端口号**（Port Number）属于 TCP/UDP 等传输协议，用来区分同一主机上通信的服务或端点。本例目的端口 `8080` 是服务器进程要接收的端口，源端口 `50000` 区分客户端这个连接。路由器转发时通常不因换一跳就改 TCP 端口；NAT 情形可能改。[RFC 9293：TCP](https://www.rfc-editor.org/rfc/rfc9293.html)

现有封装实验显示两跳的 MAC 标签如何变化，以及同一请求中的 IP 与端口在**无 NAT**前提下如何保留。读实验时先看帧再看包，不要把三种地址都理解成“服务器地址”。

## 一条连接并非只靠服务器端口识别

两个客户端都可以访问 `198.51.100.20:8080`；只给出目的端口 `8080` 无法区分两条连接。常见 TCP 连接标识要一起看协议、源 IP、源端口、目的 IP、目的端口。相反，同一台主机有多个网络接口时也可能有多个 IP；IP 不等同于永久固定的“整台机器身份证”。

MAC 不等于“全网路由地址”：IP 可以跨多个网络被路由，某一跳的以太网目的 MAC 只作用于相应链路。也不是所有网络层通信都必须依赖以太网 MAC，例如不同链路技术会采用自己的交付方式；ICMP 等协议也不使用 TCP/UDP 端口。

## 面试回答

在典型以太网加 TCP/IP 通信里，MAC 解决本跳帧交给哪个链路接口，IP 用于跨网络定位和转发到目的地址，端口用于 TCP/UDP 在主机内区分通信端点。跨路由器时每跳封装的 MAC 会变化；在无 NAT 的普通转发里，目的 IP 与 TCP 目的端口仍指向最终服务。描述 TCP 连接通常需要源/目的 IP、源/目的端口及协议，不能只说一个端口就是一条连接。

## 常见误区

- **“跨网段第一帧目的 MAC 是远端服务器。”** 第一跳要送到网关接口。
- **“路由器每转一跳必改目的 IP。”** 普通 IP 转发通常不改；NAT 是额外地址转换情形。
- **“所有 IP 包都有端口。”** TCP/UDP 有端口，ICMP 不按这种端口机制工作。

## 选择题

本机通过默认网关访问跨网段的 TCP 服务，且不经过 NAT。第一帧和 IP 包的目标分别是谁？

- A. 目的 MAC 是服务器，目的 IP 是网关。
- B. 目的 MAC 是网关接口，目的 IP 是服务器。
- C. 目的 MAC 和目的 IP 都是网关。
- D. 目的 MAC 和目的 IP 都是服务器。

**答案：B。** 一跳的帧送往网关，IP 包仍以最终服务器为目的；A、C、D 混淆本跳交付与跨网路由。

## 参考资料

- [RFC 826：Address Resolution Protocol](https://www.rfc-editor.org/rfc/rfc826.html)
- [RFC 791：Internet Protocol](https://www.rfc-editor.org/rfc/rfc791.html)
- [RFC 9293：Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)
