---
slug: "encoding-encryption-hashing"
title: "编码加密与哈希为什么不能混用"
description: "实际对比 Base64、SHA-256 与 AES-GCM，区分格式转换、保密性、完整性与密码存储。"
subject: "计算机网络"
order: 230
minutes: 20
lab: "workbench"
objectives: ["区分无需秘密的编码与有密钥加密", "解释摘要不能解密与可能碰撞", "识别普通哈希直接存密码的风险"]
prerequisites: ["text-encoding-utf8", "tls-handshake-basic"]
---

# 看见一串看不懂的字符，不代表它保密

## 面试回答

编码（Encoding）改变表示方式，例如 Base64，无需密钥即可还原；加密（Encryption）使用密钥提供保密性，安全使用还需正确算法、随机数和完整性保护；密码学哈希（Cryptographic Hash）把任意长度输入映射成固定长度摘要，不能像密文那样用密钥解密，但有限输出必然存在碰撞，安全目标是相应攻击在计算上不可行。摘要不能独立证明消息来自谁，普通安全哈希算法 SHA-256（Secure Hash Algorithm 256-bit）也不适合直接存密码；应采用带盐的专用慢密码哈希或密钥派生函数（Key Derivation Function，KDF），例如按平台规范配置 Argon2id。AES 是高级加密标准（Advanced Encryption Standard），GCM 是伽罗瓦计数器模式（Galois/Counter Mode）。

## 同一 hello，三种不同目的

| 操作 | 是否需要秘密 | 能否正常还原 | 主要目的 |
| --- | --- | --- | --- |
| UTF-8 + Base64 | 不需要 | 可解码 | 传输二进制表示 |
| SHA-256 | 不需要 | 无“解密”操作 | 计算固定长度摘要 |
| AES-GCM | 需要密钥 | 正确密钥可解密验证 | 认证加密 |

Base64 的 hello 结果是 aGVsbG8=，任何知道编码规则的人都能还原。SHA-256 输出 32 字节，十六进制展示是 64 个字符；长度变化是表示方式，不是算法输出 64 字节。

## 网页实验实际做了什么

编码使用 TextEncoder 得到 UTF-8 字节，再 Base64。摘要使用浏览器 Web Crypto 的 SHA-256。加密使用浏览器生成的一次性 AES-GCM 256 位密钥和 12 字节随机初始化向量（Initialization Vector，IV），实际加密后再用同一密钥解密；显示的加密结果含认证标签。密钥不导出、不保存，输入最多 200 个字符。安全上下文缺失时明确报错，而不返回伪造密文。

同一文本多次摘要应相同；本实验每次新密钥新 IV，密文通常不同。真实产品不能把“随机生成过 IV”当成绝对保证：同一 AES-GCM 密钥下必须避免 nonce 重用，并设计次数限制、密钥管理与异常处理。

## 实验代码

```python
import base64
import hashlib
data = "hello".encode("utf-8")
print(base64.b64encode(data).decode("ascii"))
print(hashlib.sha256(data).hexdigest())
```

第一行预期 aGVsbG8=，第二行是 64 字符摘要。代码没有自己实现密码算法，也没有把 Python 标准库不提供的高层 AES-GCM 硬写出来；加密交给网页实际 Web Crypto 实验。

## 面试追问

为什么加盐仍不应只用 SHA-256 存密码？普通摘要很快，攻击者可大规模离线猜测；盐阻止跨用户共用预计算，却不把快速哈希自动变慢。密码 KDF 还要配置工作因子、内存成本等。校验公开文件摘要可发现与可信摘要不一致；若摘要本身可被攻击者替换，就不证明真实性。需要消息认证码（Message Authentication Code，MAC）或数字签名等可信协议，而不是“再哈希一次”。

## 选择题

哪个说法正确？

A. Base64 是一种无需密码的安全加密

B. SHA-256 摘要可以用私钥解密

C. 编码是表示转换；AES-GCM 提供正确使用前提下的认证加密

D. 加盐的单次 SHA-256 一定是最佳密码存储

**答案：C。** A 混淆可读性与保密性，B 虚构摘要解密，D 忽略密码猜测成本与专用 KDF。实验不代表完整密钥管理系统。

## 参考

- [W3C Web Cryptography API](https://www.w3.org/TR/webcrypto/)
- [OWASP：密码存储](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
