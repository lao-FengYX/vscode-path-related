import { execSync } from 'child_process'
import { dirname } from 'path'
import * as repl from 'repl'
import { Uri, workspace } from 'vscode'

import { getActiveEditor } from '.'
import { Logger } from './logger'

const getGitAbsolutePath = () => {
  const editor = getActiveEditor()
  if (!editor) return

  const filePath = editor.document.uri.fsPath
  const gitRoot = execSync('git rev-parse --show-toplevel', {
    cwd: dirname(filePath),
    encoding: 'utf-8'
  })
    .toString()
    .trim()

  return gitRoot
}

// 获取所有的package.json
const getPackageJsonPath = async () => {
  const files = await workspace.findFiles('**/package.json', '**/node_modules/**')
  return files.map(file => file.fsPath) || []
}

const getPackageJson = async (): Promise<[Record<string, any>, string][] | undefined> => {
  const allPkgPath = await getPackageJsonPath()
  if (!allPkgPath.length) return

  const arr: [Record<string, any>, string][] = []

  for (const path of allPkgPath) {
    let json: Record<string, any> = {}
    try {
      const pkgJson = (await workspace.fs.readFile(Uri.file(path))).toString() || '{}'
      json = JSON.parse(pkgJson) || {}
    } catch (error) {
      Logger.info(`读取 package.json 失败, ${error}`)
    }
    arr.push([json, dirname(path)])
  }

  return arr
}

export const getPkgDependencies = async (): Promise<[string[], string][] | undefined> => {
  const resArr: [string[], string][] = []
  const keys = ['dependencies', 'devDependencies']
  const result = await getPackageJson()
  if (!result) return

  for (const [packageJson, rootPath] of result) {
    const depend: string[] = []
    for (const k of keys) {
      depend.push(...Object.keys(packageJson[k] || {}))
    }
    resArr.push([depend, rootPath])
  }

  return resArr
}

/**
 * 获取nodejs内置模块
 * @returns
 */
export const getNodeModules = (): string[] => {
  if ((repl as any).builtinModules) {
    return (repl as any).builtinModules
  }
  return (repl as any)._builtinLibs ?? []
}
