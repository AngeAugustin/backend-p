"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

type Handle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "left"
  | "right";

const HANDLES: Handle[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "left",
  "right",
];

const MIN_SIZE = 80;

function cursorFor(handle: Handle) {
  switch (handle) {
    case "top-left":
    case "bottom-right":
      return "nwse-resize";
    case "top-right":
    case "bottom-left":
      return "nesw-resize";
    default:
      return "ew-resize";
  }
}

export function ResizableImageView({
  node,
  selected,
  updateAttributes,
  editor,
  getPos,
}: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [liveSize, setLiveSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const width = liveSize?.width ?? (node.attrs.width as number | null);
  const align = (node.attrs.align as string) || "center";
  const editable = editor.isEditable;

  const selectImage = useCallback(() => {
    const pos = getPos();
    if (typeof pos === "number") {
      editor.chain().setNodeSelection(pos).run();
    }
  }, [editor, getPos]);

  const onResizeStart = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>, handle: Handle) => {
      if (!editable) return;
      event.preventDefault();
      event.stopPropagation();
      selectImage();

      const img = imgRef.current;
      if (!img) return;

      const startX = event.clientX;
      const startWidth = img.offsetWidth;
      const startHeight = img.offsetHeight;
      const ratio = startWidth > 0 ? startHeight / startWidth : 1;

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const onMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const direction =
          handle.includes("left") || handle === "left" ? -1 : 1;
        const nextWidth = Math.max(MIN_SIZE, startWidth + deltaX * direction);
        const nextHeight = Math.max(MIN_SIZE, Math.round(nextWidth * ratio));
        setLiveSize({ width: Math.round(nextWidth), height: nextHeight });
      };

      const onUp = (upEvent: PointerEvent) => {
        target.releasePointerCapture(upEvent.pointerId);
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);

        const imgEl = imgRef.current;
        if (!imgEl) {
          setLiveSize(null);
          return;
        }

        const finalWidth = Math.round(imgEl.offsetWidth);
        const finalHeight = Math.round(imgEl.offsetHeight);
        setLiveSize(null);
        updateAttributes({
          width: finalWidth,
          height: finalHeight,
        });
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [editable, selectImage, updateAttributes]
  );

  useEffect(() => {
    setLiveSize(null);
  }, [node.attrs.width, node.attrs.height]);

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        "resizable-image-node my-3 flex w-full",
        align === "left" && "justify-start",
        align === "right" && "justify-end",
        (align === "center" || !align) && "justify-center"
      )}
      data-drag-handle
    >
      <div
        className={cn(
          "resizable-image-frame relative inline-block max-w-full leading-none",
          selected && "is-selected"
        )}
        onClick={selectImage}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) || ""}
          title={(node.attrs.title as string) || undefined}
          data-align={align}
          draggable={false}
          className="block h-auto max-w-full rounded-xl border border-border"
          style={{
            width: width ? `${width}px` : undefined,
            height: liveSize ? `${liveSize.height}px` : "auto",
          }}
        />

        {editable && selected
          ? HANDLES.map((handle) => (
              <span
                key={handle}
                role="presentation"
                data-resize-handle={handle}
                className={cn(
                  "absolute z-10 box-border rounded-full border-2 border-white bg-primary shadow-md",
                  handle === "top-left" &&
                    "left-0 top-0 size-3.5 -translate-x-1/2 -translate-y-1/2",
                  handle === "top-right" &&
                    "right-0 top-0 size-3.5 translate-x-1/2 -translate-y-1/2",
                  handle === "bottom-left" &&
                    "bottom-0 left-0 size-3.5 -translate-x-1/2 translate-y-1/2",
                  handle === "bottom-right" &&
                    "bottom-0 right-0 size-3.5 translate-x-1/2 translate-y-1/2",
                  handle === "left" &&
                    "left-0 top-1/2 h-8 w-2.5 -translate-x-1/2 -translate-y-1/2",
                  handle === "right" &&
                    "right-0 top-1/2 h-8 w-2.5 translate-x-1/2 -translate-y-1/2"
                )}
                style={{ cursor: cursorFor(handle) }}
                onPointerDown={(event) => onResizeStart(event, handle)}
              />
            ))
          : null}
      </div>
    </NodeViewWrapper>
  );
}
