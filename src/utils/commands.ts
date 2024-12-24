import { join, sep } from 'path'
import { FileType, TextEditor, Uri, window, workspace } from 'vscode'

import { getActiveEditor } from '.'
import { getNewPath, getFolderPath } from './folder'

/**
 * 创建Uri对象
 */
const createUri = (path: string) => Uri.file(path)

/**
 * 创建文件
 */
const createFile = (uri: Uri) => {
  return workspace.fs.writeFile(uri, new Uint8Array(0))
}

/**
 * 创建文件夹
 */
const createFolder = (uri: Uri) => {
  return workspace.fs.createDirectory(uri)
}

/**
 * 获取文件或文件夹信息
 */
const statPathInfo = (uri: Uri) => {
  return workspace.fs.stat(uri)
}

/**
 * 判断路径是否存在
 */
const pathExists = (uri: Uri): Promise<Boolean> => {
  return new Promise((resolve, reject) => {
    workspace.fs.stat(uri).then(
      () => {
        resolve(true)
      },
      err => {
        resolve(false)
      }
    )
  })
}

/**
 * 路径不存在
 */
const pathNotExistsHandler = async (uri: Uri, isFolder: boolean) => {
  if (isFolder) {
    createFolder(uri)
  } else {
    await createFile(uri)
    // 创建文件时，自动打开
    const doc = await workspace.openTextDocument(uri)
    window.showTextDocument(doc)
  }
}

/**
 * 路径已存在
 */
const pathExistsHandler = async (uri: Uri, arr: string[]) => {
  const stat = await statPathInfo(uri)

  switch (stat.type) {
    case FileType.File:
      window.showErrorMessage('File already exists')
      break
    case FileType.Directory:
      // 路径已存在
      if (arr.length) return
      window.showErrorMessage('Folder already exists')
      break
    default:
      break
  }
}

/**
 * 创建文件及其路径
 */
export const createFileCommand = async () => {
  const filePath = await window.showInputBox({
    title: 'Enter file name split by "/"'
  })
  if (!filePath) return

  let workspaceFolder: string | undefined
  let editor: TextEditor | undefined = getActiveEditor()

  if (!editor) {
    if (workspace.workspaceFolders?.length === 1) {
      workspaceFolder = workspace.workspaceFolders[0].uri.fsPath
    } else {
      window.showErrorMessage('No active editor found')
      return
    }
  } else {
    workspaceFolder = getFolderPath(editor)
  }

  if (!workspaceFolder) {
    window.showErrorMessage('No workspace folder found')
    return
  }

  const newPath = await getNewPath(
    filePath,
    workspaceFolder,
    editor ? editor.document.uri.fsPath : workspaceFolder,
    false
  )
  if (!newPath) {
    window.showErrorMessage('Invalid file path')
    return
  }

  const arr = newPath.replace(workspaceFolder + sep, '').split(sep)
  const lastPath = arr.at(-1)
  let path = workspaceFolder
  while (arr.length) {
    path = join(path, arr.shift()!)
    const uri = createUri(path)

    const exist = await pathExists(uri)
    if (!exist) {
      await pathNotExistsHandler(uri, arr.length !== 0 || lastPath === '')
    } else {
      await pathExistsHandler(uri, arr)
    }
  }
}
