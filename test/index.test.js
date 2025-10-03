const { test } = require('node:test')
const fastifyRobots = require('..')
const Fastify = require('fastify')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')

test('fastify-robots is correctly defined', async (t) => {
  const fastify = Fastify()
  t.after(async () => { await fastify.close() })

  await fastify.register(fastifyRobots)

  await fastify.ready()
})

test('fastify-robots should return robots.txt with right content and headers', async (t) => {
  const fastify = Fastify()
  t.after(async () => { await fastify.close() })

  await fastify.register(fastifyRobots)

  const res = await fastify.inject({
    method: 'GET',
    url: '/robots.txt'
  })

  t.assert.strictEqual(res.statusCode, 200)
  t.assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8')
  t.assert.strictEqual(res.headers['cache-control'], 'public, max-age=86400')
  t.assert.strictEqual(res.payload, 'User-agent: *\nAllow: /\n')
})

test('fastify-robots should allow custom maxAge', async (t) => {
  const fastify = Fastify()
  t.after(async () => { await fastify.close() })

  await fastify.register(fastifyRobots, {
    maxAge: 3600
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/robots.txt'
  })

  t.assert.strictEqual(res.statusCode, 200)
  t.assert.strictEqual(res.headers['cache-control'], 'public, max-age=3600')
})

test('fastify-robots should load cusutom file content', async (t) => {
  const fastify = Fastify()
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'robots-test-'))

  t.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
    await fastify.close()
  })

  const tmpFile = path.join(tmpDir, 'robots.txt')
  const customContent = 'User-agent: Googlebot\nDisallow: /admin/\n'
  await fs.writeFile(tmpFile, customContent, 'utf8')

  await fastify.register(fastifyRobots, {
    filepath: tmpFile
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/robots.txt'
  })

  t.assert.strictEqual(res.statusCode, 200)
  t.assert.strictEqual(res.payload, customContent)
})

test('fastify-robots should use custom encoding', async (t) => {
  const fastify = Fastify()
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'robots-test-'))

  t.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
    await fastify.close()
  })

  const encoding = 'base64'
  const tmpFile = path.join(tmpDir, 'robots.txt')
  const customContent = 'User-agent: *\nDisallow: /privado/\n'

  const base64Content = Buffer.from(customContent, 'utf8').toString(encoding)
  await fs.writeFile(tmpFile, base64Content, encoding)

  await fastify.register(fastifyRobots, {
    filepath: tmpFile,
    encoding
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/robots.txt'
  })

  t.assert.strictEqual(res.statusCode, 200)
  t.assert.strictEqual(res.payload, base64Content)
})

test('fastify-robots throw error when file does not exists', async (t) => {
  const fastify = Fastify()
  t.after(async () => { await fastify.close() })

  await t.assert.rejects(
    async () => {
      await fastify.register(fastifyRobots, {
        filepath: '/path/does/not/exists/robots.txt'
      })
    },
    (err) => {
      t.assert.match(err.message, /fastify-robots cannot load the file/)
      t.assert.match(err.message, /ENOENT/)
      return true
    }
  )
})

test('fastify-robots should throw error when does not has permission to read', async (t) => {
  // Pula teste no Windows (permissões diferentes)
  if (process.platform === 'win32') {
    t.skip('Test skipped on Windows')
    return
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'robots-test-'))
  const tmpFile = path.join(tmpDir, 'robots.txt')

  const fastify = Fastify()
  t.after(async () => {
    await fs.chmod(tmpFile, 0o644) // restore permission to delete
    await fs.rm(tmpDir, { recursive: true, force: true })
    await fastify.close()
  })

  await fs.writeFile(tmpFile, 'User-agent: *\n', 'utf8')
  await fs.chmod(tmpFile, 0o000)

  await t.assert.rejects(
    async () => {
      await fastify.register(fastifyRobots, {
        filepath: tmpFile
      })
    },
    (err) => {
      t.assert.match(err.message, /fastify-robots cannot load the file/)
      t.assert.match(err.message, /EACCES/)
      return true
    }
  )
})

test('fastify-robots should throw error when file is empty', async (t) => {
  const fastify = Fastify()
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'robots-test-'))

  t.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
    await fastify.close()
  })

  const tmpFile = path.join(tmpDir, 'robots.txt')
  await fs.writeFile(tmpFile, '', 'utf8')

  await t.assert.rejects(
    async () => {
      await fastify.register(fastifyRobots, {
        filepath: tmpFile
      })
    },
    (err) => {
      t.assert.match(err.message, /file content must be a non-empty string/)
      return true
    }
  )
})
