interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_PREVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
