import * as React from "react";
import { cn } from "@/lib/utils";

type AlertDialogProps = { children: React.ReactNode };

export function AlertDialog({ children }: AlertDialogProps) {
  return <>{children}</>;
}

type AlertDialogTriggerProps = {
  asChild?: boolean;
  children: React.ReactElement;
};

export function AlertDialogTrigger({ children }: AlertDialogTriggerProps) {
  return children;
}

type AlertDialogContentProps = React.HTMLAttributes<HTMLDivElement>;

export function AlertDialogContent({ className, ...props }: AlertDialogContentProps) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}
      {...props}
    />
  );
}

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex gap-2 justify-end", className)} {...props} />;
}

export function AlertDialogCancel(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="h-9 rounded-md border px-3 text-sm" {...props} />;
}

export function AlertDialogAction(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="h-9 rounded-md bg-destructive px-3 text-sm text-destructive-foreground"
      {...props}
    />
  );
}
