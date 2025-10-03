# fastify-robots

A lightweight Fastify plugin that provides a robots.txt content.

## Installation

```bash
npm install fastify-robots
```

## Usage

Add it to your project with register and you are done!

```js
const fastify = require('fastify')({ logger: true })

// Register the plugin
await fastify.register(require('fastify-robots'))

// Start the server
await fastify.listen({ port: 3000 })

// Endpoint is now available at:
// GET http://localhost:3000/robots.txt
```

This will serve a default `robots.txt` with:
```
User-agent: *
Allow: /
```

You can also add custom configurations:
```js
const fastify = require('fastify')({ logger: true })

await fastify.register(require('fastify-robots'), {
  // Path to your custom robots.txt file
  filepath: './robots.txt',

  // File encoding (default: 'utf8')
  encoding: 'utf8',

  // Cache-Control max-age in seconds (default: 86400 = 24 hours)
  maxAge: 86400
})

await fastify.listen({ port: 3000 })
```

## License

[MIT License](https://github.com/leandroandrade/fastify-robots/blob/main/LICENSE/)
