"use client";
import * as React from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Dropdown = DM.Root;
export const DropdownTrigger = DM.Trigger;
export function DropdownContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content sideOffset={8} className={cn("z-[90] min-w-[220px] overflow-hidden rounded-2xl border bg-white p-1.5 shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2", className)} {...props} />
    </DM.Portal>
  );
}
export function DropdownItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof DM.Item>) {
  return <DM.Item className={cn("flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-secondary [&_svg]:size-4 [&_svg]:text-muted-foreground", className)} {...props} />;
}
export const DropdownSeparator = () => <DM.Separator className="my-1 h-px bg-border" />;
export const DropdownLabel = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof DM.Label>) => <DM.Label className={cn("px-3 py-1.5 text-xs font-medium text-muted-foreground", className)} {...props} />;
