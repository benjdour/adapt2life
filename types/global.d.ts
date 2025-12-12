export type BlogTranslationPayload = {
  articleKey: string;
  slugs: Record<string, string>;
};

declare global {
  interface Window {
    __A2L_BLOG_TRANSLATIONS?: BlogTranslationPayload;
  }
}

export {};
