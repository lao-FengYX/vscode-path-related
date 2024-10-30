import { join, sep } from 'path'
import { Position, TextEditor, Uri, workspace, FileType } from 'vscode'

import { getActiveEditor, Flag, getCaptureText } from '.'
import { Logger } from './logger'
import { config } from './config'
import { getPkgDependencies } from './packageJson'

/**
 * 绝对路径
 */
export const absolutePath = ['/']
/**
 * 相对路径
 */
export const relativePath = ['./', '../']

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
 * @param verify 是否校验结尾路径
 * @returns
 */
const getPathFlag = async (
  currentPath: string,
  folderPath: string,
  filePath: string,
  verify: Boolean
): Promise<
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
  | []
> => {
  // 绝对路径
  if (
    absolutePath.some(p => currentPath.startsWith(p) && (verify ? currentPath.endsWith('/') : true))
  ) {
    return [Flag.absolute, { currentPath, folderPath, filePath }]
  }

  // 相对路径
  if (
    currentPath === '.' ||
    relativePath.some(p => currentPath.startsWith(p) && (verify ? currentPath.endsWith('/') : true))
  ) {
    return [Flag.relative, { currentPath, folderPath, filePath }]
  }

  // 依赖包路径
  if (config.depsJumpAndTip) {
    const allPkgResult = (await getPkgDependencies()) || []
    // 获取所有依赖的 key 和依赖的 pkgJson 路径
    const [dependencies, rootPath] =
      allPkgResult.find(([keys]) =>
        keys.some(p => currentPath.startsWith(p) && (verify ? currentPath.endsWith('/') : true))
      ) || []

    if (dependencies && rootPath) {
      return [Flag.npmPkg, { currentPath, folderPath, filePath, rootPath }]
    }
  }

  // 自定义路径
  const pathAlias = config.pathAlias || {}
  const processedPathAlias = Object.entries(pathAlias).map(
    ([alias, aliasPath]): [string, string] => {
      return [alias, aliasPath.replace(/^\$\{workspaceFolder\}/, folderPath)]
    }
  )
  const [alias, aliasPath] =
    processedPathAlias.find(
      ([key]) => currentPath.startsWith(key) && (verify ? currentPath.endsWith('/') : true)
    ) || []
  if (alias && aliasPath) {
    return [Flag.custom, { currentPath, folderPath, filePath, alias, aliasPath }]
  }

  return []
}

/**
 * 获取提示路径
 * @param currentP 当前键入路径
 * @param folderP 工作区路径
 * @param fileP 当前文件路径
 * @param verify 是否校验结尾路径
 * @returns
 */
export const getNewPath = async (
  currentP: string,
  folderP: string,
  fileP: string,
  verify = true
) => {
  const [flag, argObj] = await getPathFlag(currentP, folderP, fileP, verify)
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

export const handlePath = async (text: string, position: Position) => {
  const editor = getActiveEditor()
  if (!editor) return

  const folderPath = getFolderPath(editor)
  if (!folderPath) return

  const filePath = getFilePath(editor)
  if (!filePath) return

  const { replaceText: currentPath } = getCaptureText(text, position)
  if (!currentPath) return

  let newPath: string | undefined = await getNewPath(currentPath, folderPath, filePath)

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
