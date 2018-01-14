// @flow

// eslint-disable-next-line import/prefer-default-export
export function genCallback<T>(resolve: (value: T) => void, reject: (error: Error) => void) {
  return function(err, res) {
    if (err) {
      reject(err)
    } else resolve(res)
  }
}
