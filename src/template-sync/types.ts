export type 提交信息 = { 哈希: string; 树哈希: string; 提交时间: number; 标题: string }

export type 仓库分析参数 = { 项目路径: string; 模板路径: string; 模板分支: string }

export type 创建嫁接参数 = 仓库分析参数 & { 输出分支: string }

export type 仓库分析结果 = {
  项目路径: string
  模板路径: string
  模板分支: string
  项目起点: 提交信息
  模板起点: 提交信息
  模板最新: 提交信息
  更新提交数: number
  边界提交: string[]
  项目工作区干净: boolean
  模板工作区干净: boolean
}

export type 嫁接结果 = 仓库分析结果 & { 导入分支: string; 重建提交数: number; 合并命令: string; 变基命令: string }
