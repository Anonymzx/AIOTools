declare module "papaparse" {
  export interface PapaParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface PapaParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  }

  export interface PapaParseResult<T = Record<string, string>> {
    data: T[];
    errors: PapaParseError[];
    meta: PapaParseMeta;
  }

  export interface PapaParseConfig {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    preview?: number;
  }

  export interface PapaUnparseConfig {
    delimiter?: string;
    header?: boolean;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
  }

  export function parse<T = Record<string, string>>(
    input: string,
    config?: PapaParseConfig,
  ): PapaParseResult<T>;

  export function unparse(
    data: Record<string, unknown>[] | { fields: string[]; data: unknown[][] },
    config?: PapaUnparseConfig,
  ): string;

  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
  };
  export default Papa;
}
