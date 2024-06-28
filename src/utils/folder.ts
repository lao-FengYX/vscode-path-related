import { join } from 'path'
import { TextEditor, Uri, workspace } from 'vscode'

import { getActiveEditor, Flag } from '.'
import { Logger } from './logger'
import { config } from './register'
import { getPkgDependencies } from './packageJson'

/**
 * 绝对路径
 */
const absolutePath = ['/']
/**
 * 相对路径
 */
const relativePath = ['./', '../']

export const getFolderPath = (editor: TextEditor) => {
  const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri)
  if (!workspaceFolder) return

  return workspaceFolder.uri.fsPath
}

export const getFilePath = (editor: TextEditor) => editor.document.uri.fsPath

/**
 * 获取绝对路径
 * @param currentPath 当前键入路径
 * @param folderPath 工作区路径
 * @returns
 */
const getAbsolutePath = (currentPath: string, folderPath: string) => {
  return join(folderPath, currentPath)
}

/**
 * 获取相对路径
 * @param currentPath 当前键入路径
 * @param filePath 当前文件路径
 * @returns
 */
const getRelativePath = (currentPath: string, filePath: string) => {
  return join(filePath, '../', currentPath)
}

/**
 * 获取自定义路径
 * @param currentPath 当前键入路径
 * @param aliasPath 别名路径
 * @param alias 别名
 * @returns
 */
const getCustomPath = (currentPath: string, aliasPath: string, alias: string) => {
  return join(aliasPath, currentPath.replace(alias, ''))
}

/**
 * 获取依赖包的路径
 * @param currentPath 当前键入路径
 * @param rootPath 根路径
 * @returns
 */
const getPkgPath = (currentPath: string, rootPath: string) => {
  return join(rootPath, 'node_modules', currentPath)
}

/**
 * 获取路径标识
 * @param currentPath 当前键入路径
 * @param folderPath 工作区路径
 * @param filePath 当前文件路径
 * @returns
 */
const getPathFlag = (
  currentPath: string,
  folderPath: string,
  filePath: string
):
  | [
      Flag,
      {
        currentPath: string
        folderPath: string
        filePath: string
        alias?: string
        aliasPath?: string
        rootPath?: string
      }
    ]
  | [] => {
  // 绝对路径
  if (absolutePath.some(p => currentPath.startsWith(p) && currentPath.endsWith('/'))) {
    return [Flag.absolute, { currentPath, folderPath, filePath }]
  }

  // 相对路径
  if (relativePath.some(p => currentPath.startsWith(p) && currentPath.endsWith('/'))) {
    return [Flag.relative, { currentPath, folderPath, filePath }]
  }

  // 自定义路径
  const pathAlias = config.pathAlias || {}
  const processedPathAlias = Object.entries(pathAlias).map(
    ([alias, aliasPath]): [string, string] => {
      return [alias, aliasPath.replace(/^\$\{workspaceFolder\}/, folderPath)]
    }
  )
  const [alias, aliasPath] =
    processedPathAlias.find(([key]) => currentPath.startsWith(key) && currentPath.endsWith('/')) ||
    []
  if (alias && aliasPath) {
    return [Flag.custom, { currentPath, folderPath, filePath, alias, aliasPath }]
  }

  // 依赖包路径
  const [dependencies, rootPath] = getPkgDependencies(filePath, folderPath)
  if (
    dependencies &&
    rootPath &&
    dependencies.some(p => currentPath.startsWith(p) && currentPath.endsWith('/'))
  ) {
    return [Flag.npmPkg, { currentPath, folderPath, filePath, rootPath }]
  }

  return []
}

/**
 * 获取提示路径
 * @param currentP 当前键入路径
 * @param folderP 工作区路径
 * @param fileP 当前文件路径
 * @returns
 */
const getNewPath = (currentP: string, folderP: string, fileP: string) => {
  const [flag, argObj] = getPathFlag(currentP, folderP, fileP)
  if (!argObj) return

  const { currentPath, folderPath, filePath, aliasPath = '', alias = '', rootPath = '' } = argObj

  let result = undefined
  switch (flag) {
    case Flag.absolute:
      result = getAbsolutePath(currentPath, folderPath)
      break
    case Flag.relative:
      result = getRelativePath(currentPath, filePath)
      break
    case Flag.custom:
      result = getCustomPath(currentPath, aliasPath, alias)
      break
    case Flag.npmPkg:
      result = getPkgPath(currentPath, rootPath)
      break
    default:
      break
  }

  return result
}

const captureReg = /\'(.*?)\'|\"(.*?)\"|`(.*?)`|\(.*?\)/
export const handlePath = async (text: string) => {
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

  let newPath: string | undefined = getNewPath(currentPath, folderPath, filePath)

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
