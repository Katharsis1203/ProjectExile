export type UnknownRecord = Record<string, unknown>;

export class ContentValidationError extends Error {
  constructor(source: string, message: string) {
    super(`Invalid content in ${source}: ${message}`);
    this.name = "ContentValidationError";
  }
}

export function fail(source: string, message: string): never {
  throw new ContentValidationError(source, message);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function expectRecord(value: unknown, source: string, field: string): UnknownRecord {
  return isRecord(value) ? value : fail(source, `"${field}" must be an object.`);
}

export function expectArray(value: unknown, source: string, field: string): unknown[] {
  return Array.isArray(value) ? value : fail(source, `"${field}" must be an array.`);
}

export function expectString(value: unknown, source: string, field: string): string {
  return typeof value === "string" && value.length > 0
    ? value
    : fail(source, `"${field}" must be a non-empty string.`);
}

export function expectFiniteNumber(value: unknown, source: string, field: string): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fail(source, `"${field}" must be a finite number.`);
}

export function expectOptionalString(value: unknown, source: string, field: string): void {
  if (value !== undefined && value !== null && typeof value !== "string") {
    fail(source, `"${field}" must be a string or null when provided.`);
  }
}

export function expectOptionalBoolean(value: unknown, source: string, field: string): void {
  if (value !== undefined && typeof value !== "boolean") {
    fail(source, `"${field}" must be a boolean when provided.`);
  }
}

export function expectOptionalEnum(
  value: unknown,
  supportedValues: ReadonlySet<string>,
  source: string,
  field: string,
): void {
  if (value !== undefined && (typeof value !== "string" || !supportedValues.has(value))) {
    fail(source, `"${field}" must be one of: ${[...supportedValues].join(", ")}.`);
  }
}

export function validateStringArray(value: unknown, source: string, field: string): void {
  expectArray(value, source, field).forEach((item, index) => {
    expectString(item, source, `${field}[${index}]`);
  });
}
