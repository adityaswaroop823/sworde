#!/usr/bin/env node
const { run } = require('../lib/cli.js')

run().catch((err) => {
  console.error('\n✖ Sworde failed:', err.message || err)
  process.exit(1)
})
