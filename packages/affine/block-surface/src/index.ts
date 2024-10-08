import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceBlockService } from './surface-service.js';

import './commands/reassociate-connectors.js';

export { type IModelCoord, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './consts.js';
export { GRID_GAP_MAX, GRID_GAP_MIN } from './consts.js';
export {
  SurfaceElementModel,
  SurfaceGroupLikeModel,
} from './element-model/base.js';

export { CanvasElementType } from './element-model/index.js';
export { MindmapElementModel } from './element-model/mindmap.js';
export type { SerializedMindmapElement } from './element-model/mindmap.js';
export { MindmapUtils } from './element-model/utils/mindmap/index.js';
import { isConnectorWithLabel } from './element-model/utils/connector.js';
import { isConnectorAndBindingsAllSelected } from './managers/connector-manager.js';
export type {
  MindmapNode,
  NodeDetail,
} from './element-model/utils/mindmap/layout.js';
export * from './elements/index.js';
export {
  calculateNearestLocation,
  ConnectionOverlay,
  ConnectorEndpointLocations,
  ConnectorEndpointLocationsOnTriangle,
  ConnectorPathGenerator,
} from './managers/connector-manager.js';
export { LayerManager } from './managers/layer-manager.js';
export type { BlockLayer } from './managers/layer-manager.js';
export type { ReorderingDirection } from './managers/layer-manager.js';
export {
  compare as compareLayer,
  renderableInEdgeless,
  SortOrder,
} from './managers/layer-utils.js';
export { CanvasRenderer, Overlay } from './renderer/canvas-renderer.js';
export * from './renderer/elements/group/consts.js';
export type { ElementRenderer } from './renderer/elements/index.js';
export {
  elementRenderers,
  normalizeShapeBound,
} from './renderer/elements/index.js';
export { fitContent } from './renderer/elements/shape/utils.js';
import {
  getCursorByCoord,
  getLineHeight,
  isFontStyleSupported,
  isFontWeightSupported,
  normalizeTextBound,
  splitIntoLines,
} from './renderer/elements/text/utils.js';
import {
  getFontFaces,
  getFontFacesByFontFamily,
  isSameFontFamily,
  wrapFontFamily,
} from './utils/font.js';
export { SurfaceBlockComponent } from './surface-block.js';
export type { SurfaceContext } from './surface-block.js';
export { SurfaceBlockModel, SurfaceBlockSchema } from './surface-model.js';
export type { SurfaceBlockService } from './surface-service.js';
export {
  EdgelessSurfaceBlockSpec,
  PageSurfaceBlockSpec,
} from './surface-spec.js';
export { SurfaceBlockTransformer } from './surface-transformer.js';
export { AStarRunner } from './utils/a-star.js';
export { RoughCanvas } from './utils/rough/canvas.js';
export type { Options } from './utils/rough/core.js';
export { sortIndex } from './utils/sort.js';

import {
  almostEqual,
  clamp,
  getBoundsWithRotation,
  getPointFromBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  getQuadBoundsWithRotation,
  getStroke,
  getSvgPathFromStroke,
  intersects,
  isOverlap,
  isPointIn,
  lineIntersects,
  linePolygonIntersects,
  normalizeDegAngle,
  polygonGetPointTangent,
  polygonNearestPoint,
  polygonPointDistance,
  polyLineNearestPoint,
  rotatePoints,
  sign,
  toDegree,
  toRadian,
} from '@blocksuite/global/utils';
import { generateKeyBetween } from 'fractional-indexing';

import { generateElementId, normalizeWheelDeltaY } from './utils/index.js';

export const ConnectorUtils = {
  isConnectorAndBindingsAllSelected,
  isConnectorWithLabel,
};

export const TextUtils = {
  splitIntoLines,
  normalizeTextBound,
  getLineHeight,
  getCursorByCoord,
  isFontWeightSupported,
  isFontStyleSupported,
  wrapFontFamily,
  getFontFaces,
  getFontFacesByFontFamily,
  isSameFontFamily,
};

export const CommonUtils = {
  almostEqual,
  clamp,
  generateElementId,
  generateKeyBetween,
  getBoundsWithRotation,
  getPointFromBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  getQuadBoundsWithRotation,
  getStroke,
  getSvgPathFromStroke,
  intersects,
  isOverlap,
  isPointIn,
  lineIntersects,
  linePolygonIntersects,
  normalizeDegAngle,
  normalizeWheelDeltaY,
  polygonGetPointTangent,
  polygonNearestPoint,
  polygonPointDistance,
  polyLineNearestPoint,
  rotatePoints,
  sign,
  toDegree,
  toRadian,
};

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:surface': SurfaceBlockService;
    }
    interface BlockModels {
      'affine:surface': SurfaceBlockModel;
    }
  }
}
