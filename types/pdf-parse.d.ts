declare module "pdf-parse/lib/pdf-parse.js" {
  function pdf(
    dataBuffer: Buffer,
    options?: { max?: number }
  ): Promise<{ text: string; numpages: number; info: unknown; metadata: unknown }>;
  export default pdf;
}
