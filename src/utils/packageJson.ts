import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import * as repl from 'repl'

import { getActiveEditor } from '.'

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

const getPackageJson = (): [Record<string, any>, string] | undefined => {
  const rootPath = getGitAbsolutePath()
  if (!rootPath) return
  const packageJsonPath = join(rootPath, 'package.json')
  try {
    return [JSON.parse(readFileSync(packageJsonPath, { encoding: 'utf-8' })), rootPath]
  } catch (error) {
    return
  }
}

export const getPkgDependencies = (): [string[] | undefined, string | undefined] => {
  const depend: string[] = []
  const keys = ['dependencies', 'devDependencies']
  const result = getPackageJson()
  if (!result) return [undefined, undefined]

  const [packageJson, rootPath] = result
  for (const k of keys) {
    depend.push(...Object.keys(packageJson[k]))
  }
  return [depend, rootPath]
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
