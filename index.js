const fp = require('fastify-plugin')
const fs = require('node:fs/promises')
const path = require('node:path')

/**
 * Fastify plugin to serve robots.txt file
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 * @param {string} [options.filepath] - Path to custom robots.txt file
 * @param {string} [options.encoding='utf8'] - File encoding
 * @param {number} [options.maxAge=86400] - Cache-Control max-age in seconds
 */
async function fastifyRobots (fastify, options = {}) {
  const {
    filepath,
    encoding = 'utf8',
    maxAge = 86400
  } = options

  let payload = 'User-agent: *\nAllow: /\n'

  if (filepath) {
    let fullPath

    try {
      fullPath = path.resolve(filepath)
      payload = await fs.readFile(fullPath, { encoding })

      if (!payload || typeof payload !== 'string') {
        throw new Error('file content must be a non-empty string')
      }
    } catch (err) {
      throw new Error(`fastify-robots cannot load the file ${fullPath}: ${err.message}`)
    }
  }

  fastify.route({
    method: 'GET',
    url: '/robots.txt',
    schema: {
      summary: 'Returns robots.txt file content',
      response: {
        200: {
          type: 'string',
          description: 'Content of robots.txt file'
        }
      }
    },
    handler: async (req, reply) => {
      return reply
        .type('text/plain; charset=utf-8')
        .header('Cache-Control', `public, max-age=${maxAge}`)
        .send(payload)
    }
  })
}

module.exports = fp(fastifyRobots, {
  fastify: '5.x',
  name: 'fastify-robots'
})

module.exports.default = fastifyRobots
module.exports.fastifyRobots = fastifyRobots
