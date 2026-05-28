import { CATEGORY_META, type Analysis } from './classifier';

export async function ungroupTabs(tabIds: ReadonlyArray<number>): Promise<void> {
  if (tabIds.length === 0) return;
  await chrome.tabs.ungroup(tabIds as [number, ...number[]]);
}

export async function applyGrouping(analysis: Analysis): Promise<number> {
  let groupsCreated = 0;
  for (const group of analysis.groups) {
    const tabIds = group.tabs.map((t) => t.id);
    if (tabIds.length === 0) continue;
    const groupId = await chrome.tabs.group({
      tabIds: tabIds as [number, ...number[]],
    });
    await chrome.tabGroups.update(groupId, {
      color: CATEGORY_META[group.category].color,
      title: CATEGORY_META[group.category].label,
    });
    groupsCreated++;
  }
  return groupsCreated;
}
