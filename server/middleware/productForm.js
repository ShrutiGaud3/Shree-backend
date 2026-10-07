// Normalizes product bodies sent as multipart/form-data (all text fields arrive
// as strings) into the types expected by the zod product schemas.
// JSON fields (variants, toysFields, jewelleryFields, tags, ...) may be sent
// either as JSON strings or, for string arrays, as comma-separated lists.

const NUMERIC_FIELDS = ["mrp", "price", "stock", "gstRate", "weightGrams"];
const BOOLEAN_FIELDS = ["isActive", "isFeatured", "isReturnable", "batteryRequired"];
const JSON_FIELDS = [
  "tags",
  "variants",
  "toysFields",
  "jewelleryFields",
  "safetyCertifications",
  "removeImages",
];

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return value;
};

const parseJsonField = (value) => {
  if (value === undefined || typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall back to comma-separated list (for string arrays like tags)
    if (trimmed.includes(",")) return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    return value;
  }
};

export const normalizeProductBody = (req, res, next) => {
  try {
    const body = req.body || {};

    for (const field of NUMERIC_FIELDS) {
      if (body[field] !== undefined && body[field] !== "") {
        const num = Number(body[field]);
        if (!Number.isNaN(num)) body[field] = num;
      }
    }

    for (const field of BOOLEAN_FIELDS) {
      if (body[field] !== undefined) body[field] = toBoolean(body[field]);
    }

    for (const field of JSON_FIELDS) {
      if (body[field] !== undefined) body[field] = parseJsonField(body[field]);
    }

    // Nested category fields may arrive flattened or nested — support both
    if (body.toysFields && typeof body.toysFields === "object") {
      if (body.toysFields.batteryRequired !== undefined) {
        body.toysFields.batteryRequired = toBoolean(body.toysFields.batteryRequired);
      }
    }

    req.body = body;
    next();
  } catch (error) {
    const err = new Error("Invalid product form data");
    err.statusCode = 400;
    next(err);
  }
};
