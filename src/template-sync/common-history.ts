import path from 'node:path'
import { 执行Git } from './git-executor'

export async function 找到共同历史(
  项目路径: string,
  模板路径: string,
  模板提交: string,
): Promise<{ 起点哈希: string; 更新提交数: number } | undefined> {
  let [对象目录, 项目末端] = await Promise.all([
    执行Git(项目路径, ['rev-parse', '--git-path', 'objects'], { 禁用替换: true }),
    执行Git(项目路径, ['rev-parse', '--verify', 'HEAD^{commit}'], { 禁用替换: true }),
  ])
  let 已有对象目录 = process.env['GIT_ALTERNATE_OBJECT_DIRECTORIES']
  let 对象目录列表 = [JSON.stringify(path.resolve(项目路径, 对象目录.stdout))]
  if (已有对象目录 !== undefined && 已有对象目录 !== '') 对象目录列表.push(已有对象目录)
  let 选项 = { 禁用替换: true, 环境变量: { GIT_ALTERNATE_OBJECT_DIRECTORIES: 对象目录列表.join(path.delimiter) } }
  let 共同起点 = await 执行Git(模板路径, ['merge-base', '--all', 模板提交, 项目末端.stdout], {
    ...选项,
    允许失败: true,
  })
  if (共同起点.退出码 === 1) return undefined
  if (共同起点.退出码 !== 0) throw new Error(共同起点.stderr)
  let 起点哈希 = 共同起点.stdout.split('\n').sort()[0]
  if (起点哈希 === undefined || 起点哈希 === '') throw new Error('无法读取共同历史起点')

  // 多个最近共同祖先时，排除项目全部历史才能正确计算尚未同步的模板提交。
  let 更新数量 = await 执行Git(模板路径, ['rev-list', '--count', 模板提交, '--not', 项目末端.stdout], 选项)
  return { 起点哈希, 更新提交数: Number.parseInt(更新数量.stdout, 10) }
}
