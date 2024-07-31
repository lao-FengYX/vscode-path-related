import { Position, window, workspace } from 'vscode'

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

/**
 * 匹配 hover 位置文本
 * @param text 待匹配文本
 * @param position 位置
 * @returns
 */
export const getCaptureText = (text: string, position: Position) => {
  let captureOriginText = ''
  let replaceText = ''

  const { start, end } = getcapturePos(text, position)
  if (start === -1 || end === -1) {
    return { captureOriginText, replaceText }
  }

  captureOriginText = text.slice(start, end + 1)

  replaceText = captureOriginText.replace(/[\'\"\`\(\)]/g, '').trim()

  return { captureOriginText, replaceText }
}

const captureSymbolArr = ['"', "'", '`']
/**
 * 获取待匹配文本的开始和结束位置
 */
const getcapturePos = (text: string, position: Position) => {
  let start = -1
  let end = -1
  let num = position.character - 1
  let char = ''

  while (num >= 0 && char === '') {
    if (captureSymbolArr.includes(text[num]) || text[num] === '(') {
      start = num
      char = text[num]
    }
    num--
  }

  num = position.character

  while (num < text.length && char && end === -1) {
    if (char === text[num] || (char === '(' && text[num] === ')')) {
      end = num
    }
    num++
  }
  return { start, end }
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
