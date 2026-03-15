"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = { label: string; href?: string };

type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
};

export function Breadcrumbs({ items: propItems }: BreadcrumbsProps) {
  const pathname = usePathname();
  const items = propItems ?? pathname.split("/").filter(Boolean).map((segment, i, arr) => {
    const href = "/" + arr.slice(0, i + 1).join("/");
    const label = segment.length > 10 && /^[0-9a-f-]{36}$/i.test(segment) ? "…" : decodeURIComponent(segment);
    return { label, href: i < arr.length - 1 ? href : undefined };
  });
  if (items.length === 0) return null;
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
