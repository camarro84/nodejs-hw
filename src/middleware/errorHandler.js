export default function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Server error'
  if (req.log?.error) req.log.error(err)
  res.status(status).json({ message })
}
