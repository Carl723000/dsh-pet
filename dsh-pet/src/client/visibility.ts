/**
 * 快捷隐藏/恢复的纯逻辑（无 React、无 DOM）。
 *
 * 放在这里而不是直接写进 PetMulti：隐藏/恢复的取值规则（哪些宠物要写、恢复到什么 display）
 * 是两端都能复用的判定，单独成模块才能在 Node 单测里钉住，避免"隐藏时把 none 也记进去、
 * 恢复时又把用户手动关掉的宠物强行打开"这类回归。
 */
import type { Pet, PetDisplay } from '../shared/types';

/** 浏览器本地保存「隐藏前 display」的键：刷新页面后按钮仍能按原样恢复。 */
export const HIDDEN_DISPLAYS_KEY = 'dsh-pet:hidden-displays';

export interface DisplayTarget {
  id: string;
  display: PetDisplay;
}

/**
 * 隐藏前记录每只宠物**当前非 none 的 display**。
 * 已经是 none 的不记（它们本来就没有显示，恢复时也不该被这条快捷开关打开）。
 */
export function rememberVisibleDisplays(pets: Pet[]): Record<string, PetDisplay> {
  const out: Record<string, PetDisplay> = {};
  for (const pet of pets) {
    if (pet.display !== 'none') out[pet.id] = pet.display;
  }
  return out;
}

/** 隐藏全部：只对当前非 none 的宠物写 none。 */
export function hideTargets(pets: Pet[]): DisplayTarget[] {
  return pets.filter((pet) => pet.display !== 'none').map((pet) => ({ id: pet.id, display: 'none' }));
}

/**
 * 恢复：按隐藏前记录的原 display 恢复；没有记录（例如在设置页手动改成 none 后再点恢复）
 * 的宠物回退到 both——否则点「显示桌宠」会什么都不发生。
 */
export function restoreTargets(pets: Pet[], saved: Record<string, PetDisplay> | null | undefined): DisplayTarget[] {
  return pets.map((pet) => {
    const previous = saved?.[pet.id];
    return { id: pet.id, display: previous && previous !== 'none' ? previous : 'both' };
  });
}

/** 解析 localStorage 里的隐藏前记录；损坏/空值一律当没有记录。 */
export function parseSavedDisplays(raw: string | null): Record<string, PetDisplay> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const out: Record<string, PetDisplay> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === 'web' || value === 'desktop' || value === 'both' || value === 'none') {
        out[id] = value;
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}
