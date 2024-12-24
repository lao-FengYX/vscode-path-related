import {
  DocumentSelector,
  ExtensionContext,
  FileStat,
  FileType,
  languages,
  Uri,
  workspace,
  commands,
  window,
  TextEditor
} from 'vscode'

import { sep } from 'path'

import autoCompletion from './completionItem'
import jumpToFileProvider from './provideDefinition'
import { configChange, config } from './config'
import { createFileCommand } from './commands'

/**
 * 注册打开文件时关联文件视图
 */
const registerAssociatedFileView = (e: TextEditor) => {
  if (!config.enableTreeView) return

  const { document } = e
  const { fileName, uri } = document
  if (config.openTreeView.some(v => fileName.includes(v))) {
    // 滚动到文件视图对应的位置
    // 感觉内置调用了 TreeView.reveal 方法
    commands.executeCommand('revealInExplorer', uri, { select: true })
  }
}

/**
 * 语言正则匹配
 */
const selector: DocumentSelector = [{ pattern: '**' }]
const handleRegister = (context: ExtensionContext) => {
  // 配置变化
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(e => {
      configChange(e)
    }),
    window.onDidChangeActiveTextEditor(e => {
      if (!e) return
      registerAssociatedFileView(e)
    })
  )

  // 提供的路径完成项
  context.subscriptions.push(
    languages.registerCompletionItemProvider(selector, autoCompletion, ...["'", '"', '/'])
  )

  // 提供跳转的完成项
  context.subscriptions.push(languages.registerDefinitionProvider(selector, jumpToFileProvider))

  // 注册创建文件命令
  context.subscriptions.push(commands.registerCommand('path-related.createFile', createFileCommand))
}

export { handleRegister }
