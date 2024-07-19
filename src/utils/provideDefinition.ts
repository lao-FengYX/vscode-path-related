import { existsSync, readlinkSync } from 'fs'
import { extname, join } from 'path'
import {
  DefinitionProvider,
  FileType,
  Position,
  Range,
  ThemeColor,
  Uri,
  window,
  workspace
} from 'vscode'

import { getActiveEditor, getCaptureText } from '.'
import { getFolderPath, getNewPath } from './folder'
import { Logger } from './logger'
import { getPkgDependencies } from './packageJson'
import { config } from './register'

export const isDir = async (filePath: string) => {
  const fileStat = await workspace.fs.stat(Uri.file(filePath))
  return fileStat.type === FileType.Directory
}
export const isFile = async (filePath: string) => {
  const fileStat = await workspace.fs.stat(Uri.file(filePath))
  return fileStat.type === FileType.File
}

export const tryExistsPath = async (filePath: string): Promise<string | undefined> => {
  // 路径是否存在
  const isExist = existsSync(filePath)
  // 文件后缀名
  const ext = extname(filePath)
  // 尝试添加后缀名的数组
  const copyIgnoreFileExt = [...config.ignoreFileExt, ...config.allowSuffixExtensions].sort()

  // 如果当前路径为文件，则直接返回
  if ((ext || isExist) && (await isFile(filePath))) {
    return filePath
  } else {
    // 尝试添加后缀名
    const possibleFileArr = copyIgnoreFileExt.map(ext => `${filePath}${ext}`)
    const find = possibleFileArr.find(file => existsSync(file))
    if (find) return find
  }

  // 如果当前路径为文件夹，则尝试添加 index 和忽略的后缀名
  if (!ext && isExist && (await isDir(filePath))) {
    const possibleFileArr = copyIgnoreFileExt.map(ext => join(filePath, `index${ext}`))
    return possibleFileArr.find(file => existsSync(file))
  }

  // 当前使用的可能是 pnpm 的路径(软连接)
  try {
    const link = readlinkSync(filePath, { encoding: 'utf-8' })
    return tryExistsPath(link)
  } catch (error) {
    Logger.info(`路径查找失败, ${error}`)
  }
}

/**
 * 拿到符号的偏移位置
 * @param str 判断的字符
 * @returns 基于原字符的偏移位置
 */
export const startAndEndSymbol = (str: string) => {
  const reg = /^\([^'"].+[^'"]\)$/
  if (reg.test(str)) {
    return 0
  }
  return 1
}

/**
 * 验证鼠标位置是否在需要解析的路径中
 */
export const textInThePath = (
  position: Position,
  text: string,
  captureText: string
): [boolean, number] => {
  const index = text.lastIndexOf(captureText)
  const boo = position.character >= index && position.character <= index + captureText.length
  return [boo, index]
}

const shouldDecoration = (text: string) => {
  const reg = /import(\s+|\()|require\(|url\(/
  return reg.test(text)
}

const textDecoration = window.createTextEditorDecorationType({
  textDecoration: 'underline',
  cursor: 'pointer',
  // 活动链接颜色
  color: new ThemeColor('editorLink.activeForeground')
})

let timer: NodeJS.Timeout | null = null

const provideDefinition: DefinitionProvider['provideDefinition'] = async (document, position) => {
  const editor = getActiveEditor()
  if (!editor) return

  const folderPath = getFolderPath(editor)
  if (!folderPath) return

  const lineText = document.lineAt(position).text

  const { captureOriginText: str, replaceText: captureText } = getCaptureText(lineText, position)
  if (!captureText) return

  const [boo, index] = textInThePath(position, lineText, captureText)
  const start = startAndEndSymbol(str)
  if (!boo) return

  // 如果只识别别名
  if (
    config.jumpRecognition === 'Alias Path' &&
    !Object.keys(config.pathAlias || {}).some(alias => captureText.startsWith(alias + '/'))
  ) {
    return
  }

  // 识别别名和 node_modules
  if (config.jumpRecognition === 'Alias Path And node_modules') {
    const res1 = Object.keys(config.pathAlias || {}).some(alias =>
      captureText.startsWith(alias + '/')
    )
    const deps = await getPkgDependencies()
    const res2 = deps?.find(([dep]) => dep.some(pkg => captureText.startsWith(pkg)))

    // 别名和 node_modules 都不存在
    if (!res1 && !res2) return
  }

  const newPath = await getNewPath(captureText, folderPath, document.fileName, false)
  if (!newPath) return

  const existsPath = await tryExistsPath(newPath)
  if (!existsPath) return

  const range = new Range(
    position.line,
    index - start,
    position.line,
    index + captureText.length + start
  )

  // 当前需要装饰下划线
  const prefixText = lineText.slice(0, index)
  if (prefixText === '' || !shouldDecoration(lineText.slice(0, index - 1))) {
    editor.setDecorations(textDecoration, [range])

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      editor.setDecorations(textDecoration, [])
    }, 1000)
  }

  return [
    {
      originSelectionRange: index > -1 ? range : undefined,
      targetRange: new Range(0, 0, 0, 0),
      targetUri: Uri.file(existsPath)
    }
  ]
}

export default {
  provideDefinition
}
