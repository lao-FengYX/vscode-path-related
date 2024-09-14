import { LogOutputChannel, window } from 'vscode'

export class Logger {
  private static instance: Logger | undefined
  private outputChannel?: LogOutputChannel

  constructor() {
    this.outputChannel = window.createOutputChannel('path-related', { log: true })
  }

  private static getInstance() {
    Logger.instance ??= new Logger()
    return Logger.instance
  }

  static info(message: string) {
    // Logger.getInstance().outputChannel?.show()
    Logger.getInstance().outputChannel?.info(message)
  }

  static clear() {
    Logger.getInstance().outputChannel?.clear()
  }

  static dispose() {
    Logger.getInstance().outputChannel?.dispose()
    Logger.getInstance().outputChannel = undefined
    Logger.instance = undefined
  }
}
