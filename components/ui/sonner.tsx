"use client";

import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border border-emerald-100",
          title: "text-sm font-semibold",
          description: "text-sm",
        },
      }}
      {...props}
    />
  );
}
