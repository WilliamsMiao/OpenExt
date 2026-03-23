/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    WORKSPACE_PATH: process.env.WORKSPACE_PATH || './workspace',
    OPENCLAW_API: process.env.OPENCLAW_API || 'http://localhost:18789',
  },
}

module.exports = nextConfig
