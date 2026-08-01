import type { 仓库分析参数, 仓库分析结果, 创建嫁接参数, 嫁接结果, 提交信息 } from '../../../template-sync/types'
import { 组件基类 } from '../../base/base'

type 发出事件类型 = {}
type 监听事件类型 = {}

function 错误消息(error: unknown): string {
  if (error instanceof Error) {
    let match = error.message.match(/Error invoking remote method '[^']+': Error: (.*)$/s)
    return match?.[1] ?? error.message
  }
  return String(error)
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
  }).format(new Date(timestamp * 1000))
}

function 默认输出分支(): string {
  let now = new Date()
  let pad = (value: number): string => String(value).padStart(2, '0')
  let date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  let time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `template-sync/${date}-${time}`
}

export class 首页组件 extends 组件基类<发出事件类型, 监听事件类型> {
  static {
    this.注册组件('lsby-index', this)
  }

  private 项目路径 = ''
  private 模板路径 = ''
  private 分析结果: 仓库分析结果 | null = null
  private 嫁接结果: 嫁接结果 | null = null

  private 元素<T extends HTMLElement>(id: string): T {
    let element = this.shadow.getElementById(id)
    if (element === null) throw new Error(`缺少界面元素：${id}`)
    return element as T
  }

  private 当前参数(): 仓库分析参数 {
    let 模板分支 = this.元素<HTMLSelectElement>('template-branch').value
    if (this.项目路径 === '') throw new Error('请选择项目仓库')
    if (this.模板路径 === '') throw new Error('请选择模板仓库')
    if (模板分支 === '') throw new Error('请选择模板分支')
    return { 项目路径: this.项目路径, 模板路径: this.模板路径, 模板分支 }
  }

  private 当前创建参数(): 创建嫁接参数 {
    let 输出分支 = this.元素<HTMLInputElement>('output-branch').value.trim()
    if (输出分支 === '') throw new Error('请输入输出分支名称')
    return { ...this.当前参数(), 输出分支 }
  }

  private 设置忙碌(忙碌: boolean): void {
    for (let button of this.shadow.querySelectorAll<HTMLButtonElement>('button')) button.disabled = 忙碌
    this.元素<HTMLSelectElement>('template-branch').disabled = 忙碌
    this.元素<HTMLInputElement>('output-branch').disabled = 忙碌
  }

  private 显示消息(消息: string, 类型: 'info' | 'success' | 'error' = 'info'): void {
    let message = this.元素<HTMLDivElement>('message')
    message.textContent = 消息
    message.dataset['type'] = 类型
    message.hidden = false
  }

  private 清除消息(): void {
    this.元素<HTMLDivElement>('message').hidden = true
  }

  private 设置路径(类型: 'project' | 'template', value: string): void {
    if (类型 === 'project') this.项目路径 = value
    else this.模板路径 = value
    this.元素<HTMLInputElement>(`${类型}-path`).value = value
    this.分析结果 = null
    this.嫁接结果 = null
    this.元素<HTMLElement>('result').hidden = true
    this.元素<HTMLElement>('graft-result').hidden = true
  }

  private async 选择项目(): Promise<void> {
    let selected = await window.electronAPI.选择目录()
    if (selected !== null) this.设置路径('project', selected)
  }

  private async 选择模板(): Promise<void> {
    let selected = await window.electronAPI.选择目录()
    if (selected === null) return
    this.设置路径('template', selected)

    this.设置忙碌(true)
    try {
      let branches = await window.electronAPI.列出模板分支(selected)
      let select = this.元素<HTMLSelectElement>('template-branch')
      select.replaceChildren(
        ...branches.map((branch) => {
          let option = document.createElement('option')
          option.value = branch
          option.textContent = branch
          return option
        }),
      )
      this.清除消息()
    } catch (error) {
      this.显示消息(错误消息(error), 'error')
    } finally {
      this.设置忙碌(false)
    }
  }

