// Zod validation middleware factory
// Usage: router.post("/", validate(schema), controller)
// Schema shape: z.object({ body: z.object({...}), query: z.object({...}), params: z.object({...}) })

import { ZodError } from "zod";

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues || [];
      const messages = issues.map((e) => `${(e.path || []).join(".")}: ${e.message}`).join("; ");
      const err = new Error(messages || "Validation failed");
      err.statusCode = 400;
      err.name = "ZodValidationError";
      return next(err);
    }
    next(error);
  }
};

export default validate;
