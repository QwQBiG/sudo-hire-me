---
slug: "load-balancing-basics"
title: "轮询和最少连接为什么会选到不同实例"
description: "用三台服务与当前连接数手算转发选择，理解健康检查和会话边界。"
subject: "并发与系统设计"
order: 162
minutes: 17
lab: "walkthrough"
objectives: ["按轮询顺序选实例", "按活跃连接数选实例", "说明健康检查和粘性会话对选择的影响"]
prerequisites: ["http-https", "database-connection-pool"]
---

# 轮询和最少连接为什么会选到不同实例

## 同一时刻，不同规则

**负载均衡**（Load Balancing）把请求分配给多个后端。设有三台健康服务 A、B、C；下一轮轮询指针指向 A，当前活跃连接数分别为 A=5、B=6、C=2。无权重、无其他限制时，**轮询**（Round Robin）按指针选 A；**最少连接**（Least Connections）按当前连接数选 C。同一组请求可能因分配策略不同而去往不同后端。[NGINX：HTTP Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)

## 逐步推演

### 固定快照：A=5、B=6、C=2

轮询指针指向 A。轮询不在此刻比较连接数，先选 A；最少连接在同一快照下选 C。两个策略可以给出不同结果。

### B 健康检查失败

若负载均衡器已把 B 标为不可用，正常分配应避开 B；轮询或最少连接都只在可用候选里选。健康检查的时机和故障摘除并非零延迟。[NGINX：Upstream Module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)

### 考虑会话状态

如果应用把用户登录状态只存在某一实例本地，切换实例可能丢失会话；可以设计共享状态或按明确规则保持会话粘性。粘性会话会限制调度自由，不意味着负载一定均匀，也不能代替后端数据一致性。

## 面试回答

负载均衡把请求发给多个可用实例。轮询按顺序分配，简单但不看当前工作量；最少连接优先当前活跃连接少的实例，但连接数不等于真实 CPU 或请求成本。实际选择还受权重、健康检查和会话粘性影响，应根据负载特征与可观测数据选择策略，而不是说某算法总最好。

## 常见误区

- **“轮询一定让 CPU 使用率均匀。”** 请求耗时和资源消耗可能差很多。
- **“最少连接等于最少负载。”** 长短请求、连接复用会让连接数成为不完美代理。

## 选择题

A、B、C 活跃连接为 5、6、2，轮询指针指向 A。无权重时，轮询和最少连接分别选谁？

- A. A、C
- B. B、A
- C. C、A
- D. A、A

**答案：A。** 轮询遵循当前指针，最少连接选择数量最低的 C。

## 参考资料

- [NGINX：HTTP Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [NGINX：Upstream Module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
