import {
  DocumentSelector,
  ExtensionContext,
  FileStat,
  FileType,
  languages,
  Uri,
  workspace
} from 'vscode'

import { sep } from 'path'

import autoCompletion from './completionItem'
import jumpToFileProvider from './provideDefinition'
import { configChange } from './config'

/**
 * 语言正则匹配
 */
const selector: DocumentSelector = [{ pattern: '**' }]
const handleRegister = (context: ExtensionContext) => {
  // 配置变化
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(e => {
      configChange(e)
    })
  )

  // 提供的路径完成项
  context.subscriptions.push(
    languages.registerCompletionItemProvider(selector, autoCompletion, ...["'", '"', '/'])
  )

  // 提供跳转的完成项
  context.subscriptions.push(languages.registerDefinitionProvider(selector, jumpToFileProvider))
}

export { handleRegister }
