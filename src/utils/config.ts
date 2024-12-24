import { type ConfigurationChangeEvent } from 'vscode'
import type { ConfigReturnType } from '../typing'
import { getConfig } from '.'

const config: ConfigReturnType = {
  ignoreHiddenFiles: undefined,
  pathAlias: undefined,
  ignoreFileExt: [],
  autoNextSuggest: false,
  jumpRecognition: 'Alias Path',
  allowSuffixExtensions: [],
  depsJumpAndTip: false,
  openTreeView: [],
  enableTreeView: false,
}

const initConfig = () => {
  for (const key in config) {
    // @ts-ignore
    config[key] = getConfig(key) || config[key]
  }
}
initConfig()

const configChange = (e: ConfigurationChangeEvent) => {
  if (e.affectsConfiguration('path-related')) {
    initConfig()
  }
}

export { config, configChange }
