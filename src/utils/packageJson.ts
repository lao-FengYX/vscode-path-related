import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { dirname, join, sep } from 'path'
import * as repl from 'repl'

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

const getPackageJsonPath = (filePath: string, folderPath: string) => {
  let pathArr = filePath.replace(folderPath, '').split(sep).filter(Boolean)
  const index = pathArr.findIndex(item => item === 'src')
  pathArr = index === -1 ? pathArr : pathArr.slice(0, index + 1)

  let resArr: string[] = []
  // 循环获取所有的package.json
  let currentPath = folderPath
  while (currentPath !== filePath && pathArr.length) {
    const packageJsonPath = join(currentPath, 'package.json')
    if (existsSync(packageJsonPath)) {
      resArr.push(packageJsonPath)
    }
    currentPath += sep + pathArr.shift()
  }

  return resArr
}

const getPackageJson = (
  filePath: string,
  folderPath: string
): [Record<string, any>, string][] | undefined => {
  const allPkgPath = getPackageJsonPath(filePath, folderPath)
  if (!allPkgPath.length) return

  const arr: [Record<string, any>, string][] = []

  for (const path of allPkgPath) {
    let json: Record<string, any> = {}
    try {
      const pkgJson = readFileSync(path, { encoding: 'utf-8' }) || '{}'
      json = JSON.parse(pkgJson) || {}
    } catch (error) {
      Logger.info(`读取 package.json 失败, ${error}`)
    }
    arr.push([json, dirname(path)])
  }

  return arr
}

export const getPkgDependencies = (
  filePath: string,
  folderPath: string
): [string[], string][] | undefined => {
  const resArr: [string[], string][] = []
  const keys = ['dependencies', 'devDependencies']
  const result = getPackageJson(filePath, folderPath)
  if (!result) return

  for (const [packageJson, rootPath] of result) {
    const depend: string[] = []
    for (const k of keys) {
      depend.push(...Object.keys(packageJson[k]))
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
