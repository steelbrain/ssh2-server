// @flow

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
export type AuthContext =
  | {|
      method: 'password' | 'publickey' | 'keyboard-interactive',
      accept(userId: string | number): void,
      reject:
        | (() => void)
        | ((authMethodsLeft: Array<string>) => void)
        | ((authMethodsLeft: Array<string>, isPartialSuccess: boolean) => void),
    |}
  | {|
      method: 'password',
      accept(userId: string | number): void,
      reject:
        | (() => void)
        | ((authMethodsLeft: Array<string>) => void)
        | ((authMethodsLeft: Array<string>, isPartialSuccess: boolean) => void),
      password: string,
    |}
  | {|
      method: 'publickey',
      accept(userId: string | number): void,
      reject:
        | (() => void)
        | ((authMethodsLeft: Array<string>) => void)
        | ((authMethodsLeft: Array<string>, isPartialSuccess: boolean) => void),
      key: AuthContextKey,
    |}
  | {|
      method: 'keyboard-interactive',
      accept(userId: string | number): void,
      reject:
        | (() => void)
        | ((authMethodsLeft: Array<string>) => void)
        | ((authMethodsLeft: Array<string>, isPartialSuccess: boolean) => void),
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
  server: {
    ident?: string,
    // name of the ssh server
    // .. pass another options you want to pass to the ssh2 server
  },
  authenticate(authContext: AuthContext): Promise<void>,
|}
