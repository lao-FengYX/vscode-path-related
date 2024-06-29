import { DefinitionProvider, FileType, Range, Uri, workspace } from 'vscode'
import { existsSync, readlinkSync } from 'fs'
import { extname, sep } from 'path'

import { config } from './register'
import { getActiveEditor } from '.'
import { captureReg, getFolderPath, getNewPath } from './folder'

export const isDir = async (filePath: string) => {
  const fileStat = await workspace.fs.stat(Uri.file(filePath))
  return fileStat.type === FileType.Directory
}
export const isFile = async (filePath: string) => {
  const fileStat = await workspace.fs.stat(Uri.file(filePath))
  return fileStat.type === FileType.File
}

export const tryExistsPath = async (filePath: string): Promise<string | undefined> => {
  // 如果当前路径为文件，则直接返回
  if (extname(filePath) && (await isFile(filePath))) {
    return filePath
  }

  // 如果当前路径为文件夹，则尝试添加 index 和忽略的后缀名
  if (!extname(filePath) && (await isDir(filePath))) {
    const copyIgnoreFileExt = [...config.ignoreFileExt]

    const possibleFileArr = copyIgnoreFileExt.sort().map(ext => `${filePath}${sep}index${ext}`)

    return possibleFileArr.find(file => existsSync(file))
  }

  // 如果当前路径没有后缀并且不存在
  if (!extname(filePath) && !existsSync(filePath)) {
    const possibleFileArr = config.ignoreFileExt.map(ext => `${filePath}${ext}`)
    const find = possibleFileArr.find(file => existsSync(file))
    if (find) return find
  }

  // 当前使用的可能是 pnpm 的路径(软连接)
  return tryExistsPath(readlinkSync(filePath))
}

const provideDefinition: DefinitionProvider['provideDefinition'] = async (document, position) => {
  const editor = getActiveEditor()
  if (!editor) return

  const folderPath = getFolderPath(editor)
  if (!folderPath) return

  const lineText = document.lineAt(position).text
  const matchArr = lineText.match(captureReg)
  if (!matchArr) return

  const captureText = matchArr[0].replace(/[\'\"\`\(\)]/g, '')
  const index = lineText.lastIndexOf(captureText)

  const newPath = await getNewPath(captureText, folderPath, document.fileName, false)
  if (!newPath) return

  const existsPath = await tryExistsPath(newPath)

  return [
    {
      // 下划线展示的范围不对
      // 可能只需要做 别名跳转
      originSelectionRange: new Range(
        position.line,
        index,
        position.line,
        index + captureText.length
      ),
      targetRange: new Range(0, 0, 0, 0),
      targetUri: Uri.file(existsPath || newPath)
    }
  ]
}

export default {
  provideDefinition
}
