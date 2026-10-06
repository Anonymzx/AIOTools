declare module "gifenc" {
  export interface GIFWriteFrameOptions {
    palette?: number[][];
    delay?: number;
    repeat?: number;
    transparent?: boolean | number;
    first?: boolean;
  }

  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array | number[],
      width: number,
      height: number,
      opts?: GIFWriteFrameOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    reset(): void;
  }

  export function GIFEncoder(opts?: { autoFirstFrame?: boolean }): GIFEncoderInstance;
  export function quantize(
    rgba: Uint8ClampedArray | Uint8Array | number[],
    maxColors: number,
    opts?: unknown,
  ): number[][];
  export function applyPalette(
    rgba: Uint8ClampedArray | Uint8Array | number[],
    palette: number[][],
    format?: string,
  ): Uint8Array;
}
