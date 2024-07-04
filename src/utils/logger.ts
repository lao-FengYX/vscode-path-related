import { OutputChannel, window } from 'vscode'

export class Logger {
  private static instance: Logger | undefined
  private outputChannel?: OutputChannel

  constructor() {
    this.outputChannel = window.createOutputChannel('path-related')
  }

  private static getInstance() {
    Logger.instance ??= new Logger()
    return Logger.instance
  }

  static info(message: string) {
    // Logger.getInstance().outputChannel?.show()
    Logger.getInstance().outputChannel?.appendLine(message)
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
