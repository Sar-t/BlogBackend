export const errorHandler = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);       // ADD THIS
  console.error("🔥 STACK:", err.stack); // ADD THIS

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
};
