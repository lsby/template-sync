import { dialog, ipcMain, shell } from 'electron'
import { 分析仓库, 列出模板分支, 创建嫁接 } from '../template-sync/git-service'
import type { 仓库分析参数, 创建嫁接参数 } from '../template-sync/types'

let 已注册 = false

export function 注册模板同步IPC(): void {
  if (已注册) return
  已注册 = true

  ipcMain.handle('template-sync:select-directory', async () => {
    let result = await dialog.showOpenDialog({ title: '选择 Git 仓库目录', properties: ['openDirectory'] })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle('template-sync:list-branches', async (_event, 模板路径: string) => {
    return await 列出模板分支(模板路径)
  })

  ipcMain.handle('template-sync:analyze', async (_event, 参数: 仓库分析参数) => {
    return await 分析仓库(参数)
  })

  ipcMain.handle('template-sync:create-graft', async (_event, 参数: 创建嫁接参数) => {
    return await 创建嫁接(参数)
  })

  ipcMain.handle('template-sync:open-directory', async (_event, 目录: string) => {
    let errorMessage = await shell.openPath(目录)
    if (errorMessage !== '') throw new Error(errorMessage)
  })
}
