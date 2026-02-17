export type Attr = string | number | boolean;
export type Attrs = Record<string, Attr>;

export interface SpanStart {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  timestamp: number;
  attributes?: Attrs;
}
export interface SpanEnd {
  traceId: string;
  spanId: string;
  timestamp: number;
  attributes?: Attrs;
}

export interface Observer {
  onSpanStart?: (span: SpanStart) => void;
  onSpanEnd?: (span: SpanEnd) => void;
}
