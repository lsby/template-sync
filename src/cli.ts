#!/usr/bin/env node
import inquirer from 'inquirer'
import { execFile } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { parseArgs, promisify } from 'node:util'
import { version } from './app/meta-info'
import {
  获取默认模板分支,
  获取默认模板路径,
  设置默认模板分支,
  设置默认模板路径,
  读取用户配置,
} from './template-sync/config-service'
import { 分析仓库, 列出模板分支, 创建嫁接 } from './template-sync/git-service'
import type { 仓库分析参数, 仓库分析结果, 创建嫁接参数, 嫁接结果, 提交信息 } from './template-sync/types'

let execFileAsync = promisify(execFile)

let 样式 = {
  粗体: (文本: string): string => `\x1b[1m${文本}\x1b[0m`,
  绿色: (文本: string): string => `\x1b[32m${文本}\x1b[0m`,
  青色: (文本: string): string => `\x1b[36m${文本}\x1b[0m`,
  黄色: (文本: string): string => `\x1b[33m${文本}\x1b[0m`,
  红色: (文本: string): string => `\x1b[31m${文本}\x1b[0m`,
  灰色: (文本: string): string => `\x1b[90m${文本}\x1b[0m`,
  高亮: (文本: string): string => `\x1b[1;34m${文本}\x1b[0m`,
}

function 简短哈希(hash: string): string {
  return hash.slice(0, 8)
}

function 格式化时间(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp * 1000))
}

function 生成默认输出分支(): string {
  let now = new Date()
  let pad = (value: number): string => String(value).padStart(2, '0')
  let date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  let time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `template-sync/${date}-${time}`
}

function 打印帮助(): void {
  console.log(`
${样式.粗体(样式.高亮('Template Sync CLI'))} - 找回项目与模板丢失的共同历史，一键生成并同步本地模板分支。

${样式.粗体('常用命令:')}
  ${样式.青色('template-sync')}                      一键极速同步当前项目（自动读取默认模板配置）
  ${样式.青色('template-sync sync')}                 同上，在当前项目仓库中执行同步
  ${样式.青色('template-sync set-template <路径>')}  设置全局默认模板仓库路径
  ${样式.青色('template-sync config')}               查看当前全局配置

${样式.粗体('传参同步:')}
  ${样式.青色('template-sync')} [选项]
  ${样式.青色('template-sync')} <项目路径> <模板路径> [选项]

${样式.粗体('选项:')}
  ${样式.黄色('-p, --project <路径>')}     项目仓库路径 (默认: 当前工作目录)
  ${样式.黄色('-t, --template <路径>')}    模板仓库路径 (覆盖全局默认配置)
  ${样式.黄色('-b, --branch <分支名>')}    模板分支名称 (默认自动检测 main/master)
  ${样式.黄色('-o, --output <分支名>')}    输出分支名称 (默认: template-sync/YYYYMMDD-HHMMSS)
  ${样式.黄色('-m, --merge')}              嫁接创建完成后直接执行 git merge
  ${样式.黄色('--analyze-only')}           仅执行仓库比对分析，不创建分支
  ${样式.黄色('-y, --yes')}                跳过确认直接创建
  ${样式.黄色('-i, --interactive')}        强制启用交互式向导模式
  ${样式.黄色('-v, --version')}            显示版本号
  ${样式.黄色('-h, --help')}               显示帮助信息

${样式.粗体('常见工作流示例:')}
  ${样式.灰色('# 1. 首次使用：设置一次默认模板仓库路径')}
  template-sync set-template /Users/user/project/my-template

  ${样式.灰色('# 2. 日常使用：在任意基于该模板的项目目录下直接一键同步')}
  cd /Users/user/project/my-app
  template-sync

  ${样式.灰色('# 3. 一键同步并自动合并')}
  template-sync --merge
`)
}

function 打印版本(): void {
  console.log(`v${version}`)
}

function 格式化提交卡片(标签: string, 提交: 提交信息): void {
  console.log(`  ${样式.粗体(标签)}:`)
  console.log(`    ${样式.青色(简短哈希(提交.哈希))} ${提交.标题 !== '' ? 提交.标题 : 样式.灰色('(无提交标题)')}`)
  console.log(`    ${样式.灰色(格式化时间(提交.提交时间))}`)
}