  private 填充提交(prefix: string, commit: 提交信息): void {
    this.元素<HTMLElement>(`${prefix}-hash`).textContent = 简短哈希(commit.哈希)
    this.元素<HTMLElement>(`${prefix}-subject`).textContent = commit.标题 !== '' ? commit.标题 : '（无提交说明）'
    this.元素<HTMLElement>(`${prefix}-time`).textContent = 格式化时间(commit.提交时间)
  }

  private async 分析(): Promise<void> {
    this.设置忙碌(true)
    this.清除消息()
    try {
      let result = await window.electronAPI.分析仓库(this.当前参数())
      this.分析结果 = result
      this.嫁接结果 = null
      this.填充提交('project-root', result.项目起点)
      this.填充提交('template-root', result.模板起点)
      this.填充提交('template-tip', result.模板最新)
      this.元素<HTMLElement>('update-count').textContent = String(result.更新提交数)
      this.元素<HTMLElement>('boundary-count').textContent = String(result.边界提交.length)
      this.元素<HTMLInputElement>('output-branch').value = 默认输出分支()
      this.元素<HTMLElement>('result').hidden = false
      this.元素<HTMLElement>('graft-result').hidden = true
      this.显示消息('匹配成功。请确认关键信息和输出分支名称。', 'success')
    } catch (error) {
      this.元素<HTMLElement>('result').hidden = true
      this.显示消息(错误消息(error), 'error')
    } finally {
      this.设置忙碌(false)
    }
  }

  private async 创建嫁接(): Promise<void> {
    this.设置忙碌(true)
    this.清除消息()
    try {
      let result = await window.electronAPI.创建嫁接(this.当前创建参数())
      this.嫁接结果 = result
      this.元素<HTMLElement>('graft-branch').textContent = result.导入分支
      this.元素<HTMLElement>('rewritten-count').textContent = String(result.重建提交数)
      this.元素<HTMLElement>('merge-command').textContent = result.合并命令
      this.元素<HTMLElement>('rebase-command').textContent = result.变基命令
      this.元素<HTMLElement>('connected-note').textContent =
        result.重建提交数 === 0
          ? '模板没有新的提交，导入分支直接指向项目起点。'
          : `已将模板公共点之后的 ${result.重建提交数} 个提交重建到项目起点上；更早的模板历史不会被引入。`
      this.元素<HTMLElement>('graft-result').hidden = false
      this.元素<HTMLElement>('result').hidden = true
      this.显示消息('分支创建完成。它现在是项目仓库中的普通本地分支。', 'success')
    } catch (error) {
      this.显示消息(错误消息(error), 'error')
    } finally {
      this.设置忙碌(false)
    }
  }

  private 返回选择(): void {
    this.分析结果 = null
    this.元素<HTMLElement>('result').hidden = true
    this.清除消息()
  }

  private 重新开始(): void {
    this.分析结果 = null
    this.嫁接结果 = null
    this.元素<HTMLElement>('result').hidden = true
    this.元素<HTMLElement>('graft-result').hidden = true
    this.清除消息()
  }

  private async 复制命令(id: string): Promise<void> {
    let command = this.元素<HTMLElement>(id).textContent
    await navigator.clipboard.writeText(command)
    this.显示消息(`已复制：${command}`, 'success')
  }

