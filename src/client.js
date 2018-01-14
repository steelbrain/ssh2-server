// @flow

import SSH from 'node-ssh'

async function main() {
  const client = new SSH()
  await client.connect({
    host: 'localhost',
    port: 8099,
    username: 'steelbrain',
    password: 'something',
  })
  console.log('connected')
  const contents = await client.getFile('/tmp/test-get', '/Users/steelbrain/projects/steelbrain/ssh2-server/.babelrc')
  console.log('contents', contents)
}
main().catch(e => console.error(e))
