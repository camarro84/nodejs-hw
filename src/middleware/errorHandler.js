import createHttpError from 'http-errors'

export const errorHandler = (err, req, res, _next) => {
  if (req.log?.error) {
    req.log.error(err)
  }

  if (err instanceof createHttpError.HttpError) {
    return res.status(err.status).json({ message: err.message })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message })
  }

  const status = err.status || err.statusCode || 500
  const message = status === 500 ? 'Internal Server Error' : err.message

  res.status(status).json({ message })
}
