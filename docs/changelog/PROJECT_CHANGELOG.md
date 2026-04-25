# 更新记录

## 2026-03-19

### 1) 重新生成入口与按钮语义修复
- 修复“右侧看不到重新生成”的问题：在画布右侧工具栏补充了“重新生成”入口。
- 修复“首次生成按钮被改成重新生成”的语义冲突：空白生图卡片保持“生成”，已生成内容使用“重新生成”。

### 2) 中文提示词与画面文案策略（全链路）
- 新增并打通以下策略字段（UI -> Workspace -> Agent -> Skill -> Provider -> Gemini）：
  - `promptLanguagePolicy`: `original-zh | translate-en`
  - `textPolicy`: `{ enforceChinese?: boolean; requiredCopy?: string }`
- 默认策略改为中文优先：`original-zh`。
- 在最终生图 prompt 组装处加入统一后处理：
  - 开启英译时，先将提示词翻译为英文；失败自动回退原文。
  - 统一追加文字渲染约束：
    - 可见文字优先/强制中文（按开关）
    - 可选“指定文案”精确匹配（不增删改写）

### 3) Agent 规则动态化（移除英文硬编码）
- `analyzeAndPlan` 的语言要求改为读取 metadata 动态判断，不再固定“prompt 必须英文”。
- 产品描述规则从“精确英文描述”调整为“精确视觉描述”。
- `executeSingleSkillCall` 对 `generateImage` 增加策略注入（仅在未显式指定时注入）：
  - `promptLanguagePolicy`
  - `textPolicy`

### 4) 输入区/画布工具栏开关落位优化
- 新增开关：`英译`、`中文字`、`指定文案`。
- 先后修复两类可见性问题：
  1. 底部输入栏空间不足导致开关不明显 -> 改为可换行。
  2. 画布浮层工具栏同一行过挤导致越界 -> 将三项开关拆成独立一行，底部参数行（模型/分辨率/比例/生成）保持不变。

### 5) 关键文件
- `stores/agent.store.ts`
- `pages/Workspace/components/InputArea.tsx`
- `pages/Workspace.tsx`
- `services/agents/enhanced-base-agent.ts`
- `types/skill.types.ts`
- `services/providers/types.ts`
- `services/skills/image-gen.skill.ts`
- `services/providers/gemini.provider.ts`
- `services/gemini.ts`

### 6) 校验
- 已多次执行 TypeScript 检查：`npx tsc --noEmit --pretty false`
- 结果：通过（无类型报错）
