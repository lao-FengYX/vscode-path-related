import { DefinitionProvider, FileType, Range, Uri, workspace } from 'vscode'
import { existsSync, readlinkSync } from 'fs'
import { extname, sep } from 'path'

import { config } from './register'
import { getActiveEditor } from '.'
import { getFolderPath, getNewPath } from './folder'
import { Logger } from './logger'
import { getPkgDependencies } from './packageJson'

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
  try {
    const link = readlinkSync(filePath, { encoding: 'utf-8' })
    return tryExistsPath(link)
  } catch (error) {
    Logger.info(`路径查找失败, err: ${error}`)
  }
}

export const startAndEndSymbol = (str: string) => {
  if (str.at(0) === "'" && str.at(-1) === "'") {
    return true
  }
  if (str.at(0) === '"' && str.at(-1) === '"') {
    return true
  }
  return false
}

const captureReg = /['"`\(].+['"`\)]/
const provideDefinition: DefinitionProvider['provideDefinition'] = async (document, position) => {
  const editor = getActiveEditor()
  if (!editor) return

  const folderPath = getFolderPath(editor)
  if (!folderPath) return

  const lineText = document.lineAt(position).text
  const matchArr = lineText.match(captureReg)
  if (!matchArr) return

  const str = matchArr[0]
  const captureText = str.replace(/[\'\"\`\(\)]/g, '')
  if (!captureText) return
  const index = lineText.lastIndexOf(captureText)

  // 如果只识别别名
  if (
    config.jumpRecognition === 'Alias Path' &&
    !Object.keys(config.pathAlias || {}).some(alias => captureText.startsWith(alias + '/'))
  ) {
    return
  }

  // 识别别名和 node_modules
  if (config.jumpRecognition === 'Alias Path And node_modules') {
    const res1 = !Object.keys(config.pathAlias || {}).some(alias =>
      captureText.startsWith(alias + '/')
    )
    const deps = await getPkgDependencies()
    const res2 = deps?.find(([dep]) => dep.some(pkg => captureText.startsWith(pkg + '/')))

    // 别名和 node_modules 都不存在
    if (res1 && !res2) return
  }

  const newPath = await getNewPath(captureText, folderPath, document.fileName, false)
  if (!newPath) return

  const existsPath = await tryExistsPath(newPath)

  if (config.jumpRecognition === 'All Path') {
    return [
      {
        uri: Uri.file(existsPath || newPath),
        range: new Range(0, 0, 0, 0)
      }
    ]
  }

  return [
    {
      originSelectionRange: new Range(
        position.line,
        startAndEndSymbol(str) ? index - 1 : index,
        position.line,
        startAndEndSymbol(str) ? index + captureText.length + 1 : index + captureText.length
      ),
      targetRange: new Range(0, 0, 0, 0),
      targetUri: Uri.file(existsPath || newPath)
    }
  ]
}

export default {
  provideDefinition
}
