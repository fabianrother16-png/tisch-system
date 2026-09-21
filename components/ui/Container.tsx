import type { ElementType, ReactNode } from "react";

export function Container({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag className={`mx-auto w-full max-w-content px-6 md:px-10 lg:px-16 ${className}`}>
      {children}
    </Tag>
  );
}
