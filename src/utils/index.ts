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

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>
export const debounce = <T extends any[], R>(fn: AsyncFunction<T, R>, delay: number) => {
  let timer: NodeJS.Timeout | null = null

  return async (...args: T): Promise<R> => {
    if (timer) {
      clearTimeout(timer)
    }
    return new Promise((resolve, reject) => {
      timer = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}

export const getConfig = <T extends keyof ConfigReturnType>(
  key: T
): ConfigReturnType[T] | undefined => {
  const config = workspace.getConfiguration('path-related')
  return config.get(key)
}

/**
 * 延迟时间
 */
export const delay = 500
