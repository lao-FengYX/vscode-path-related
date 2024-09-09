import { ExtensionContext } from 'vscode'

import { handleRegister } from './utils/register'
// import { readAllFile } from './utils/folder'

export function activate(context: ExtensionContext) {
  // console.log('Congratulations, your extension "path-related" is now active!')

  handleRegister(context)
  // readAllFile()
}

export function deactivate() {}
