import { existsSync, readlinkSync } from 'fs'
import { join } from 'path'
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
import { config } from './config'

export const isDir = async (filePath: string) => {
  const fileStat = await workspace.fs.stat(Uri.file(filePath))
  return fileStat.type === FileType.Directory
}
export const isFile = async (filePath: string) => {
  const fileStat = await workspace.fs.stat(Uri.file(filePath))
  return fileStat.type === FileType.File
}

const getFirstRealValue = (obj: Record<string, any>, condition: any[]) => {
  if (condition === null || !condition) return
  for (const key of condition) {
    if (obj?.[key]) return obj[key]
  }
}

// pkg 文件的入口
// browser 浏览器入口
// module es模块入口
// main cjs 和 es模块 入口
// exports 导出路径
// "exports": {
//     ".": {
//       "import": "./lib/esm/index.mjs",
//       "require": "./command.js"
//     },
//     "./package.json": "./package.json"
//  }
const pkgEntryKeys = ['browser', 'module', 'main', 'exports']

/**
 * 处理 package.json 的入口路径
 * @param filePath 文件路径
 * @returns
 */
export const handlerDepsEntry = async (filePath: string) => {
  // 如果没有找到，则尝试读取 package.json
  let pkgPath = join(filePath, 'package.json')

  if (!existsSync(pkgPath)) return

  let json: any = (await workspace.fs.readFile(Uri.file(pkgPath))).toString() || '{}'
  json = JSON.parse(json) as Record<string, any>

  for (const key of pkgEntryKeys) {
    const value = json?.[key]

    if (value && typeof value === 'string') {
      return join(filePath, value)
    }
    // 如果是 exports，则尝试获取 import 和 require 的路径
    if (key === 'exports' && value) {
      const entries = Object.entries(value) as [string, string | Record<string, string>][]

      for (const [k, v] of entries) {
        if (k !== '.' || !v) continue
        if (typeof v === 'string') {
          return join(filePath, v)
        }

        if (typeof v === 'object') {
          const importOrRequire = getFirstRealValue(v, ['import', 'require', 'default'])
          return join(filePath, importOrRequire)
        }
      }
    }
  }
}

/**
 * 验证路径是否存在
 * @param filePath 文件路径
 * @returns
 */
export const tryExistsPath = async (filePath: string): Promise<string | undefined> => {
  // 路径是否存在
  const isExist = existsSync(filePath)
  // 尝试添加后缀名的数组
  const copyIgnoreFileExt = [...config.ignoreFileExt, ...config.allowSuffixExtensions].sort()

  // 如果当前路径为文件夹，则尝试添加 index 和忽略的后缀名
  if (isExist && (await isDir(filePath))) {
    const possibleFileArr = copyIgnoreFileExt.map(ext => join(filePath, `index${ext}`))
    let find = possibleFileArr.find(file => existsSync(file))
    if (find) return find

    const path = await handlerDepsEntry(filePath)
    if (path) return path
  }

  // 如果当前路径为文件，则直接返回
  if (isExist && (await isFile(filePath))) {
    return filePath
  } else {
    // 尝试添加后缀名
    const possibleFileArr = copyIgnoreFileExt.map(ext => `${filePath}${ext}`)
    const find = possibleFileArr.find(file => existsSync(file))
    if (find) return find
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

/**
 * 判断是否需要装饰下划线
 * @param text 需要解析的字符串
 * @returns
 */
const shouldDecoration = (text: string) => {
  const reg = /import(\s+|\()|require\(|url\(/
  return !reg.test(text)
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

  // 截取匹配文本最后出现的位置之前的字符
  // 判断是否需要装饰下划线
  const prefixText = lineText.slice(0, index)
  if (shouldDecoration(prefixText)) {
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
