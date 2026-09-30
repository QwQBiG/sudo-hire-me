---
slug: "ci-pipeline-basic"
title: "持续集成流水线怎样挡住回归"
description: "从一次提交的触发、构建、测试和产物，读懂失败关口与部署门禁。"
subject: "工程实践"
order: 173
minutes: 18
lab: "workbench"
objectives: ["解释 CI 的触发和检查对象", "根据失败阶段判断下一步排查范围", "区分测试通过、可部署和已部署"]
prerequisites: ["build-artifact-release", "unit-integration-e2e-tests"]
---

# 提交之后那条绿色或红色流水线说明什么

## CI 检查的是某次确定的改动

持续集成（Continuous Integration，CI）把团队的改动频繁合入并通过自动构建、测试等检查尽早发现冲突和回归。以 GitHub Actions 为例，工作流可由推送或拉取请求触发，工作流包含任务（Job），任务在运行器上执行步骤（Step）；具体仓库选择哪些步骤由自己的配置决定，不是平台自动保证所有项目都检查一样的内容。[GitHub 文档：Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)

假设一个仓库规定：提交后依次进行依赖安装、编译、单元测试、集成测试、打包；只有必要检查通过的产物才进入待部署状态。这个例子用一条顺序线帮助理解，真实流水线的任务可并行，失败策略和发布门禁也由团队配置。

## 逐步推演

### 第一步：确认流水线对应哪个提交

开发者提交了修改解析函数的提交 B。若工作流由 `push` 触发，检查对象通常是该次推送对应的提交；GitHub Actions 的常规 `pull_request` 工作流默认检查 PR 与目标分支的临时合并结果，而不只是 B 自身。看状态前应确认运行编号及实际检出的提交或合并结果。若又推送提交 C，B 的旧检查通过不代表 C 已通过。以下步骤按 `push` 触发的 B 举例。[GitHub 文档：触发工作流的事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)

```text
提交 B -> 安装依赖 -> 编译 -> 单元测试 -> 集成测试 -> 打包
```

### 第二步：编译通过后，单元测试失败

B 能生成可执行文件，但一个空输入测试预期返回错误，实际返回了 0。红色状态应指向失败的**测试断言**和相关函数；重新运行同一失败输入能帮助判断是否稳定复现。不能因为编译通过就说“代码没问题”，也不要在单元测试尚失败时去猜生产数据库连接。

修正后生成提交 C，让 C 的流水线重新经过检查；不要手工把 B 的失败状态改成通过，也不要把 C 的成功归给 B。

### 第三步：集成测试再检查连接处

C 的单元测试通过后，集成测试发现服务写入数据库时违反非空约束。此时计算函数可能正确，但组件之间传递字段时丢失了值。不同阶段的失败证据指向不同范围；若集成测试使用测试数据库，要记录其模式版本和初始化方式，才能在本地复现。

| 状态 | 能说明什么 | 不能说明什么 |
| --- | --- | --- |
| 编译通过 | 工具链生成了产物 | 业务结果必然正确 |
| 单元测试通过 | 已列出的小范围规则通过 | 数据库与页面连接正确 |
| 集成测试通过 | 已测的组件协作通过 | 所有真实流量下都无故障 |

### 第四步：区分待发布和已发布

检查全绿且打包完成，表示这份产物满足**配置过的门禁**；它未必已部署。持续交付（Continuous Delivery）通常让软件保持可发布状态，持续部署（Continuous Deployment）进一步将通过门禁的改动自动发布；团队也可以选择人工审批或灰度。发布后还要观察启动、错误率和关键路径。[GitHub 文档：Continuous Deployment](https://docs.github.com/en/actions/get-started/continuous-deployment)

若自动化步骤根本没有覆盖某条关键路径，绿色状态也不会替你验证它。应把测试范围、产物版本和部署状态分别报告。

## 面试回答

CI 让提交或 PR 在受控环境中自动执行构建与测试，尽早发现回归。排查失败时先确认这次运行实际检查的提交或 PR 合并结果，再按安装、编译、单元、集成等阶段读证据；改动修复后重新验证新版本。流水线通过只表示配置过的检查通过，不等于线上已部署或所有行为都正确；发布还需版本关联与运行时观察。

## 流水线本身也要可维护

测试偶发失败时记录失败输入、环境和次数，不应长期用“重跑直到绿”代替定位。依赖更新、缓存和并行任务可能让问题只在 CI 出现，应比较本地与运行器的工具链和配置。把每一步的输入输出保留得足够清楚，才能让红色状态带来定位价值。

## 常见误区

- **“CI 绿了就是已经部署。”** 构建测试和发布是不同状态。
- **“上一次提交绿了，当前提交也一定绿。”** 状态要与提交标识绑定。
- **“编译通过说明业务无错。”** 行为还要靠测试和观察。
- **“失败就无限重跑。”** 应先保存证据并定位稳定或偶发条件。

## 选择题

提交 B 的编译通过但单元测试失败，随后提交 C 修复了问题。哪种描述最准确？

- A. B 的编译通过已证明 B 业务正确。
- B. 应让 C 对应的流水线重新运行，按 C 的检查结果判断是否满足门禁。
- C. 只要 B 的旧流水线最终变绿，C 就不需要检查。
- D. 单元测试失败只能是数据库故障。

**答案：B。** 检查结果要绑定具体提交；A、C 混淆版本，D 没有依据地扩大故障范围。

## 参考资料

- [GitHub：Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)
- [GitHub：Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)
- [GitHub：Continuous Deployment](https://docs.github.com/en/actions/get-started/continuous-deployment)
