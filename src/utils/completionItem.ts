import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  FileType,
  Position,
  TextDocument
} from 'vscode'

import { handlePath } from './folder'
import { config } from './register'

const sortText = {
  [FileType.Directory]: 1,
  [FileType.File]: 2,
  [FileType.SymbolicLink]: 3,
  [FileType.Unknown]: 4
}

const shouldProvide = (currentText: string, position: Position) => {
  if (currentText.at(position.character - 1) === '/') {
    return true
  }
  return false
}

const provideCompletionItems = async (document: TextDocument, position: Position) => {
  const fullText = document.lineAt(position).text
  if (!shouldProvide(fullText, position)) return

  const fileList = await handlePath(fullText, position)
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
      const copyIgnoreFileExt = [...config.ignoreFileExt]

      // 如果在忽略的文件后缀中, 截取文件名
      copyIgnoreFileExt.sort().some(ext => {
        if (name.endsWith(ext)) {
          snippet.insertText = name.slice(0, -ext.length)
          return true
        }
      })
    } else if (type === FileType.Directory) {
      if (config.autoNextSuggest) {
        // 查看 path-autocomplete 插件的代码，发现的
        // 模拟用户键入 /
        // 比 vscode 命令 editor.action.triggerSuggest 更加好用
        snippet.command = {
          command: 'default:type',
          title: 'Trigger Suggest',
          arguments: [
            {
              text: '/'
            }
          ]
        }

        snippet.label += '/'
      }
    }

    snippet.sortText = `a_${sortText[type]}_${name}`
    arr.push(snippet)
  }

  return new CompletionList(arr, false)
}

export default {
  provideCompletionItems
}
