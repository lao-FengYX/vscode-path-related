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
import { getConfig } from '.'
import type { ConfigReturnType } from '../typing'
import autoCompletion from './completionItem'
import { fileMap, handleSetFile } from './folder'
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

const handleAdd = (
  waitArr: string[],
  rootPath: string,
  stat: FileStat,
  obj: Record<string, any>
) => {
  let temp = obj

  while (waitArr.length) {
    const el = waitArr.shift()
    if (!el) break
    if (!temp[el]) temp[el] = {}
    if (!waitArr.length && stat.type !== FileType.Directory) {
      temp[el] = null
    }

    temp = temp[el]
  }

  fileMap.set(rootPath, obj)
}

const handleDel = (waitArr: string[], obj: Record<string, any>) => {
  let temp = obj

  while (waitArr.length) {
    const el = waitArr.shift()
    if (!el) break
    if (!(el in temp)) break
    if (!waitArr.length) delete temp[el]

    temp = temp[el]
  }
}

const fileChange = async (f: string, rootPath: string, manner: 'add' | 'del') => {
  let fPath = Uri.file(f)
  let awaitPath = f.replace(rootPath, '').split(sep).filter(Boolean)
  let obj = fileMap.get(rootPath) ?? {}

  if (manner === 'add') {
    const stat = await workspace.fs.stat(fPath)
    handleAdd(awaitPath, rootPath, stat, obj)
  } else {
    handleDel(awaitPath, obj)
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

  // -------------------
  // 优化项  缓存起来
  // -------------------

  // // 监听工作区文件夹变化
  // context.subscriptions.push(
  //   workspace.onDidChangeWorkspaceFolders(e => {
  //     e.removed.forEach(folder => {
  //       const path = folder.uri.fsPath
  //       fileMap.delete(path)
  //     })

  //     e.added.forEach(folder => {
  //       const path = folder.uri.fsPath
  //       let obj = {}
  //       handleSetFile(path, obj)
  //       fileMap.set(path, obj)
  //     })
  //   })
  // )

  // // 监听文件创建
  // context.subscriptions.push(
  //   workspace.onDidCreateFiles(e => {
  //     let rootPath = workspace.getWorkspaceFolder(e.files[0])?.uri.fsPath
  //     if (!rootPath) return

  //     e.files.forEach(file => {
  //       fileChange(file.fsPath, rootPath, 'add')
  //     })
  //   })
  // )

  // // 监听文件删除
  // context.subscriptions.push(
  //   workspace.onDidDeleteFiles(e => {
  //     e.files.forEach(file => {
  //       let rootPath = workspace.getWorkspaceFolder(file)?.uri.fsPath
  //       if (!rootPath) return

  //       const path = file.fsPath
  //       fileChange(path, rootPath, 'del')
  //     })
  //   })
  // )

  // // 监听文件重命名
  // context.subscriptions.push(
  //   workspace.onDidRenameFiles(e => {
  //     e.files.forEach(({ newUri, oldUri }) => {
  //       const time = performance.now()

  //       let rootPath = workspace.getWorkspaceFolder(newUri)?.uri.fsPath
  //       let rootPathOld = workspace.getWorkspaceFolder(oldUri)?.uri.fsPath
  //       if (!rootPath || !rootPathOld) return

  //       const oldPath = oldUri.fsPath
  //       const newPath = newUri.fsPath
  //       fileChange(oldPath, rootPathOld, 'del')
  //       fileChange(newPath, rootPath, 'add')

  //       console.log(`文件处理耗时${(performance.now() - time).toFixed(3)}ms`)
  //     })
  //   })
  // )
}

export { config, handleRegister }
