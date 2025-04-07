"use client";

import * as React from "react";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = React.forwardRef(
  ({ className, direction = "horizontal", onLayout, ...props }, ref) => (
    <ResizablePrimitive.PanelGroup
      ref={ref}
      direction={direction}
      className={cn(
        "flex h-full w-full data-[direction=vertical]:flex-col",
        className
      )}
      onLayout={onLayout}
      {...props}
    />
  )
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

const ResizablePanel = React.forwardRef(
  ({ className, defaultSize = 100, minSize = 20, ...props }, ref) => (
    <ResizablePrimitive.Panel
      ref={ref}
      defaultSize={defaultSize}
      minSize={minSize}
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  )
);
ResizablePanel.displayName = "ResizablePanel";

const ResizableHandle = React.forwardRef(
  ({ withHandle, className, direction = "horizontal", ...props }, ref) => (
    <ResizablePrimitive.PanelResizeHandle
      ref={ref}
      className={cn(
        "relative flex w-px items-center justify-center bg-border transition-colors duration-150 hover:bg-primary/50 active:bg-primary",
        direction === "vertical"
          ? "h-px w-full cursor-row-resize"
          : "h-full w-px cursor-col-resize",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "rounded-sm border bg-background text-muted-foreground",
            direction === "vertical"
              ? "h-4 w-8 flex items-center justify-center"
              : "h-8 w-4 flex items-center justify-center"
          )}
        >
          <DragHandleDots2Icon className="h-3 w-3" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
