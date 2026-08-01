import type { 仓库分析参数, 仓库分析结果, 创建嫁接参数, 嫁接结果 } from '../template-sync/types'

export {}

declare global {
  interface Window {
    electronAPI: {
      获取文件路径: (文件: File) => string
      选择目录: () => Promise<string | null>
      列出模板分支: (模板路径: string) => Promise<string[]>
      分析仓库: (参数: 仓库分析参数) => Promise<仓库分析结果>
      创建嫁接: (参数: 创建嫁接参数) => Promise<嫁接结果>
      打开目录: (目录: string) => Promise<void>
    }
  }
}
