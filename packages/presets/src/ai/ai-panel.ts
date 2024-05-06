import type { EditorHost } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
  ChatWithAIIcon,
  DiscardIcon,
  InsertBelowIcon,
  ReplaceIcon,
  ResetIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { ComputePositionConfig } from '@floating-ui/dom';

import { createTextRenderer } from './messages/text.js';
import { AIProvider } from './provider.js';
import {
  copyTextAnswer,
  insertBelow,
  replace,
} from './utils/editor-actions.js';
import { getSelections } from './utils/selection-utils.js';

function getSelection(host: EditorHost) {
  const textSelection = host.selection.find('text');
  const mode = textSelection ? 'flat' : 'highest';
  const { selectedBlocks } = getSelections(host, mode);
  assertExists(selectedBlocks);
  const length = selectedBlocks.length;
  const firstBlock = selectedBlocks[0];
  const lastBlock = selectedBlocks[length - 1];
  const selectedModels = selectedBlocks.map(block => block.model);
  return {
    textSelection,
    selectedModels,
    firstBlock,
    lastBlock,
  };
}

export function buildTextResponseConfig(panel: AffineAIPanelWidget) {
  const host = panel.host;

  const _replace = async () => {
    const selection = getSelection(host);
    if (!selection || !panel.answer) return;

    const { textSelection, firstBlock, selectedModels } = selection;
    await replace(
      host,
      panel.answer,
      firstBlock,
      selectedModels,
      textSelection
    );

    panel.hide();
  };

  const _insertBelow = async () => {
    const selection = getSelection(host);

    if (!selection || !panel.answer) {
      return;
    }

    const { lastBlock } = selection;
    await insertBelow(host, panel.answer ?? '', lastBlock);
    panel.hide();
  };

  return [
    {
      name: 'Response',
      items: [
        {
          name: 'Insert below',
          icon: InsertBelowIcon,
          handler: () => {
            _insertBelow().catch(console.error);
          },
        },
        {
          name: 'Replace selection',
          icon: ReplaceIcon,
          handler: () => {
            _replace().catch(console.error);
          },
        },
      ],
    },
    {
      name: '',
      items: [
        {
          name: 'Continue in chat',
          icon: ChatWithAIIcon,
          handler: () => {
            AIProvider.slots.requestContinueInChat.emit({
              host: panel.host,
              show: true,
            });
            panel.hide();
          },
        },
        {
          name: 'Regenerate',
          icon: ResetIcon,
          handler: () => {
            panel.generate();
          },
        },
        {
          name: 'Discard',
          icon: DiscardIcon,
          handler: () => {
            panel.discard();
          },
        },
      ],
    },
  ];
}

export function buildErrorResponseConfig(panel: AffineAIPanelWidget) {
  const host = panel.host;
  const _replace = async () => {
    const selection = getSelection(host);
    if (!selection || !panel.answer) return;

    const { textSelection, firstBlock, selectedModels } = selection;
    await replace(
      host,
      panel.answer,
      firstBlock,
      selectedModels,
      textSelection
    );

    panel.hide();
  };

  const _insertBelow = async () => {
    const selection = getSelection(host);

    if (!selection || !panel.answer) {
      return;
    }

    const { lastBlock } = selection;
    await insertBelow(host, panel.answer ?? '', lastBlock);
    panel.hide();
  };

  return [
    {
      name: 'Response',
      items: [
        {
          name: 'Replace selection',
          icon: ResetIcon,
          showWhen: () => {
            console.trace(
              'replace selection showWhen: ',
              !!panel.answer,
              panel
            );
            return !!panel.answer;
          },
          handler: () => {
            _replace().catch(console.error);
          },
        },
        {
          name: 'Insert below',
          icon: DiscardIcon,
          showWhen: () => {
            console.trace('Insert below showWhen: ', !!panel.answer, panel);
            return !!panel.answer;
          },
          handler: () => {
            _insertBelow().catch(console.error);
          },
        },
      ],
    },
    {
      name: '',
      items: [
        {
          name: 'Retry',
          icon: ResetIcon,
          showWhen: () => true,
          handler: () => {
            panel.generate();
          },
        },
        {
          name: 'Discard',
          icon: DiscardIcon,
          showWhen: () => !!panel.answer,
          handler: () => {
            panel.discard();
          },
        },
      ],
    },
  ];
}

export function buildFinishConfig(panel: AffineAIPanelWidget) {
  return {
    responses: buildTextResponseConfig(panel),
    actions: [],
  };
}

export function buildErrorConfig(panel: AffineAIPanelWidget) {
  return {
    upgrade: () => {
      AIProvider.slots.requestUpgradePlan.emit({ host: panel.host });
      panel.hide();
    },
    login: () => {
      AIProvider.slots.requestLogin.emit({ host: panel.host });
      panel.hide();
    },
    cancel: () => {
      panel.hide();
    },
    responses: buildErrorResponseConfig(panel),
  };
}

export function buildCopyConfig(panel: AffineAIPanelWidget) {
  return {
    allowed: true,
    onCopy: () => {
      return copyTextAnswer(panel);
    },
  };
}

export function buildAIPanelConfig(
  panel: AffineAIPanelWidget,
  positionConfig?: Partial<ComputePositionConfig>
): AffineAIPanelWidgetConfig {
  return {
    answerRenderer: createTextRenderer(panel.host, 320),
    finishStateConfig: buildFinishConfig(panel),
    errorStateConfig: buildErrorConfig(panel),
    positionConfig,
    copy: buildCopyConfig(panel),
  };
}

export const getAIPanel = (host: EditorHost): AffineAIPanelWidget => {
  const rootBlockId = host.doc.root?.id;
  assertExists(rootBlockId);
  const aiPanel = host.view.getWidget(AFFINE_AI_PANEL_WIDGET, rootBlockId);
  assertExists(aiPanel);
  if (!(aiPanel instanceof AffineAIPanelWidget)) {
    throw new Error('AI panel not found');
  }
  return aiPanel;
};
