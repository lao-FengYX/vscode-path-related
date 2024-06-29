import { ExtensionContext, languages, workspace } from 'vscode'

import { getConfig } from '.'
import type { ConfigReturnType } from '../typing'
import autoCompletion from './completionItem'

const config: ConfigReturnType = {
  ignoreHiddenFiles: undefined,
  pathAlias: undefined,
  ignoreFileExt: [],
  autoNextSuggest: false
}
config.ignoreHiddenFiles = getConfig('ignoreHiddenFiles')
config.pathAlias = getConfig('pathAlias')
config.ignoreFileExt = getConfig('ignoreFileExt') || []
config.autoNextSuggest = getConfig('autoNextSuggest')

const handleRegister = (context: ExtensionContext) => {
  // 配置变化
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('path-related')) {
        config.ignoreHiddenFiles = getConfig('ignoreHiddenFiles')
        config.pathAlias = getConfig('pathAlias')
        config.ignoreFileExt = getConfig('ignoreFileExt') || []
        config.autoNextSuggest = getConfig('autoNextSuggest')
      }
    })
  )

  // 提供的完成项
  context.subscriptions.push(
    languages.registerCompletionItemProvider('*', autoCompletion, ...["'", '"', '/'])
  )
}

export { config, handleRegister }