function 打印分析结果(结果: 仓库分析结果): void {
  console.log(`\n${样式.粗体(样式.青色('=== 仓库分析与历史匹配结果 ==='))}\n`)
  console.log(`  ${样式.粗体('项目仓库')}: ${结果.项目路径}`)
  console.log(`  ${样式.粗体('模板仓库')}: ${结果.模板路径} (${样式.黄色(结果.模板分支)})`)
  console.log('')

  格式化提交卡片('项目起点提交', 结果.项目起点)
  格式化提交卡片('匹配的模板起点', 结果.模板起点)
  格式化提交卡片('模板最新提交', 结果.模板最新)

  console.log(`\n  ${样式.粗体('统计信息')}:`)
  console.log(`    - 模板待更新提交数: ${样式.绿色(String(结果.更新提交数))} 个`)
  console.log(`    - 嫁接分叉入口数:   ${样式.绿色(String(结果.边界提交.length))} 个`)
  console.log(`    - ${样式.灰色('更早的模板历史不会进入目标分支')}`)
  console.log('')
}

function 打印嫁接结果(结果: 嫁接结果): void {
  console.log(`\n${样式.粗体(样式.绿色('✨ 嫁接分支创建成功！'))}\n`)
  console.log(`  ${样式.粗体('目标分支')}:   ${样式.青色(结果.导入分支)}`)
  console.log(`  ${样式.粗体('重建提交数')}: ${样式.绿色(String(结果.重建提交数))} 个`)
  if (结果.重建提交数 === 0) {
    console.log(`  ${样式.灰色('模板没有新的提交，导入分支直接指向项目起点。')}`)
  } else {
    console.log(
      `  ${样式.灰色(`已将模板公共点之后的 ${结果.重建提交数} 个提交重建到项目起点上；更早的模板历史不会被引入。`)}`,
    )
  }

  console.log(`\n${样式.粗体('后续操作指引:')}`)
  console.log(`  ${样式.粗体('1. 合并模板更新 (保留双方分支历史):')}`)
  console.log(`     ${样式.高亮(结果.合并命令)}\n`)
  console.log(`  ${样式.粗体('2. 或 变基模板更新 (线性提交历史):')}`)
  console.log(`     ${样式.高亮(结果.变基命令)}\n`)
}

async function 执行合并(项目路径: string, 分支名称: string): Promise<void> {
  console.log(样式.灰色(`正在执行: git merge ${分支名称} ...`))
  try {
    let result = await execFileAsync('git', ['merge', 分支名称], { cwd: 项目路径, encoding: 'utf8' })
    if (result.stdout.trim() !== '') {
      console.log(result.stdout.trim())
    }
    console.log(`\n${样式.粗体(样式.绿色('✅ 分支合并完成！'))}\n`)
  } catch (error) {
    let message = error instanceof Error ? error.message : String(error)
    console.warn(`\n${样式.黄色('⚠️ 自动合并发生冲突或提示:')}\n${message}`)
    console.log(样式.灰色('请根据 Git 提示解决冲突后完成 commit。'))
  }
}

