import { DocumentSelector, ExtensionContext, languages, workspace } from 'vscode'

import { getConfig } from '.'
import type { ConfigReturnType } from '../typing'
import autoCompletion from './completionItem'
import jumpToFileProvider from './provideDefinition'

const config: ConfigReturnType = {
  ignoreHiddenFiles: undefined,
  pathAlias: undefined,
  ignoreFileExt: [],
  autoNextSuggest: false,
  jumpRecognition: 'Alias Path',
  allowSuffixExtensions: []
}
config.ignoreHiddenFiles = getConfig('ignoreHiddenFiles')
config.pathAlias = getConfig('pathAlias')
config.ignoreFileExt = getConfig('ignoreFileExt') || []
config.autoNextSuggest = getConfig('autoNextSuggest')
config.jumpRecognition = getConfig('jumpRecognition') || 'Alias Path'
config.allowSuffixExtensions = getConfig('allowSuffixExtensions') || []

/**
 * 语言正则匹配
 */
const selector: DocumentSelector = [{ pattern: '**' }]
const handleRegister = (context: ExtensionContext) => {
  // 配置变化
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('path-related')) {
        config.ignoreHiddenFiles = getConfig('ignoreHiddenFiles')
        config.pathAlias = getConfig('pathAlias')
        config.ignoreFileExt = getConfig('ignoreFileExt') || []
        config.autoNextSuggest = getConfig('autoNextSuggest')
        config.jumpRecognition = getConfig('jumpRecognition') || 'Alias Path'
        config.allowSuffixExtensions = getConfig('allowSuffixExtensions') || []
      }
    })
  )

  // 提供的路径完成项
  context.subscriptions.push(
    languages.registerCompletionItemProvider(selector, autoCompletion, ...["'", '"', '/'])
  )

  // 提供跳转的完成项
  context.subscriptions.push(languages.registerDefinitionProvider(selector, jumpToFileProvider))
}

export { config, handleRegister }
