---
slug: "authentication-authorization"
title: "认证和授权为什么必须分两次判断"
description: "从登录身份到资源归属与角色规则，解释越权、401 和 403 以及前端隐藏按钮为何不够。"
subject: "计算机网络"
order: 229
minutes: 18
lab: "workbench"
objectives: ["区分证明身份与授予权限", "按资源维度判断越权", "解释 HTTP 状态码的适用条件"]
prerequisites: ["cookie-session-token", "http-status-codes"]
---

# 已经登录，不等于可以操作别人的数据

## 面试回答

认证（Authentication）确认请求者身份，例如验证会话或令牌；授权（Authorization）判断该身份是否允许对目标资源执行某操作。登录成功不能代替每次资源访问的授权。服务端要检查角色、资源归属与具体操作，不能依赖前端隐藏按钮或客户端提交的 user_id。HTTP 401 表示缺少有效认证凭据并要求适当的 WWW-Authenticate 挑战；403 表示服务器理解请求但拒绝执行，不必一律解释成“已经登录”。为避免泄露资源存在性，某些系统也会返回 404。

## 对“删除文章”写出规则

示例策略：读者不能删除；编辑能删除自己的文章；管理员能删除全部文章。先验证会话，再加载目标资源的归属，再判断权限，最后执行删除。会话里的用户身份来自可信认证结果，不能直接相信请求正文中的 ownerId。

| 身份有效 | 角色 | 文章归属 | 示例结果 |
| --- | --- | --- | --- |
| 否 | 任意 | 任意 | 401 |
| 是 | reader | 自己 | 403 |
| 是 | editor | 自己 | 允许 |
| 是 | editor | 别人 | 403 |
| 是 | admin | 别人 | 允许 |

把 URL 的 `/articles/10` 改成 `/articles/11` 就读到别人私有内容，是对象级授权缺失问题。ID 不容易猜只能降低发现概率，不能代替授权检查。

## 实验代码

```python
def can_delete(identity, article):
    if identity is None:
        return False
    return identity["role"] == "admin" or (
        identity["role"] == "editor"
        and article["owner_id"] == identity["user_id"]
    )
assert can_delete({"role":"editor", "user_id":1}, {"owner_id":1})
assert not can_delete({"role":"editor", "user_id":1}, {"owner_id":2})
```

这里 identity 和 article 均假定来自服务端可信加载，代码只是策略函数，不含登录、数据库事务或完整 HTTP 响应。网页也是权限模型，不建立实际会话。

## 多语言示例

以下仅实现同一授权谓词：身份有效，而且是管理员或“编辑操作自己的资源”。verified/admin/editor/owns 都必须来自服务端可信判断，不能直接相信客户端布尔值。正常案例编辑+自己的资源返回真，编辑+别人的资源返回假；认证失败始终为假。这不是完整登录 API。

### C

```c
#include <stdbool.h>
bool may_delete(bool verified, bool admin, bool editor, bool owns) {
    return verified && (admin || (editor && owns));
}
```

bool 输入组合固定，授权成功不会自动执行删除。

### C++

```cpp
bool may_delete(bool verified, bool admin, bool editor, bool owns) {
    return verified && (admin || (editor && owns));
}
```

同一逻辑不依赖继承或某种 Web 框架。

### Python 3

```python
def may_delete(verified: bool, admin: bool, editor: bool, owns: bool) -> bool:
    return verified and (admin or (editor and owns))
```

此处调用者按契约传 bool；类型注解本身不在运行时强制验证。

### Rust

```rust
fn may_delete(verified: bool, admin: bool, editor: bool, owns: bool) -> bool {
    verified && (admin || (editor && owns))
}
```

返回 bool，不通过成功授权就不执行资源操作。

### Zig

```zig
fn mayDelete(verified: bool, admin: bool, editor: bool, owns: bool) bool {
    return verified and (admin or (editor and owns));
}
```

Zig 0.15.2 使用 and/or，和各语言内建布尔规则对应。

### Java

```java
class Policy {
    static boolean mayDelete(boolean verified, boolean admin, boolean editor, boolean owns) {
        return verified && (admin || (editor && owns));
    }
}
```

不使用客户端自行构造的角色标记作为可信身份。

### Kotlin

```kotlin
fun mayDelete(verified: Boolean, admin: Boolean, editor: Boolean, owns: Boolean): Boolean =
    verified && (admin || (editor && owns))
```

同一谓词可迁移到各语言；会话验证、资源加载和事务边界则依系统实现。

## 面试追问

认证通过后缓存授权可以吗？要考虑角色撤销、资源归属变化和缓存过期窗口，不能承诺永远使用旧角色。检查和实际写入之间还可能发生条件变化，重要操作应设计事务/条件更新等一致性边界。授权应默认拒绝，并对读、写、删除、导出分别判断；“能看”不自动推导“能改”。日志应记录必要审计信息，不输出完整令牌或秘密。

## 选择题

只在页面上隐藏“删除别人文章”的按钮，最主要的问题是？

A. 图标不够清楚

B. 攻击者仍可直接向服务端发请求，服务端必须独立授权

C. 登录后所有操作本来都允许

D. 把文章 ID 换成 UUID 就能完全解决

**答案：B。** A 与访问控制无关，C 混淆认证与授权，D 把标识难猜当作权限。前端提示改善体验，服务端验证建立安全边界。

## 参考

- [RFC 9110：401 与 403](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2)