async function 处理配置命令(子命令: string, 参数列表: string[]): Promise<void> {
  switch (子命令) {
    case 'set-template':
    case 'set': {
      let 目标路径 = 参数列表[0]
      let 目标分支 = 参数列表[1]
      if (目标路径 === undefined || 目标路径.trim() === '') {
        let 输入 = await inquirer.prompt<{ 路径: string }>([
          {
            type: 'input',
            name: '路径',
            message: '请输入默认模板仓库路径:',
            validate: (val: string): boolean | string => (val.trim() === '' ? '路径不能为空' : true),
          },
        ])
        目标路径 = 输入.路径
      }

      let 绝对路径 = path.resolve(目标路径.trim())
      console.log(样式.灰色(`正在验证模板仓库: ${绝对路径} ...`))
      let 分支组 = await 列出模板分支(绝对路径)
      设置默认模板路径(绝对路径)

      if (目标分支 !== undefined && 目标分支.trim() !== '') {
        设置默认模板分支(目标分支.trim())
      }

      console.log(`\n${样式.粗体(样式.绿色('✅ 默认模板仓库配置成功！'))}`)
      console.log(`  ${样式.粗体('模板路径')}: ${绝对路径}`)
      if (目标分支 !== undefined && 目标分支.trim() !== '') {
        console.log(`  ${样式.粗体('默认分支')}: ${目标分支.trim()}`)
      } else {
        console.log(`  ${样式.粗体('可用分支')}: ${分支组.join(', ')}`)
      }
      console.log(`\n现在您可以在任意项目目录下直接运行 ${样式.青色('template-sync')} 一键完成同步。\n`)
      return
    }
    case 'config':
    case 'get-template':
    case 'get': {
      let 配置 = 读取用户配置()
      console.log(`\n${样式.粗体(样式.青色('=== Template Sync 全局配置 ==='))}\n`)
      console.log(`  ${样式.粗体('默认模板路径')}: ${配置.默认模板路径 ?? 样式.灰色('(未设置)')}`)
      console.log(`  ${样式.粗体('默认模板分支')}: ${配置.默认模板分支 ?? 样式.灰色('(未设置，将自动探测)')}\n`)
      if (配置.默认模板路径 === undefined) {
        console.log(`提示: 可通过 ${样式.青色('template-sync set-template <路径>')} 设置默认模板仓库。\n`)
      }
      return
    }
  }
}

async function 交互式向导流程(初始参数: {
  项目路径: string | undefined
  模板路径: string | undefined
  模板分支: string | undefined
  输出分支: string | undefined
  仅分析: boolean
  自动确认: boolean
  自动合并: boolean
}): Promise<void> {
  console.log(`\n${样式.粗体(样式.高亮('🚀 Template Sync 交互式向导'))}\n`)

  let 默认项目路径 = 初始参数.项目路径 !== undefined && 初始参数.项目路径 !== '' ? 初始参数.项目路径 : process.cwd()

  // 1. 项目路径
  let 项目问答 = await inquirer.prompt<{ 项目路径: string }>([
    {
      type: 'input',
      name: '项目路径',
      message: '请输入项目仓库路径:',
      default: 默认项目路径,
      validate: (input: string): boolean | string => (input.trim() === '' ? '项目路径不能为空' : true),
    },
  ])
  let 项目路径 = path.resolve(项目问答.项目路径.trim())

  // 2. 模板路径
  let 配置模板路径 = 获取默认模板路径()
  let 候选模板路径 = 初始参数.模板路径 !== undefined && 初始参数.模板路径 !== '' ? 初始参数.模板路径 : 配置模板路径

  let 模板问答 = await inquirer.prompt<{ 模板路径: string }>([
    {
      type: 'input',
      name: '模板路径',
      message: '请输入模板仓库路径:',
      ...(候选模板路径 !== undefined ? { default: 候选模板路径 } : {}),
      validate: (input: string): boolean | string => (input.trim() === '' ? '模板路径不能为空' : true),
    },
  ])
  let 模板路径 = path.resolve(模板问答.模板路径.trim())

  // 如果用户未设置全局模板路径，提示是否保存为默认
  if (配置模板路径 === undefined) {
    let 保存问答 = await inquirer.prompt<{ 保存为默认: boolean }>([
      {
        type: 'confirm',
        name: '保存为默认',
        message: '是否将该路径保存为全局默认模板仓库？（下次可直接在项目目录一键同步）',
        default: true,
      },
    ])
    if (保存问答.保存为默认 === true) {
      设置默认模板路径(模板路径)
      console.log(样式.绿色(`✅ 已保存默认模板路径: ${模板路径}`))
    }
  }

  // 3. 列出模板分支并选择
  console.log(样式.灰色('正在读取模板分支列表...'))
  let 分支列表 = await 列出模板分支(模板路径)
  if (分支列表.length === 0) {
    throw new Error('模板仓库中未找到可用的本地分支')
  }

  let 配置模板分支 = 获取默认模板分支()
  let 默认分支 = 分支列表[0]
  if (初始参数.模板分支 !== undefined && 分支列表.includes(初始参数.模板分支) === true) {
    默认分支 = 初始参数.模板分支
  } else if (配置模板分支 !== undefined && 分支列表.includes(配置模板分支) === true) {
    默认分支 = 配置模板分支
  } else if (分支列表.includes('main') === true) {
    默认分支 = 'main'
  } else if (分支列表.includes('master') === true) {
    默认分支 = 'master'
  }

  let 分支问答 = await inquirer.prompt<{ 模板分支: string }>([
    { type: 'list', name: '模板分支', message: '请选择模板分支:', choices: 分支列表, default: 默认分支 },
  ])
  let 模板分支 = 分支问答.模板分支

  // 4. 分析仓库
  console.log(样式.灰色('正在分析仓库历史与匹配公共树...'))
  let 分析参数: 仓库分析参数 = { 项目路径, 模板路径, 模板分支 }
  let 分析结果 = await 分析仓库(分析参数)
  打印分析结果(分析结果)

  if (初始参数.仅分析 === true) {
    return
  }

  // 5. 输出分支名称
  let 默认输出 = 初始参数.输出分支 !== undefined && 初始参数.输出分支 !== '' ? 初始参数.输出分支 : 生成默认输出分支()
  let 输出问答 = await inquirer.prompt<{ 输出分支: string }>([
    {
      type: 'input',
      name: '输出分支',
      message: '请输入要创建的本地输出分支名称:',
      default: 默认输出,
      validate: (input: string): boolean | string => (input.trim() === '' ? '输出分支名称不能为空' : true),
    },
  ])
  let 输出分支 = 输出问答.输出分支.trim()

  // 6. 确认创建
  if (初始参数.自动确认 === false) {
    let 确认问答 = await inquirer.prompt<{ 确认创建: boolean }>([
      { type: 'confirm', name: '确认创建', message: `确认在项目仓库中创建分支 "${输出分支}"？`, default: true },
    ])
    if (确认问答.确认创建 === false) {
      console.log(样式.黄色('\n已取消创建操作。'))
      return
    }
  }

  // 7. 执行创建嫁接
  console.log(样式.灰色('正在物化模板提交并创建嫁接分支...'))
  let 创建参数: 创建嫁接参数 = { ...分析参数, 输出分支 }
  let 嫁接结果 = await 创建嫁接(创建参数)
  打印嫁接结果(嫁接结果)

  // 8. 合并处理
  if (初始参数.自动合并 === true) {
    await 执行合并(项目路径, 输出分支)
  } else if (初始参数.自动确认 === false && process.stdin.isTTY === true) {
    let 合并问答 = await inquirer.prompt<{ 立即合并: boolean }>([
      {
        type: 'confirm',
        name: '立即合并',
        message: `是否立即将 "${输出分支}" 合并到当前分支 (git merge ${输出分支})？`,
        default: false,
      },
    ])
    if (合并问答.立即合并 === true) {
      await 执行合并(项目路径, 输出分支)
    }
  }
}

