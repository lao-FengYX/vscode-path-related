import { ExtensionContext } from 'vscode'

import { handleRegister } from './utils/register'

export function activate(context: ExtensionContext) {
  console.log('Congratulations, your extension "path-related" is now active!')

  handleRegister(context)
}

export function deactivate() {}
