import pinoHttp from 'pino-http'

export default pinoHttp({
  transport: { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
})
