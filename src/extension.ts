import { ExtensionContext } from 'vscode'

import { handleRegister } from './utils/register'
// import { readAllFile } from './utils/folder'

export function activate(context: ExtensionContext) {
  handleRegister(context)
  // readAllFile()
}

export function deactivate() {}
