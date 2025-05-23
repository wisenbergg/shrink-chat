// File: src/types/tailwindcss.d.ts
declare module "tailwindcss" {
  // Define a more specific Config type
  export interface Config {
    darkMode?: string | string[];
    content: string[];
    prefix?: string;
    theme?: {
      extend?: Record<string, unknown>;
      [key: string]: unknown;
    };
    plugins?: unknown[];
    [key: string]: unknown;
  }

  const defaultConfig: Config;
  export default defaultConfig;
}

declare module "tailwindcss-animate" {
  // Define a more specific plugin type
  const plugin: () => {
    handler: () => void;
  };
  export default plugin;
}
