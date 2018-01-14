// @flow

import invariant from 'assert'

import type { User, Config, AuthContext } from './types'

export default class SSHClient {
  user: ?User
  config: Config
  connection: $FlowFixMe
  constructor(config: Config, connection: $FlowFixMe) {
    this.config = config
    this.connection = connection

    connection.on('authentication', authContext => {
      this.$handleAuthentication(authContext).catch(config.handleError)
    })
  }
  async $handleAuthentication(authContext: AuthContext) {
    let status = null
    const authAccept: Function = authContext.accept
    const authReject: Function = authContext.reject

    if (authContext.method === 'none') {
      // TODO: Why is this necessary?
      authReject.call(authContext)
      return
    }

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
