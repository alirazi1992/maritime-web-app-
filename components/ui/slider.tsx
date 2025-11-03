"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

type RootProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RootProps
>(({ className, ...props }, ref) => {
  // Accessible label: if consumer didn't provide aria-label/labelledby, inject a hidden one
  const labelId = React.useId();
  const hasA11yLabel =
    "aria-label" in props ||
    "aria-labelledby" in props ||
    "aria-describedby" in props;

  // Determine number of thumbs from value/defaultValue arrays (Radix uses arrays)
  const thumbCount = Math.max(
    1,
    Array.isArray((props as any).value) ? (props as any).value.length : 0,
    Array.isArray((props as any).defaultValue)
      ? (props as any).defaultValue.length
      : 0
  );

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        // container
        "relative flex w-full touch-none select-none items-center",
        // vertical support
        "data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-2",
        className
      )}
      // if no label provided, wire up a hidden one
      aria-labelledby={
        !hasA11yLabel ? labelId : (props as any)["aria-labelledby"]
      }
      {...props}
    >
      {!hasA11yLabel && (
        <VisuallyHidden>
          <span id={labelId}>Slider</span>
        </VisuallyHidden>
      )}

      <SliderPrimitive.Track
        className={cn(
          "relative w-full grow overflow-hidden rounded-full bg-secondary",
          "h-2 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute bg-primary",
            "h-full data-[orientation=vertical]:w-full",
            "data-[orientation=vertical]:left-0"
          )}
        />
      </SliderPrimitive.Track>

      {/* Render as many thumbs as needed */}
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block h-5 w-5 rounded-full border-2 border-primary bg-background",
            "ring-offset-background transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
