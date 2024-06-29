import { execSync } from 'child_process'
// 换行符
// import { EOL } from 'os'
// 分隔符
// import { sep } from 'path'

import { Logger } from './logger'
import type { GlobalDirective } from '../typing'

const globalDirective: GlobalDirective = {
  // npm 获取全局包路径
  npm: 'npm root -g',
  // yarn 获取全局包路径
  yarn: 'yarn global dir',
  // pnpm 获取全局包路径
  pnpm: 'pnpm root -g'
}

const globalPath: { [key: string]: string } = {}

Object.entries(globalDirective).forEach(([key, directive]) => {
  try {
    const result = execSync(directive, { encoding: 'utf-8' }).trim()
    globalPath[key] = result
  } catch (error) {
    Logger.info(`commands exec fail. err: ${error}`)
  }
})

export default globalPath
