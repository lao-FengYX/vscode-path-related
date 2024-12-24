export interface GlobalDirective {
  npm: string
  yarn: string
  pnpm: string
}

export interface ConfigReturnType {
  /**
   * Whether to enable the feature of ignoring hidden files.
   */
  ignoreHiddenFiles: Boolean | undefined
  /**
   * path alias mapping
   */
  pathAlias:
    | {
        [key: string]: string
      }
    | undefined
  /**
   * Whether to enable the feature of ignoring files with certain extensions.
   */
  ignoreFileExt: string[]
  /**
   * Whether to enable the feature of automatically jumping to the next suggestion when the current suggestion is selected.
   */
  autoNextSuggest: Boolean | undefined
  /**
   * Jump Mode
   */
  jumpRecognition: 'Alias Path' | 'Alias Path And node_modules' | 'All Path'
  /**
   * a list of ellipsis extensions is allowed eg：['.js', '.jsx', '.ts', '.tsx', '.vue']
   */
  allowSuffixExtensions: string[]
  /**
   * Whether to enable the feature of jumping to the dependencies of the current file and displaying tips.
   */
  depsJumpAndTip: Boolean
  /**
   * The path of the directory where the tree view will be opened.
   */
  openTreeView: string[]
  /**
   *  Whether to enable the feature of displaying the tree view.
   */
  enableTreeView: Boolean
}
