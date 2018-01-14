// @flow

import FS from 'fs'
import Path from 'path'
import { SFTPStream } from 'ssh2-streams'
import { SFTP_STATUS_CODE as STATUS_CODE } from 'ssh2'

import type { User, Config } from './types'

export default class SFTPClient {
  config: Config
  user: User
  stream: $FlowFixMe

  userRoot: ?string
  clientHandleNext: number
  clientHandlesMap: Map<number, number>
  // TODO: Close all fds on connection close
  constructor(config: Config, user: User, stream: $FlowFixMe) {
    this.config = config
    this.user = user
    this.stream = stream

    this.userRoot = null
    this.clientHandleNext = 1
    this.clientHandlesMap = new Map()

    function reject(req) {
      stream.status(req, STATUS_CODE.FAILURE)
    }

    stream.on('OPEN', (req, filePath, flags, attrs) => {
      // TODO: If file doesn't exist set the provided attrs?
      this.resolvePath(filePath)
        .then(resolved => {
          if (!resolved) {
            reject(req)
            return
          }
          FS.open(resolved, SFTPStream.flagsToString(flags), attrs.mode, (err, fd) => {
            if (err) {
              config.handleError(err)
              reject(req)
            } else {
              const handle = new Buffer(4)
              handle.write(this.generateClientHandle(fd).toString())
              stream.handle(req, handle)
            }
          })
        })
        .catch(error => {
          config.handleError(error)
          reject(req)
        })
    })
    stream.on('READ', (req, handle, offset, length) => {
      const fd = this.getRealHandle(handle)
      if (!fd) {
        reject(req)
        return
      }
      // TODO: Make sure length is not too big
      const contents = new Buffer(length)
      FS.read(fd, contents, 0, length, offset, err => {
        if (err) {
          config.handleError(err)
          reject(req)
        } else {
          stream.data(req, contents)
        }
      })
    })
    stream.on('WRITE', (req, handle, offset, data) => {
      const fd = this.getRealHandle(handle)
      if (!fd) {
        reject(req)
        return
      }
      FS.write(fd, data, 0, data.length, offset, err => {
        if (err) {
          config.handleError(err)
          reject(req)
        } else {
          stream.status(req, STATUS_CODE.OK)
        }
      })
    })
    stream.on('FSTAT', (req, handle) => {
      const fd = this.getRealHandle(handle)
      if (!fd) {
        reject(req)
        return
      }
      FS.fstat(fd, function(err, stats) {
        if (err) {
          config.handleError(err)
          reject(req)
        } else {
          stream.attrs(req, stats)
        }
      })
    })
    // FSETSTAT
    stream.on('CLOSE', (req, handle) => {
      const fd = this.getRealHandle(handle)
      if (!fd) {
        stream.status(req, STATUS_CODE.OK)
        return
      }
      FS.close(fd, err => {
        if (err) {
          config.handleError(err)
        }
        stream.status(req, STATUS_CODE.OK)
      })
    })
    // OPENDIR
    // READDIR
    // LSTAT
    // STAT
    // REMOVE
    // RMDIR
    // REALPATH
    // READLINK
    // SETSTAT
    // MKDIR
    // RENAME
    // SYMLINK
  }
  async getUserRoot(): Promise<string> {
    let userRoot = this.userRoot
    if (!userRoot) {
      userRoot = await this.config.getUserRootDirectory(this.user)
      if (userRoot !== '/' && userRoot.endsWith('/')) {
        userRoot = userRoot.slice(0, -1)
      }
      this.userRoot = userRoot
    }
    return userRoot
  }
  async resolvePath(path: string): Promise<?string> {
    const userRoot = await this.getUserRoot()
    const resolved = Path.resolve(userRoot, path)
    if (userRoot !== resolved && !resolved.startsWith(Path.join(userRoot, '/'))) {
      let allowEscaping = this.config.allowEscapingRoot
      if (allowEscaping && this.config.shouldAllowEscapingRoot) {
        allowEscaping = await this.config.shouldAllowEscapingRoot(this.user)
      }
      if (!allowEscaping) {
        return null
      }
    }
    return resolved
  }
  generateClientHandle(realHandle: number): number {
    const clientHandle = this.clientHandleNext++
    this.clientHandlesMap.set(clientHandle, realHandle)
    return clientHandle
  }
  getRealHandle(givenHandle: Buffer): ?number {
    const clientHandle = parseInt(givenHandle, 10)
    return this.clientHandlesMap.get(clientHandle)
  }
  releaseClientHandle(givenHandle: Buffer): ?number {
    const clientHandle = parseInt(givenHandle, 10)
    this.clientHandlesMap.delete(clientHandle)
  }
}
