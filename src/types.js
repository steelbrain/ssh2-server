// @flow

export type User = string | number
export type ServerKey = {|
  key: Buffer | string,
  passphrase?: string,
|}
export type AuthContextKey = {|
  algo: string,
  data: Buffer,
  sigAlgo?: string,
  blob?: Buffer,
  signature?: Buffer,
|}
export type AuthContextPrompt = {| prompt: string, echo: boolean |}
export type AuthContextAccept = (userId: User) => void
export type AuthContextReject =
  | (() => void)
  | ((authMethodsLeft: Array<string>) => void)
  | ((authMethodsLeft: Array<string>, isPartialSuccess: boolean) => void)
export type AuthContext =
  | {|
      method: 'none',
      accept: AuthContextAccept,
      reject: AuthContextReject,
      user?: string,
      username?: string,
    |}
  | {|
      method: 'password',
      accept: AuthContextAccept,
      reject: AuthContextReject,
      password: string,
      user?: string,
      username?: string,
    |}
  | {|
      method: 'publickey',
      accept: AuthContextAccept,
      reject: AuthContextReject,
      key: AuthContextKey,
      user?: string,
      username?: string,
    |}
  | {|
      method: 'keyboard-interactive',
      accept: AuthContextAccept,
      reject: AuthContextReject,
      submethods: Array<string>,
      prompt:
        | ((prompts: Array<AuthContextPrompt>, callback: (err?: Error, responses: Array<string>) => void) => boolean)
        | ((
            prompts: Array<AuthContextPrompt>,
            title: string,
            callback: (err?: Error, responses: Array<string>) => void,
          ) => boolean)
        | ((
            prompts: Array<AuthContextPrompt>,
            title: string,
            instructions: string,
            callback: (err?: Error, responses: Array<string>) => void,
          ) => boolean),
    |}
export type Config = {|
  server?: {
    ident?: string,
    // name of the ssh server
    // .. pass another options you want to pass to the ssh2 server
  },
  authenticate(authContext: AuthContext): Promise<void>,
  handleError(error: Error): void,

  allowSFTP?: boolean, // default is false
  allowShell?: boolean, // default is false
  allowExec?: boolean, // default is false
  allowWrites?: boolean, // default is false
  allowEscapingRoot?: boolean, // default is false
  userShell?: string, // defaults to process.env.SHELL

  shouldAllowSFTP?: (user: User) => Promise<boolean>,
  shouldAllowShell?: (user: User) => Promise<boolean>,
  shouldAllowExec?: (user: User) => Promise<boolean>,
  shouldAllowWrite?: (user: User, filePath: string) => Promise<boolean>,
  shouldAllowEscapingRoot?: (user: User) => Promise<boolean>,

  getUserShell?: (user: User) => Promise<string>,
  getUserRootDirectory: (user: User) => Promise<string>,
|}

export type ListenOptions = {|
  port?: number,
  host?: string,
  path?: string,
  backlog?: number,
  exclusive?: boolean,
|}
