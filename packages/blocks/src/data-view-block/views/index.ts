import type { ViewMeta } from '@blocksuite/data-view';

import { viewPresets } from '@blocksuite/data-view/view-presets';

export const blockQueryViews: ViewMeta[] = [
  viewPresets.tableViewConfig,
  viewPresets.kanbanViewConfig,
];

export const blockQueryViewMap = Object.fromEntries(
  blockQueryViews.map(view => [view.type, view])
);
