type OfficeParserResult = {
  to?: (destination: "text", config?: Record<string, unknown>) => Promise<{ value?: unknown }>;
  toText?: () => string;
};

let parserPromise: Promise<(buffer: Buffer) => Promise<OfficeParserResult | string>> | undefined;

async function loadOfficeParser() {
  if (!parserPromise) {
    parserPromise = import("officeparser").then((module: any) => {
      const parser = module.parseOffice || module.default?.parseOffice;
      if (typeof parser !== "function") {
        throw new Error("officeparser did not expose a parseOffice function");
      }
      return parser;
    });
  }
  return parserPromise;
}

export async function extractTextFromOfficeDocument(buffer: Buffer): Promise<string> {
  const parser = await loadOfficeParser();
  const result = await parser(buffer);

  if (typeof result === "string") {
    return result.trim();
  }

  if (typeof result.to === "function") {
    const rendered = await result.to("text", { includeImages: false });
    if (typeof rendered.value === "string") {
      return rendered.value.trim();
    }
  }

  if (typeof result.toText === "function") {
    return result.toText().trim();
  }

  throw new Error("officeparser returned no text representation");
}
