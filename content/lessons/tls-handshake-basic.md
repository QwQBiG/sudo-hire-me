---
slug: "tls-handshake-basic"
title: "TLS 1.3 握手到底建立了什么"
description: "沿 ClientHello、ServerHello、证书验证和 Finished 追踪密钥协商、服务器身份与应用数据保护。"
subject: "计算机网络"
order: 126
minutes: 22
lab: "workbench"
objectives: ["区分密钥协商与证书身份验证", "追踪 TLS 1.3 完整握手的关键消息", "说明 HTTPS 中 TCP 建连与 TLS 握手不是同一件事"]
prerequisites: ["http-https", "tcp-connection"]
---

# TLS 1.3 握手到底建立了什么

## 先把“安全连接”拆成三个问题

传输层安全协议（Transport Layer Security，TLS）要让双方协商后续数据保护所需的密钥与算法，验证对端身份，并检查握手没有被篡改。本课固定为 **TLS 1.3、普通证书认证服务器、无会话恢复与 0-RTT** 的路径。HTTPS 使用 TLS 保护 HTTP，若基于 TCP，通常先完成 TCP 建连，再做 TLS 握手；TLS 不是 TCP 三次握手的另一个名字。[RFC 8446：TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)

## 逐步推演

### 客户端提出方案，服务器选择方案

访问 `api.example.com` 时，客户端发 `ClientHello`，带支持版本、密码套件相关信息及临时密钥共享（key share）；服务器以 `ServerHello` 选择参数并给出自己的密钥共享。双方由交换所得材料导出握手保护密钥，后续握手消息受加密保护。这里的**临时密钥交换**不是“把最终对称密钥直接用证书公钥加密后发过去”；这是把 TLS 1.2 某些旧讲法机械搬到 TLS 1.3 的错误。[RFC 8446：Handshake Overview](https://www.rfc-editor.org/rfc/rfc8446.html)

### 服务器证明“它是谁”

服务器发送加密的 `EncryptedExtensions`、`Certificate`、`CertificateVerify` 和 `Finished`。客户端应验证证书链、证书与目标服务名是否匹配，并验证 `CertificateVerify` 对握手内容的签名。若证书宣称的是 `other.example.com`，却没有覆盖请求的 `api.example.com`，不能仅因为能协商密钥就把它当作正确网站。证书告诉你公钥与身份的关联，`CertificateVerify` 证明对端控制相应私钥。[RFC 8446：Authentication Messages](https://www.rfc-editor.org/rfc/rfc8446.html) · [RFC 9525：Service Identity](https://www.rfc-editor.org/rfc/rfc9525.html)

### 双方确认握手，应用才交换受保护数据

`Finished` 校验整个握手记录与协商密钥，客户端验证服务器消息后发送自己的 `Finished`；此后双方使用导出的应用流量密钥保护 HTTP 请求与响应。服务器通常不要求客户端证书，若站点启用双向证书认证才会多出客户端证书相关消息。本例不讨论 TLS 1.3 提前数据或恢复连接，不能把所有实际握手都说成恰好同一串消息。[RFC 8446：Finished](https://www.rfc-editor.org/rfc/rfc8446.html)

## 加密不替代身份验证

只有密钥协商而不验证服务器身份，攻击者可以与客户端各自建立加密连接并居中转发。相反，证书验证通过也不说明服务器应用代码绝对安全；TLS 保护的是传输身份、完整性和机密性，不是网站业务正确性的证明。

## 面试回答

以 TLS 1.3 普通证书握手为例，ClientHello/ServerHello 协商参数并通过临时密钥共享导出密钥；服务器随后用证书和 `CertificateVerify` 证明身份，双方用 `Finished` 确认握手完整性，再以应用流量密钥保护 HTTP。客户端必须检查证书链与预期服务名，单有加密不等于知道对方是谁。会话恢复、0-RTT、客户端证书属于其他可选路径；不要把 TLS 1.3 说成“服务器用证书公钥把会话密钥加密给客户端”。

## 常见误区

- **“TLS 握手就是 TCP 三次握手。”** TCP 建传输状态，TLS 建安全上下文。
- **“服务器只要给出任何有效证书就可信。”** 还要与目标服务名匹配。
- **“TLS 1.3 必须双方都发证书。”** 常见网站只认证服务器。

## 选择题

客户端已经与某服务器协商出可用的加密密钥，但未核对证书服务名。最核心的缺失是什么？

- A. 没有证明自己连接的就是预期域名对应的服务。
- B. 无法把 HTTP 文本转成字节。
- C. TCP 必须重新三次握手。
- D. FIN 无法占用序列号。

**答案：A。** 密钥协商解决保密通信的材料，不会单独保证对端身份；B、C、D 与证书身份核验无关。

## 参考资料

- [RFC 8446：The Transport Layer Security (TLS) Protocol Version 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)
- [RFC 9525：Service Identity in TLS](https://www.rfc-editor.org/rfc/rfc9525.html)
