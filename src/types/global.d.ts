// Type declarations for modules without TypeScript definitions

declare module 'drizzle-orm' {
  export * from 'drizzle-orm/index';
}

declare module 'drizzle-orm/neon-http' {
  export * from 'drizzle-orm/neon-http/index';
}

declare module 'drizzle-orm/pg-core' {
  export * from 'drizzle-orm/pg-core/index';
}

declare module 'drizzle-kit' {
  export * from 'drizzle-kit/index';
}

declare module 'next/server' {
  export * from 'next/dist/server/web/types';
  export { NextRequest, NextResponse } from 'next/dist/server/web/spec-extension/request';
}

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export type LucideIcon = FC<SVGProps<SVGSVGElement>>;
  export const RefreshCw: LucideIcon;
  export const Plus: LucideIcon;
  export const Globe: LucideIcon;
  export const Building2: LucideIcon;
  export const Users: LucideIcon;
  export const Tv: LucideIcon;
  export const Newspaper: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const X: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronsUpDown: LucideIcon;
  // Add other icons as needed
}

declare module '@mastra/core' {
  export const Mastra: any;
  export const createWorkflow: any;
}

declare module '@mastra/core/agent' {
  export const openaiAgent: any;
}

declare module '@mastra/core/workflows' {
  export const createWorkflow: any;
  export const step: any;
}