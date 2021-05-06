declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PRISMIC_API_ENDPOINT: string;
  }
}
