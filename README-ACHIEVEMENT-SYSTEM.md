# 成就系统集成指南

本指南介绍如何在项目中集成“等级+成就”系统，包含快速开始、数据结构、接口说明与性能建议。

## 快速开始（TypeScript）
```ts
import { updateAchievements, calculateLevel } from '@/utils/achievementRules';
// records: 从分析页生成的训练记录数组（见下文类型）
const { achievements, totalExp, level, levelInfo } = updateAchievements(prevAchievements, records, { targetWeeklyHours: 5 });
console.log(level, totalExp, achievements);
```

## 快速开始（静态HTML）
```html
<script src="/utils/achievementRules.js"></script>
<script>
  const KEY = 'jump_records';
  const records = JSON.parse(localStorage.getItem(KEY) || '[]');
  const result = window.AchievementEngine.updateAchievements(null, records, { targetWeeklyHours: 5 });
  // result: { achievements, totalExp, level, levelInfo }
</script>
```

## 数据结构
```ts
export type AchRecord = {
  ts: number;         // 毫秒时间戳
  count: number;      // 单次跳绳次数
  duration: number;   // 单次时长（秒）
  score10?: number;   // 0-10（优先使用）
  symmetry_score?: number; // 0-100（若无score10则/10折算）
  misses?: number;    // 单次失误次数
};

export type Achievement = {
  id: string;
  title: string;
  category: 'blue'|'green'|'orange'|'purple';
  exp: number;
  icon?: string;
  unlocked: boolean;
  progress: number;   // 0~1
  unlockedAt?: number;// 首次达成的时间戳
};
```

## API 说明
- expForLevel(level): 下一级所需经验（100 × level^1.5）
- calculateLevel(totalExp): 返回 { level, expIntoLevel, nextLevelNeed }
- evaluateAchievements(records, plan?): 计算当前成就与进度
- updateAchievements(prev, records, plan?): 合并旧状态与新计算，返回 { achievements, totalExp, level, levelInfo }

## UI集成建议
- 在成就页显示：
  - 等级：result.level 与到下一级剩余经验（levelInfo.nextLevelNeed - levelInfo.expIntoLevel）
  - 总经验值：result.totalExp
  - 已解锁成就数：result.achievements.filter(a=>a.unlocked).length
  - 每个成就的进度条：a.progress
- 颜色与图标按 docs/achievement-rules.md 建议映射。

## 数据一致性
- 统一从 localStorage('jump_records') 读取；分析页写入。
- 清空记录后，调用 updateAchievements 以刷新UI。

## 性能优化
- 统计计算基于 O(n) 单次扫描，适用于中小规模数据。
- 可按需缓存 evaluateAchievements 的结果（例如在路由切换时）避免重复计算。
- 对“最长连续天数”逻辑已使用按日聚合，复杂度 O(d)。

## 目录结构
- src/utils/achievementRules.ts（TS核心）
- public/utils/achievementRules.js（静态页JS）
- docs/achievement-rules.md（规则与口径）
