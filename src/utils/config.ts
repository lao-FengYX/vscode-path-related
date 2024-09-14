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
  depsJumpAndTip: false
}
config.ignoreHiddenFiles = getConfig('ignoreHiddenFiles')
config.pathAlias = getConfig('pathAlias')
config.ignoreFileExt = getConfig('ignoreFileExt') || []
config.autoNextSuggest = getConfig('autoNextSuggest')
config.jumpRecognition = getConfig('jumpRecognition') || 'Alias Path'
config.allowSuffixExtensions = getConfig('allowSuffixExtensions') || []
config.depsJumpAndTip = getConfig('depsJumpAndTip') || false

const configChange = (e: ConfigurationChangeEvent) => {
  if (e.affectsConfiguration('path-related')) {
    config.ignoreHiddenFiles = getConfig('ignoreHiddenFiles')
    config.pathAlias = getConfig('pathAlias')
    config.ignoreFileExt = getConfig('ignoreFileExt') || []
    config.autoNextSuggest = getConfig('autoNextSuggest')
    config.jumpRecognition = getConfig('jumpRecognition') || 'Alias Path'
    config.allowSuffixExtensions = getConfig('allowSuffixExtensions') || []
    config.depsJumpAndTip = getConfig('depsJumpAndTip') || false
  }
}

export { config, configChange }
