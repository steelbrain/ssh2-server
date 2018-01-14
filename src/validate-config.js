// @flow

import invariant from 'assert'
import type { Config } from './types'

const configTogglesAndCallbackPairs = [
  ['allowSFTP', 'shouldAllowSFTP'],
  ['allowShell', 'shouldAllowShell'],
  ['allowExec', 'shouldAllowExec'],
  ['allowWrites', 'shouldAllowWrite'],
  ['allowEscapingRoot', 'shouldAllowEscapingRoot'],
]
const configTypes = [
  ['server', ['object']],
  ['authenticate', ['function']],
  ['handleError', ['function']],
  ['userShell', ['undefined', 'string']],
  ['getUserShell', ['undefined', 'function']],
  ['getUserRootDirectory', ['function']],
]

export default function validateConfig(config: Config): void {
  invariant(config && typeof config === 'object', 'config must be an object')

  configTypes.forEach(([name, allowedTypes]) => {
    invariant(
      allowedTypes.includes(typeof config[name]) || (typeof config[name] === 'object' && !config[name]),
      `config.${name} must be one of ${allowedTypes.join(', ')}`,
    )
  })

  configTogglesAndCallbackPairs.forEach(([toggle, callback]) => {
    invariant(['undefined', 'boolean'].includes(typeof config[toggle]), `config.${toggle} must be undefined or boolean`)
    if (!config[toggle]) {
      invariant(
        typeof config[callback] === 'undefined',
        `config.${callback} must not be specified when config.${toggle} is false`,
      )
    } else {
      invariant(
        ['undefined', 'function'].includes(typeof config[callback]),
        `config.${callback} must be undefined or function when config.${toggle} is true`,
      )
    }
  })
}
