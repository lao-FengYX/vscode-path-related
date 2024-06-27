import { join } from 'path'
import { TextEditor, Uri, workspace } from 'vscode'

import { debounce, delay, getActiveEditor } from '.'
import { Logger } from './logger'
import { config } from './register'
export const getFolderPath = (editor: TextEditor) => {
  const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri)
  if (!workspaceFolder) return

  return workspaceFolder.uri.fsPath
}

export const getFilePath = (editor: TextEditor) => editor.document.uri.fsPath

const captureReg = /\'(.*?)\'|\"(.*?)\"|`(.*?)`|\(.*?\)/
const handlePath = async (text: string) => {
  const editor = getActiveEditor()
  if (!editor) return

  const folderPath = getFolderPath(editor)
  if (!folderPath) return

  const filePath = getFilePath(editor)
  if (!filePath) return

  const mathArr = text.match(captureReg)
  if (!mathArr) return

  const currentPath = mathArr[0].replace(/[\'\"\`\(\)]/g, '')
  if (!currentPath.trim()) return

  const absolutePath = ['/']
  const relativePath = ['./', '../']
  let newPath: string = ''
  if (absolutePath.some(p => currentPath.startsWith(p) && currentPath.endsWith('/'))) {
    // 绝对路径
    newPath = join(folderPath, currentPath)
  } else if (relativePath.some(p => currentPath.startsWith(p) && currentPath.endsWith('/'))) {
    // 相对路径
    newPath = join(filePath, '../', currentPath)
  } else if (config.pathAlias) {
    // 自定义路径
    const pathAlias = config.pathAlias
    const arr = Object.getOwnPropertyNames(pathAlias).map((alias): [string, string] => {
      const path = pathAlias[alias]
      return [alias, path.replace(/^\$\{workspaceFolder\}/, folderPath)]
    })
    const alias = arr.find(([alias]) => currentPath.startsWith(alias))
    if (alias) {
      const [key, path] = alias
      newPath = join(path, currentPath.replace(key, ''))
    }
  }

  if (!newPath) return

  try {
    const fileArr = await workspace.fs.readDirectory(Uri.file(newPath))
    if (config.ignoreHiddenFiles) {
      return fileArr.filter(([name]) => !name.startsWith('.'))
    }
    return fileArr
  } catch (error) {
    Logger.info(`路径未找到 path -> ${newPath}`)
  }
}

export const debounceHandlePath = debounce(handlePath, delay)
