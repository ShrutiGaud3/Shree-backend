// Async handler wrapper to avoid try/catch in every controller
// Passes errors to Express error middleware automatically

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};