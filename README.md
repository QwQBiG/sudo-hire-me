# sudo-hire-me

从概念、例题和实验开始，逐步理解计算机基础与面试问题。

课程正文使用 Markdown 维护，网站提供逐步演示、代码实验、选择题和本地学习记录。读完一课后，再用简短回答检验自己是否能讲清概念、过程和适用条件。

站点入口：[qwqbig.github.io/sudo-hire-me](https://qwqbig.github.io/sudo-hire-me/)。

## 课程范围

首批包含六课，用于建立可逐步扩展的学习路径，不是完整的考研或面试题库。

| 主题 | 主要内容 | 实验形式 |
| --- | --- | --- |
| 二进制与补码 | 位权、整数解释、取反加一、溢出 | 位模式交互演示 |
| 二分查找 | 搜索区间、边界更新、循环不变量 | 分步查找演示 |
| 进程与线程 | 地址空间、共享资源、并发与并行 | 调度教学模拟 |
| JavaScript 事件循环 | 同步执行、任务、微任务 | JavaScript 真实运行 |
| SQL 连接查询 | 匹配条件、内外连接、空值 | SQLite 真实运行 |
| Rust 所有权 | 移动、借用、生命周期边界 | 诊断参考与状态演示 |

JavaScript 在浏览器的隔离 Worker 中运行，不提供页面 DOM 或 Node.js 环境。SQL 使用浏览器内的 SQLite，与其他数据库的语法和行为可能不同。Rust 示例不连接编译器，显示的诊断是教学参考。

## 本地开发

需要 Node.js 22.19.0 或更新的兼容版本，以及 npm。

```powershell
npm install
npm run dev
```

按照终端输出的地址打开 `/sudo-hire-me/`。默认端口可用时，地址为 `http://127.0.0.1:5173/sudo-hire-me/`。

```powershell
npm run check
npm test
npm run build
npm run preview
```

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务，生成课程数据 |
| `npm run content` | 校验 Markdown 并更新生成内容 |
| `npm run check` | 校验和生成课程内容，再检查 TypeScript |
| `npm test` | 运行测试目录中的 Node.js 测试 |
| `npm run build` | 检查项目并生成 `dist/` |
| `npm run preview` | 本地预览构建产物 |

检查命令会更新生成目录，不是只读检查。开发服务监听课程的添加、修改与删除；内容格式错误会在页面提示。

## 项目结构

```text
content/lessons/       课程 Markdown，唯一内容源
scripts/              内容解析与生成
src/                  页面、实验组件和运行器
src/domain/           搜索、进度等独立逻辑
public/               静态资源
.generated/           构建生成的课程数据
public/lessons/        构建复制的 Markdown
public/data/           按课程拆分的正文数据
dist/                 生产构建产物
docs/                 维护和内容编写说明
```

不要直接编辑 `.generated/`、`public/lessons/`、`public/data/` 或 `dist/` 中的课程副本。

## 学习记录

阅读状态、练习结果、书签和笔记保存在当前浏览器中，不上传服务器。清除站点数据、更换浏览器或使用另一设备不会自动保留记录；需要通过进度导出和导入转移。

导入文件须通过格式和课程 ID 校验。进度仅用于个人复习，不作为可靠的考试成绩或身份凭据。

## 维护与发布

- [架构与运行边界](docs/architecture.md)
- [课程编写规范](docs/authoring.md)
- [仓库维护规则](AGENTS.md)
- [课程源文件](content/lessons/)

站点采用 hash 路由和 `/sudo-hire-me/` 资源前缀，适合静态托管。发布内容为 `dist/`；变更仓库名或部署到其他路径时，需要同步修改 Vite 的 `base` 并检查资源、路由和 Wasm 加载。

Windows 与 Linux 均使用 UTF-8 文本和 LF 换行，由 `.editorconfig` 与 `.gitattributes` 约定。
