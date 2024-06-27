export interface GlobalDirective {
  npm: string
  yarn: string
  pnpm: string
}

export interface ConfigReturnType {
  ignoreHiddenFiles: Boolean | undefined
  pathAlias:
    | {
        [key: string]: string
      }
    | undefined
  ignoreFileExt: string[]
  autoNextSuggest: Boolean | undefined
}
