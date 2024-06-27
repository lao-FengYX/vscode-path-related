import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  FileType,
  Position,
  TextDocument,
  window
} from 'vscode'

import { debounce, delay } from '.'
import { debounceHandlePath } from './folder'
import { config } from './register'

const sortText = {
  [FileType.Directory]: 1,
  [FileType.File]: 2,
  [FileType.SymbolicLink]: 3,
  [FileType.Unknown]: 4
}
const provideCompletionItems = async (document: TextDocument, position: Position) => {
  const fullText = document.lineAt(position).text
  const fileList = await debounceHandlePath(fullText)
  if (!fileList) return

  const arr: CompletionItem[] = []

  for (const [name, type] of fileList) {
    let kind: CompletionItemKind | undefined
    switch (type) {
      case FileType.Directory:
        kind = CompletionItemKind.Folder
        break
      case FileType.File:
        kind = CompletionItemKind.File
        break
      case FileType.SymbolicLink:
        kind = CompletionItemKind.Reference
      default:
        break
    }
    if (!kind) continue

    const snippet = new CompletionItem(name, kind)
    snippet.insertText = name

    if (type === FileType.File) {
      // 如果在忽略的文件后缀中, 截取文件名
      config.ignoreFileExt
        .sort((a, b) => b.length - a.length)
        .some(ext => {
          if (name.endsWith(ext)) {
            snippet.insertText = name.slice(0, -ext.length)
            return true
          }
        })
    } else if (type === FileType.Directory) {
      if (config.autoNextSuggest) {
        snippet.insertText = `${name}/`
        snippet.command = {
          command: 'editor.action.triggerSuggest', // 内置命令，用于触发自动完成
          title: 'Trigger suggest' // 命令的描述（可选）
        }
      }
    }

    snippet.sortText = `a_${sortText[type]}_${name}`
    arr.push(snippet)
  }

  return new CompletionList(arr, false)
}

const debounceProvider = debounce(provideCompletionItems, delay)

export default {
  provideCompletionItems: debounceProvider
}
