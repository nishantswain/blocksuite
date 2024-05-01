import { WidgetElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { on, once, stopPropagation } from '../../../_common/utils/event.js';
import { Bound } from '../../../surface-block/index.js';
import { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { edgelessElementsBound } from '../../edgeless/utils/bound-utils.js';

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 90;

export const AFFINE_EDGELESS_MINIMAP_WIDGET = 'affine-edgeless-minimap-widget';

@customElement(AFFINE_EDGELESS_MINIMAP_WIDGET)
export class AffineEdgelessMinimapWidget extends WidgetElement {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      left: 12px;
      bottom: 66px;

      z-index: 2;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--affine-border-color);
      background-color: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);

      overflow: hidden;
      user-select: none;
    }

    canvas[aria-label='minimap'] {
      display: flex;
      flex: 1;
      width: 100%;
    }

    .slider {
      position: absolute;
      transform: translate3d(0px, 0px, 0px);
      background: rgba(100, 100, 100, 0.2);
      contain: strict;

      &:hover {
        background: rgba(100, 100, 100, 0.35);
      }

      &.active {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  `;

  get isEdgeless() {
    return this.blockElement instanceof EdgelessRootBlockComponent;
  }

  @query('canvas')
  canvas!: HTMLCanvasElement;

  @query('.slider')
  slider!: HTMLDivElement;

  @state()
  zoom: number = 1;

  @state()
  viewportBounds: Bound = new Bound();

  bounds: Bound = new Bound();

  scale: number = 1;

  // Dragging slider
  dragging: boolean = false;

  private _draw(width: number, height: number) {
    const edgeless = this.blockElement as EdgelessRootBlockComponent;
    const elements = edgeless.service.edgelessElements;
    const bounds = edgelessElementsBound(elements);

    // @TODO(fundon): offset should be checked, prev bounds
    this.bounds = bounds;
    this.scale = Math.min(
      width / (bounds.w || width),
      height / (bounds.h || height)
    );

    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.fillStyle = 'rgba(127.5, 127.5, 127.5, 0.6)';

    const dpr = window.devicePixelRatio;
    const matrix = new DOMMatrix()
      .scaleSelf(dpr)
      .scaleSelf(this.scale)
      .translateSelf(
        -bounds.x + (width / this.scale - bounds.w) / 2,
        -bounds.y + (height / this.scale - bounds.h) / 2
      );

    ctx.setTransform(matrix);

    elements.forEach(ele => {
      const { x, y, w, h } = ele.elementBound;
      const m = matrix.translate(x, y);

      ctx.save();
      ctx.setTransform(m);
      // const cx = w / 2;
      // const cy = h / 2;
      // ctx.setTransform(m.translateSelf(cx, cy).translateSelf(-cx, -cy));

      ctx.fillRect(0, 0, w, h);
      ctx.fill();

      ctx.restore();
    });

    ctx.setTransform(matrix.inverse());
  }

  override firstUpdated() {
    const dpr = window.devicePixelRatio;
    const width = DEFAULT_WIDTH;
    const height = DEFAULT_HEIGHT;
    this.canvas.style.width = `${DEFAULT_WIDTH}px`;
    this.canvas.style.height = `${DEFAULT_HEIGHT}px`;
    this.canvas.width = DEFAULT_WIDTH * dpr;
    this.canvas.height = DEFAULT_HEIGHT * dpr;

    if (this.isEdgeless) {
      const edgeless = this.blockElement as EdgelessRootBlockComponent;

      this.disposables.add(
        edgeless.service.viewport.sizeUpdated.on(rect => {
          this._draw(width, height);

          this.viewportBounds.w = rect.width * this.scale;
          this.viewportBounds.h = rect.height * this.scale;
          this.viewportBounds.x = (width - this.viewportBounds.w) / 2;
          this.viewportBounds.y = (height - this.viewportBounds.h) / 2;
          this.requestUpdate();
        })
      );
      this.disposables.add(
        edgeless.service.viewport.viewportUpdated.on(({ zoom, center }) => {
          if (this.dragging) return;

          const cx = (width - this.viewportBounds.w) / 2;
          const cy = (height - this.viewportBounds.h) / 2;
          const dx = center[0] - this.bounds.w / 2 - this.bounds.x;
          const dy = center[1] - this.bounds.h / 2 - this.bounds.y;

          this.zoom = zoom;
          this.viewportBounds.x = cx + dx * this.scale;
          this.viewportBounds.y = cy + dy * this.scale;
          this.requestUpdate();
        })
      );

      /*
      this.disposables.add(
        edgeless.service.viewport.viewportMoved.on(delta => {
          if (this.dragging) return;

          this.viewportBounds.x += delta[0] * this.scale;
          this.viewportBounds.y += delta[1] * this.scale;

          this.requestUpdate();
        })
      );
      */

      this.disposables.addFromEvent(this, 'pointerdown', stopPropagation);
      // this.disposables.addFromEvent(this, 'wheel', stopPropagation);
      this.disposables.addFromEvent(this.canvas, 'click', (e: MouseEvent) => {
        e.stopPropagation();

        const box = this.canvas.getBoundingClientRect();
        const x = e.clientX - box.left - this.viewportBounds.w / 2;
        const y = e.clientY - box.top - this.viewportBounds.h / 2;
        const dx = x - this.viewportBounds.x;
        const dy = y - this.viewportBounds.y;

        this.viewportBounds.x = x;
        this.viewportBounds.y = y;
        this.requestUpdate();

        edgeless.service.viewport.applyDeltaCenter(
          dx / this.scale,
          dy / this.scale
        );
      });
      this.disposables.addFromEvent(
        this.slider,
        'pointerdown',
        (e: PointerEvent) => {
          e.stopPropagation();
          e.preventDefault();

          this.slider.classList.add('active');

          const point = [e.clientX, e.clientY];
          const stopDragging = on(
            this.slider.ownerDocument,
            'pointermove',
            (e: PointerEvent) => {
              e.stopPropagation();
              this.dragging = true;

              const { clientX, clientY } = e;
              const dx = clientX - point[0];
              const dy = clientY - point[1];

              point[0] = clientX;
              point[1] = clientY;

              this.viewportBounds.x += dx;
              this.viewportBounds.y += dy;
              this.requestUpdate();

              edgeless.service.viewport.applyDeltaCenter(
                dx / this.scale,
                dy / this.scale
              );
            }
          );

          once(
            this.slider.ownerDocument,
            'pointerup',
            (e: PointerEvent) => {
              e.stopPropagation();
              stopDragging();
              this.dragging = false;
              this.slider.classList.remove('active');
            },
            false
          );
        }
      );

      this.disposables.add(
        edgeless.surfaceBlockModel.elementAdded.on(() => {
          this._draw(width, height);
        })
      );
      this.disposables.add(
        edgeless.surfaceBlockModel.elementRemoved.on(() => {
          this._draw(width, height);
        })
      );
      this.disposables.add(
        edgeless.surfaceBlockModel.elementUpdated.on(() => {
          this._draw(width, height);
        })
      );
      this.disposables.add(
        edgeless.doc.slots.blockUpdated.on(() => {
          this._draw(width, height);
        })
      );
    }
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.disposables.dispose();
  }

  override render() {
    const { viewportBounds, zoom } = this;

    return html`<canvas aria-label="minimap"></canvas>
      <div
        class="slider"
        style=${styleMap({
          width: `${viewportBounds.w}px`,
          height: `${viewportBounds.h}px`,
          transform: `translate3d(${viewportBounds.x}px,${viewportBounds.y}px, 0px) scale(${1 / zoom})`,
        })}
      ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_MINIMAP_WIDGET]: AffineEdgelessMinimapWidget;
  }
}
