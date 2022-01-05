// https://github.com/typicode/json-server
// 命令行模式可以 --watch db.json
// POST 只能新增不能用于查询
const path =  require('path')
const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router(path.resolve(__dirname, 'db.json'))
const middlewares = jsonServer.defaults({
  watch: true,
})

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares)

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser)
server.use((req: any, res: any, next: any) => {
  if (req.method === 'POST') {
    req.body.createdAt = Date.now()
  }
  // Continue to JSON Server router
  next()
})

// Use default router
server.use(router)
server.listen(3030, () => {
  console.log('JSON Server is running')
})