async function 参数化或一键同步流程(
  项目路径: string,
  模板路径: string,
  模板分支参数: string | undefined,
  输出分支参数: string | undefined,
  仅分析: boolean,
  自动确认: boolean,
  自动合并: boolean,
): Promise<void> {
  // 自动探测分支
  let 模板分支 = 模板分支参数
  if (模板分支 === undefined || 模板分支 === '') {
    let 配置分支 = 获取默认模板分支()
    let 分支列表 = await 列出模板分支(模板路径)
    if (分支列表.length === 0) {
      throw new Error('模板仓库中未找到任何本地分支')
    }
    if (配置分支 !== undefined && 分支列表.includes(配置分支) === true) {
      模板分支 = 配置分支
    } else {
      let 推荐分支 = 分支列表.find((项) => 项 === 'main' || 项 === 'master')
      let 首项分支 = 分支列表[0]
      模板分支 = 推荐分支 ?? 首项分支 ?? 'main'
    }
  }

  let 分析参数: 仓库分析参数 = { 项目路径, 模板路径, 模板分支 }
  console.log(样式.灰色(`正在分析仓库: [项目: ${项目路径}] <-> [模板: ${模板路径} (${模板分支})] ...`))
  let 分析结果 = await 分析仓库(分析参数)
  打印分析结果(分析结果)

  if (仅分析 === true) {
    return
  }

  let 输出分支 = 输出分支参数 !== undefined && 输出分支参数.trim() !== '' ? 输出分支参数.trim() : 生成默认输出分支()

  // 如果是在 TTY 且未指定 -y，提示确认
  if (自动确认 === false && process.stdin.isTTY === true) {
    let 确认问答 = await inquirer.prompt<{ 确认创建: boolean }>([
      { type: 'confirm', name: '确认创建', message: `确认在项目仓库中创建分支 "${输出分支}"？`, default: true },
    ])
    if (确认问答.确认创建 === false) {
      console.log(样式.黄色('\n已取消创建操作。'))
      return
    }
  }

  console.log(样式.灰色(`正在创建嫁接分支 "${输出分支}" ...`))
  let 创建参数: 创建嫁接参数 = { ...分析参数, 输出分支 }
  let 嫁接结果 = await 创建嫁接(创建参数)
  打印嫁接结果(嫁接结果)

  if (自动合并 === true) {
    await 执行合并(项目路径, 输出分支)
  }
}