  protected override async 当加载时(): Promise<void> {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100%;
          color: #162033;
          background:
            radial-gradient(circle at 10% 0%, rgba(77, 119, 255, .14), transparent 30rem),
            radial-gradient(circle at 95% 8%, rgba(30, 190, 166, .11), transparent 26rem),
            #f6f8fc;
          font-family: Inter, "Segoe UI", "Microsoft YaHei", sans-serif;
        }
        * { box-sizing: border-box; }
        .shell { width: min(1040px, calc(100% - 40px)); margin: 0 auto; padding: 52px 0 64px; }
        header { display: flex; align-items: flex-start; gap: 18px; margin-bottom: 30px; }
        .mark {
          width: 54px; height: 54px; border-radius: 17px; display: grid; place-items: center;
          color: white; font: 800 22px/1 monospace;
          background: linear-gradient(145deg, #4f6df5, #7657da);
          box-shadow: 0 13px 30px rgba(79, 109, 245, .28);
        }
        h1 { margin: 1px 0 6px; font-size: 27px; letter-spacing: -.4px; }
        .subtitle { margin: 0; color: #647087; line-height: 1.6; }
        .card {
          background: rgba(255, 255, 255, .94); border: 1px solid #e3e8f2; border-radius: 18px;
          padding: 24px; margin-top: 18px; box-shadow: 0 12px 35px rgba(35, 50, 80, .07);
        }
        .field { display: grid; grid-template-columns: 112px minmax(0, 1fr) 92px; gap: 12px; align-items: center; margin: 13px 0; }
        label { font-weight: 650; font-size: 14px; color: #364158; }
        input, select {
          width: 100%; height: 42px; border: 1px solid #d7deea; border-radius: 10px;
          padding: 0 13px; color: #253047; background: #fbfcfe; outline: none; font: inherit;
        }
        input:focus, select:focus { border-color: #617af2; box-shadow: 0 0 0 3px rgba(97, 122, 242, .12); }
        button {
          height: 42px; border: 0; border-radius: 10px; padding: 0 16px; cursor: pointer;
          color: #344057; background: #edf0f6; font-weight: 650; transition: transform .12s, background .12s;
        }
        button:hover:not(:disabled) { transform: translateY(-1px); background: #e2e7f1; }
        button:disabled { cursor: not-allowed; opacity: .5; }
        button.primary { color: white; background: linear-gradient(135deg, #526ff5, #6f5bd9); }
        button.primary:hover:not(:disabled) { background: linear-gradient(135deg, #4664ea, #624ecb); }
        button.danger { color: #a33a48; background: #fff0f2; }
        .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
        .message { margin-top: 16px; padding: 12px 14px; border-radius: 10px; font-size: 14px; background: #eef3ff; color: #3d579d; }
        .message[data-type="success"] { background: #eaf9f4; color: #24755f; }
        .message[data-type="error"] { background: #fff0f2; color: #a33a48; }
        h2 { font-size: 17px; margin: 0 0 18px; }
        .step {
          display: inline-grid; place-items: center; width: 28px; height: 28px; margin-right: 9px;
          border-radius: 9px; color: #526ff5; background: #edf0ff; font-size: 13px;
        }
        .commit-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; }
        .commit { min-width: 0; padding: 16px; border-radius: 13px; background: #f7f9fd; border: 1px solid #e6eaf2; }
        .commit-label { color: #778197; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
        .commit-title { margin: 9px 0 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 650; }
        .meta { display: flex; gap: 9px; flex-wrap: wrap; color: #778197; font: 12px/1.5 ui-monospace, monospace; }
        .facts { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 16px; color: #5f6b80; font-size: 13px; }
        .facts strong { color: #253047; }
        .command-row { display: grid; grid-template-columns: 74px 1fr 74px; gap: 10px; align-items: center; margin-top: 11px; }
        code { overflow: auto; padding: 11px 13px; border-radius: 9px; color: #33415e; background: #f1f4f9; font: 13px/1.4 ui-monospace, monospace; }
        .note { color: #66738a; line-height: 1.6; margin: 0 0 16px; }
        @media (max-width: 760px) {
          .shell { width: min(100% - 24px, 1040px); padding-top: 28px; }
          .field { grid-template-columns: 1fr 80px; }
          .field label { grid-column: 1 / -1; }
          .commit-grid { grid-template-columns: 1fr; }
          .command-row { grid-template-columns: 1fr 66px; }
          .command-row > span { grid-column: 1 / -1; }
        }
      </style>
      <main class="shell">
        <header>
          <div class="mark">↗</div>
          <div>
            <h1>Template Sync</h1>
            <p class="subtitle">找回项目与模板丢失的共同历史，生成可供 merge 或 rebase 的本地模板分支。</p>
          </div>
        </header>

        <section class="card">
          <h2><span class="step">1</span>选择项目和模板</h2>
          <div class="field">
            <label for="project-path">项目仓库</label>
            <input id="project-path" readonly placeholder="选择基于模板创建的项目目录" />
            <button id="select-project">选择</button>
          </div>
          <div class="field">
            <label for="template-path">模板仓库</label>
            <input id="template-path" readonly placeholder="选择模板目录" />
            <button id="select-template">选择</button>
          </div>
          <div class="field">
            <label for="template-branch">模板分支</label>
            <select id="template-branch"><option value="">请先选择模板仓库</option></select>
            <span></span>
          </div>
          <div class="actions">
            <button class="primary" id="analyze">继续</button>
          </div>
          <div class="message" id="message" hidden></div>
        </section>

        <section class="card" id="result" hidden>
          <h2><span class="step">2</span>确认嫁接信息</h2>
          <div class="commit-grid">
            <article class="commit">
              <div class="commit-label">项目起点</div>
              <div class="commit-title" id="project-root-subject"></div>
              <div class="meta"><span id="project-root-hash"></span><span id="project-root-time"></span></div>
            </article>
            <article class="commit">
              <div class="commit-label">匹配的模板提交</div>
              <div class="commit-title" id="template-root-subject"></div>
              <div class="meta"><span id="template-root-hash"></span><span id="template-root-time"></span></div>
            </article>
            <article class="commit">
              <div class="commit-label">模板最新提交</div>
              <div class="commit-title" id="template-tip-subject"></div>
              <div class="meta"><span id="template-tip-hash"></span><span id="template-tip-time"></span></div>
            </article>
          </div>
          <div class="facts">
            <span>模板更新 <strong id="update-count"></strong> 个提交</span>
            <span>嫁接入口 <strong id="boundary-count"></strong> 个</span>
            <span>更早模板历史不会进入输出分支</span>
          </div>
          <div class="field">
            <label for="output-branch">输出分支</label>
            <input id="output-branch" placeholder="例如 template-sync/20260731-120000" spellcheck="false" />
            <span></span>
          </div>
          <p class="note">将创建一个全新的普通本地分支；已有同名分支不会被覆盖。</p>
          <div class="actions">
            <button id="back">返回修改</button>
            <button class="primary" id="create-graft">确认并创建分支</button>
          </div>
        </section>

        <section class="card" id="graft-result" hidden>
          <h2><span class="step">3</span>分支创建完成</h2>
          <p class="note" id="connected-note"></p>
          <div class="facts">
            <span>导入分支 <strong id="graft-branch"></strong></span>
            <span>重建提交 <strong id="rewritten-count"></strong> 个</span>
          </div>
          <div class="command-row">
            <span>合并</span><code id="merge-command"></code><button id="copy-merge">复制</button>
          </div>
          <div class="command-row">
            <span>变基</span><code id="rebase-command"></code><button id="copy-rebase">复制</button>
          </div>
          <div class="actions">
            <button id="open-project">打开项目目录</button>
            <button id="restart">创建另一个分支</button>
          </div>
        </section>
      </main>
    `

    this.元素<HTMLButtonElement>('select-project').onclick = async (): Promise<void> => await this.选择项目()
    this.元素<HTMLButtonElement>('select-template').onclick = async (): Promise<void> => await this.选择模板()
    this.元素<HTMLButtonElement>('analyze').onclick = async (): Promise<void> => await this.分析()
    this.元素<HTMLButtonElement>('create-graft').onclick = async (): Promise<void> => await this.创建嫁接()
    this.元素<HTMLButtonElement>('back').onclick = (): void => this.返回选择()
    this.元素<HTMLButtonElement>('restart').onclick = (): void => this.重新开始()
    this.元素<HTMLButtonElement>('copy-merge').onclick = async (): Promise<void> => await this.复制命令('merge-command')
    this.元素<HTMLButtonElement>('copy-rebase').onclick = async (): Promise<void> =>
      await this.复制命令('rebase-command')
    this.元素<HTMLButtonElement>('open-project').onclick = async (): Promise<void> =>
      await window.electronAPI.打开目录(this.项目路径)
  }
}
