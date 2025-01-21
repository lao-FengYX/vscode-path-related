import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  FileType,
  Position,
  TextDocument
} from 'vscode'

import { handlePath } from './folder'
import { config } from './config'

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

  for (const [name, type, filePath] of fileList) {
    let kind: CompletionItemKind | undefined
    switch (type) {
      case FileType.Directory:
        kind = CompletionItemKind.Folder
        break
      case FileType.File:
        kind = CompletionItemKind.File
        break
      case FileType.SymbolicLink:
      case 66 as FileType:
        // 微软的链接符号(FileType.SymbolicLink)是 64 但是给的是 66
        // 不太明白为什么
        kind = CompletionItemKind.Reference
      default:
        // unknown 视为文件
        kind = CompletionItemKind.File
        break
    }
    if (!kind) continue

    const snippet = new CompletionItem(name, kind)
    snippet.insertText = name
    snippet.detail = filePath

    if (type === FileType.File) {
      snippet.sortText = 'f'

      const copyIgnoreFileExt = [...config.ignoreFileExt]

      // 如果在忽略的文件后缀中, 截取文件名
      copyIgnoreFileExt.sort().some(ext => {
        if (name.endsWith(ext)) {
          snippet.insertText = name.slice(0, -ext.length)
          return true
        }
      })
    } else if (type === FileType.Directory) {
      snippet.sortText = 'd'

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

    arr.push(snippet)
  }

  return new CompletionList(arr, false)
}

export default {
  provideCompletionItems
}
