// @flow

import invariant from 'assert'

import SFTPClient from './sftpclient'
import type { User, Config, AuthContext } from './types'

export default class SSHClient {
  user: ?User
  config: Config
  connection: $FlowFixMe
  constructor(config: Config, connection: $FlowFixMe) {
    this.config = config
    this.connection = connection

    connection.on('authentication', authContext => {
      this.$handleAuthentication(authContext).catch(this.config.handleError)
    })
    connection.on('session', accept => {
      // TODO: Limit max active sessions?
      this.$handleSession(accept).catch(this.config.handleError)
    })
  }

  // TODO: rejectSession()s
  async $handleSession(acceptSession: () => $FlowFixMe): Promise<void> {
    const session = acceptSession()
    session.on('sftp', (accept, reject) => {
      this.$handleSFTP(accept, reject).catch(this.config.handleError)
    })
    session.on('pty', () => {
      console.log('got pty')
    })
    session.on('exec', () => {
      console.log('got exec')
    })
    session.on('shell', () => {
      console.log('got shell')
    })
  }
  async $handleSFTP(accept: () => $FlowFixMe, reject: () => void): Promise<void> {
    const user = this.user
    if (!user || !this.config.allowSFTP) {
      reject()
      return
    }

    let allowed = true
    if (this.config.shouldAllowSFTP) {
      allowed = await this.config.shouldAllowSFTP(user)
    }
    if (!allowed) {
      reject()
      return
    }
    const client = new SFTPClient(this.config, user, accept())
    // TODO: ref this client somewhere
    console.log('client', client.user)
  }
  async $handleAuthentication(authContext: AuthContext) {
    let status = null
    const authAccept: Function = authContext.accept
    const authReject: Function = authContext.reject

    // eslint-disable-next-line no-param-reassign
    authContext.accept = (user: User) => {
      invariant(['number', 'string'].includes(typeof user), 'accept() expects parameter 1 to be a string or number')
      invariant(typeof user !== 'string' || user.length, 'accept() expects parameter 1 to be non-empty')

      if (this.user) {
        throw new Error('Cannot call accept() more than once')
      }
      status = 'accepted'
      this.user = user
      authAccept.call(authContext)
    }
    // eslint-disable-next-line no-param-reassign
    authContext.reject = (...args) => {
      if (status) {
        throw new Error(`Cannot call reject() more than once`)
      }
      status = 'rejected'
      authReject.apply(authContext, args)
    }
    await this.config.authenticate(authContext)
    if (!this.user && !status) {
      authReject.call(authContext)
    }
  }
}
