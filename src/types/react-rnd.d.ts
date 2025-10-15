declare module 'react-rnd' {
  import { ComponentType, CSSProperties, ReactNode } from 'react';

  export interface RndDragCallback {
    (e: MouseEvent | TouchEvent, data: { x: number; y: number }): void;
  }

  export interface RndResizeCallback {
    (
      e: MouseEvent | TouchEvent,
      direction: string,
      ref: HTMLElement,
      delta: { width: number; height: number },
      position: { x: number; y: number }
    ): void;
  }

  export interface RndProps {
    default?: {
      x: number;
      y: number;
      width?: number | string;
      height?: number | string;
    };
    position?: { x: number; y: number };
    size?: { width: number | string; height: number | string };
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    bounds?: string | HTMLElement;
    dragHandleClassName?: string;
    dragAxis?: 'x' | 'y' | 'both' | 'none';
    enableResizing?: boolean | {
      top?: boolean;
      right?: boolean;
      bottom?: boolean;
      left?: boolean;
      topRight?: boolean;
      bottomRight?: boolean;
      bottomLeft?: boolean;
      topLeft?: boolean;
    };
    disableDragging?: boolean;
    onDragStart?: RndDragCallback;
    onDrag?: RndDragCallback;
    onDragStop?: RndDragCallback;
    onResizeStart?: RndResizeCallback;
    onResize?: RndResizeCallback;
    onResizeStop?: RndResizeCallback;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    lockAspectRatio?: boolean | number;
    scale?: number;
  }

  export const Rnd: ComponentType<RndProps>;
}
