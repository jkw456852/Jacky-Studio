# Jackt Studio

<div align="center">

![version](https://img.shields.io/badge/version-rewrite-orange)
![React](https://img.shields.io/badge/React-19-61dafb)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![license](https://img.shields.io/badge/license-MIT-green)

面向 AI 辅助创作的新一代工作台。

从多轮对话、无限画布、树节点工作流，到多供应商模型接入、参考图生成/编辑、视频子工作区，这个仓库承载的是重构后的新项目，而不是旧版 XC-STUDIO 的延续包装。

</div>

---

## 项目定位

Jackt Studio 是一个以 `Workspace` 为核心的 AI 创作工作台，重点不是单一聊天窗口，而是把以下能力放进同一个可持续迭代的创作环境里：

- 对话驱动的创作与修改
- 画布化的图片、文本、形状、视频元素编排
- 树节点式提示词/参考图生成链路
- 多供应商、多账号、多模型的统一接入
- 电商、服装、海报、包装等垂直工作流
- 项目持久化、历史恢复与主题记忆

## 当前仓库包含什么

- `pages/Workspace.tsx`
  - 当前主工作区入口，承接画布、树节点、消息区和各类编辑工具
- `pages/Workspace/components/`
  - 工作区 UI 组件，包括树节点、工具栏、图层、预览、图片编辑等
- `pages/Workspace/controllers/`
  - 工作区控制层，负责发送消息、生图、改图、引用图上传、状态同步等
- `services/gemini.ts`
  - 当前最核心的模型接入与兼容适配逻辑之一
- `services/providers/`
  - 图片/视频/模型供应商抽象层
- `services/skills/`
  - 面向具体任务的技能层，如生图、改图、智能编辑、电商流程等
- `stores/`
  - Zustand 状态管理
- `XC-VIDEO/`
  - 挂载式视频子应用
- `docs/`
  - 重构说明、架构图、产品方案、规范、参考资料

## 核心能力

### 1. 工作区式创作

- 不是只有聊天，而是聊天 + 画布 + 节点 + 结果面板并存
- 支持项目级持久化，便于持续迭代同一个创作主题
- 通过 Workspace 控制层把输入、生成、编辑、保存串成闭环

### 2. 树节点生成链路

- 支持提示词节点、图片节点等树状连接关系
- 参考图与结果图可以在节点结构里持续派生
- 适合做多轮变体、局部迭代、风格分支和方案对比

### 3. 多模型与多供应商接入

- 支持按供应商维度管理模型，而不是只按模型名粗暴合并
- 支持同一供应商下多个不同 key/账号并存
- 逐步兼容图片生成、图片编辑、视频生成等不同接口形态

### 4. 垂直工作流

- 电商图工作流
- 服装/商品参考图与一致性生成
- 智能编辑、局部重绘、触控式修改
- 视频工作区接入

## 技术栈

- React 19
- TypeScript 5.8
- Vite 6
- Zustand
- Google GenAI SDK 与多供应商适配
- IndexedDB 本地持久化

## 本地开发

### 安装依赖

```bash
npm install
cd XC-VIDEO
npm install
cd ..
```

### 启动开发环境

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 预览

```bash
npm run preview
```

### 现有测试脚本

```bash
npm run test:optimizer
```

## 推荐阅读顺序

如果你是第一次进入这个仓库，建议按这个顺序看：

1. `docs/README.md`
2. `docs/standards/AI_DEVELOPMENT_STANDARD.md`
3. `docs/architecture/ROOT_DIRECTORY_POLICY.md`
4. `docs/architecture/PROJECT_MODULE_MAP.md`
5. `docs/architecture/WORKSPACE_REFACTOR_MAP.md`
6. `docs/product/tree-node/TREE_NODE_IMPLEMENTATION_PLAN_20260424.md`
7. `pages/Workspace.tsx`
8. `pages/Workspace/controllers/useWorkspaceSend.ts`
9. `pages/Workspace/controllers/useWorkspaceElementImageGeneration.ts`
10. `services/gemini.ts`

## 目录速览

```text
.
├─ pages/
│  ├─ Workspace/
│  │  ├─ components/
│  │  ├─ controllers/
│  │  ├─ workspaceNodeGraph.ts
│  │  └─ workspaceTreeNode.ts
│  ├─ Home.tsx
│  ├─ Projects.tsx
│  ├─ Settings.tsx
│  └─ VideoWorkspace.tsx
├─ services/
│  ├─ agents/
│  ├─ providers/
│  ├─ skills/
│  └─ gemini.ts
├─ stores/
├─ utils/
├─ docs/
├─ XC-VIDEO/
└─ user-management/
```

## 文档入口

- [文档索引](./docs/README.md)
- [项目模块地图](./docs/architecture/PROJECT_MODULE_MAP.md)
- [Workspace 重构地图](./docs/architecture/WORKSPACE_REFACTOR_MAP.md)
- [Tree Node 实现计划](./docs/product/tree-node/TREE_NODE_IMPLEMENTATION_PLAN_20260424.md)
- [API 配置指南](./docs/references/API-CONFIGURATION-GUIDE.md)

## 注意事项

- 这是一个仍在快速重构中的项目，很多能力已经切进新架构，但仍有少量旧项目遗留物待继续清理
- README 描述以当前仓库实际代码结构为准，不再沿用旧版 XC-STUDIO 的仓库定位
- 若你在改模型兼容、树节点、生图接口或 Workspace，请优先查看 `docs/` 中对应设计文档

## License

MIT
