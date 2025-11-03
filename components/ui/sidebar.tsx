"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore } from "@/lib/store/ui-store";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: SidebarItem[];
  /** Optional callback for when a nav item is clicked (used to close mobile sheet) */
  onNavigate?: () => void;
}

export function Sidebar({
  items,
  className,
  onNavigate,
  ...props
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-border bg-sidebar",
        className
      )}
      {...props}
    >
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Primary navigation">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="flex items-center gap-3"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

export function MobileSidebar({ items }: { items: SidebarProps["items"] }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="right" className="w-64 p-0">
        {/* Hidden but accessible title to satisfy Radix Dialog a11y */}
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        </SheetHeader>

        <Sidebar
          items={items}
          onNavigate={() => setSidebarOpen(false)}
          className="border-0"
        />
      </SheetContent>
    </Sheet>
  );
}
