// @flow

import { Server } from 'ssh2'

import SSHClient from './sshclient'
import { genCallback } from './common'
import validateConfig from './validate-config'
import type { Config, ListenOptions } from './types'

class SSHServer {
  config: Config
  server: $FlowFixMe
  clients: Set<SSHClient>
  constructor(config: Config) {
    validateConfig(config)

    this.config = config
    this.server = new Server({ ...config.server }, client => {
      this.$handleClient(client).catch(config.handleError)
    })
    this.clients = new Set()
  }
  async $handleClient(connection: Object) {
    // TODO: Remove from clients on session end
    const client = new SSHClient(this.config, connection)
    this.clients.add(client)
  }
  async listen(options: ListenOptions): Promise<void> {
    await new Promise((resolve, reject) => {
      this.server.listen(options, genCallback(resolve, reject))
    })
  }
  dispose() {
    // TODO
  }
}

export default SSHServer

// TODO: Remove this test code
const fs = require('fs')

async function main() {
  const server = new SSHServer({
    server: {
      hostKeys: [fs.readFileSync(`${__dirname}/../test/id_rsa`)],
    },
    async authenticate(context) {
      if (context.password === 'something') {
        context.accept('steelbrain')
      }
    },
    async getUserRootDirectory() {
      return '/Users/steelbrain'
    },
    handleError(error) {
      console.error('Error encountered', error)
    },
  })
  await server.listen({
    port: 8099,
  })
}
main().catch(function(error) {
  console.error('error', error)
})