async function 主入口(): Promise<void> {
  let 参数选项 = {
    project: { type: 'string' as const, short: 'p' },
    template: { type: 'string' as const, short: 't' },
    branch: { type: 'string' as const, short: 'b' },
    output: { type: 'string' as const, short: 'o' },
    merge: { type: 'boolean' as const, short: 'm' },
    'analyze-only': { type: 'boolean' as const },
    yes: { type: 'boolean' as const, short: 'y' },
    interactive: { type: 'boolean' as const, short: 'i' },
    help: { type: 'boolean' as const, short: 'h' },
    version: { type: 'boolean' as const, short: 'v' },
  }

  let 解析结果 = parseArgs({ args: process.argv.slice(2), options: 参数选项, allowPositionals: true, strict: false })

  let { values, positionals } = 解析结果

  if (values.help === true) {
    打印帮助()
    return
  }

  if (values.version === true) {
    打印版本()
    return
  }

  let 首个位置参数 = positionals[0]

  // 处理子命令：set-template / config / get-template
  if (
    首个位置参数 === 'set-template' ||
    首个位置参数 === 'set' ||
    首个位置参数 === 'config' ||
    首个位置参数 === 'get-template' ||
    首个位置参数 === 'get'
  ) {
    await 处理配置命令(首个位置参数, positionals.slice(1))
    return
  }

  // 如果首个位置参数是 'sync'，将其移除并作为常规同步命令处理
  let 位置参数列表 = 首个位置参数 === 'sync' ? positionals.slice(1) : positionals

  let 显式指定交互 = values.interactive === true
  let 仅分析 = values['analyze-only'] === true
  let 自动确认 = values.yes === true
  let 自动合并 = values.merge === true

  let 项目路径参数 = typeof values.project === 'string' ? values.project : 位置参数列表[0]
  let 模板路径参数 = typeof values.template === 'string' ? values.template : 位置参数列表[1]
  let 模板分支 = typeof values.branch === 'string' ? values.branch : undefined
  let 输出分支 = typeof values.output === 'string' ? values.output : undefined

  // 获取默认配置
  let 配置模板路径 = 获取默认模板路径()
  let 实际模板路径 =
    模板路径参数 !== undefined && 模板路径参数.trim() !== '' ? path.resolve(模板路径参数.trim()) : 配置模板路径

  let 实际项目路径 =
    项目路径参数 !== undefined && 项目路径参数.trim() !== '' ? path.resolve(项目路径参数.trim()) : process.cwd()

  // 如果显式指定交互，或者既没有传模板路径也没有全局配置
  if (显式指定交互 === true || 实际模板路径 === undefined) {
    await 交互式向导流程({
      项目路径: 实际项目路径,
      模板路径: 模板路径参数,
      模板分支,
      输出分支,
      仅分析,
      自动确认,
      自动合并,
    })
    return
  }

  // 已经有项目路径和模板路径（直接传参或使用全局默认配置）
  await 参数化或一键同步流程(实际项目路径, 实际模板路径, 模板分支, 输出分支, 仅分析, 自动确认, 自动合并)
}

主入口().catch((错误) => {
  let 错误消息 = 错误 instanceof Error ? 错误.message : String(错误)
  console.error(`\n${样式.红色('❌ 执行失败:')} ${错误消息}\n`)
  process.exit(1)
})
