import { window, workspace } from 'vscode'

import { Logger } from './logger'
import type { ConfigReturnType } from '../typing'

export const getActiveEditor = () => {
  const editor = window.activeTextEditor
  if (!editor) {
    Logger.info('No active text editor')
    return
  }
  return editor
}

export const getConfig = <T extends keyof ConfigReturnType>(
  key: T
): ConfigReturnType[T] | undefined => {
  const config = workspace.getConfiguration('path-related')
  return config.get(key)
}

export const enum Flag {
  /** 绝对路径 */
  absolute = 1,
  /** 相对路径 */
  relative = 2,
  /** 自定义路径 */
  custom = 3,
  /** npm 包路径 */
  npmPkg = 4
}
