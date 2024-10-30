import { ExtensionContext } from 'vscode'

import { handleRegister } from './utils/register'

export function activate(context: ExtensionContext) {
  handleRegister(context)
}

export function deactivate() {}
