import { 组件基类 } from '../../base/base'
import './landing-demo'
import './landing-footer'
import './landing-header'

type 发出事件类型 = {}
type 监听事件类型 = {}

export class 落地页组件 extends 组件基类<发出事件类型, 监听事件类型> {
  static {
    this.注册组件('template-sync-landing', this)
  }

  private 元素<T extends HTMLElement>(id: string): T {
    let element = this.shadow.getElementById(id)
    if (element === null) throw new Error(`缺少界面元素：${id}`)
    return element as T
  }

  public async 当加载时(): Promise<void> {
    let isElectron = typeof (window as unknown as { electronAPI?: unknown }).electronAPI !== 'undefined'

    // 若在 Electron 容器中，自动重定向到主工具页
    if (isElectron === true) {
      window.location.replace('./main.html')
      return
    }

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-height: 100vh;
          background-color: #090d16;
          color: #f1f5f9;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        .bg-glow {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 1000px;
          height: 600px;
          background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15), rgba(56, 189, 248, 0.08), transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .container {
          position: relative;
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 24px;
          z-index: 1;
        }

        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #38bdf8);
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 18px;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          border: 1px solid transparent;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
          background: linear-gradient(135deg, #4f46e5, #4338ca);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .hero {
          text-align: center;
          padding: 96px 0 64px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 9999px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: #a5b4fc;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .hero h1 {
          font-size: 52px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin: 0 0 24px;
          background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          max-width: 680px;
          margin: 0 auto 40px;
          font-size: 18px;
          line-height: 1.6;
          color: #94a3b8;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          padding: 64px 0;
        }

        .card {
          background: rgba(18, 24, 39, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: grid;
          place-items: center;
          color: #818cf8;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 20px;
        }

        .card h3 {
          font-size: 19px;
          font-weight: 700;
          margin: 0 0 12px;
          color: #f8fafc;
        }

        .card p {
          font-size: 14px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 0;
        }

        .workflow {
          padding: 64px 0 96px;
          text-align: center;
        }

        .section-header {
          margin-bottom: 48px;
        }

        .section-header h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px;
        }

        .section-header p {
          color: #94a3b8;
          font-size: 16px;
          margin: 0;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          position: relative;
        }

        .step-card {
          background: #111625;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 24px;
          text-align: left;
        }

        .step-num {
          display: inline-block;
          font-size: 12px;
          font-weight: 800;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
          margin-bottom: 14px;
        }

        .step-card h4 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #f1f5f9;
        }

        .step-card p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        footer {
          padding: 40px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        /* 背景痛点模块 */
        .context-module {
          display: flex;
          gap: 32px;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
          align-items: center;
        }

        .context-text {
          flex: 1;
        }

        .context-text h4 {
          font-size: 18px;
          color: #f1f5f9;
          margin: 0 0 16px 0;
        }

        .context-text p {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.7;
          margin: 0 0 12px 0;
        }

        .context-text .highlight {
          margin-top: 20px;
          padding: 12px 16px;
          background: rgba(99, 102, 241, 0.1);
          border-left: 3px solid #818cf8;
          color: #c7d2fe;
          font-size: 14px;
          border-radius: 4px;
        }

        .context-illustration {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: rgba(0, 0, 0, 0.2);
          padding: 24px;
          border-radius: 12px;
        }

        .illus-box {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          width: 140px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .illus-box.tmpl { border-color: rgba(56, 189, 248, 0.3); }
        .illus-box.proj { border-color: rgba(251, 146, 60, 0.3); }

        .illus-title {
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
        }
        .illus-box.tmpl .illus-title { color: #38bdf8; }
        .illus-box.proj .illus-title { color: #fb923c; }

        .illus-file {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 11px;
          color: #cbd5e1;
          padding: 6px 8px;
          text-align: center;
        }
        .illus-file.updated {
          color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
        }

        .illus-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #ef4444;
          gap: 8px;
        }

        .illus-arrow span {
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        @media (max-width: 868px) {
          .hero h1 { font-size: 36px; }
          .features, .steps-grid { grid-template-columns: 1fr; }
          .context-module { flex-direction: column; }
        }
      </style>

      <div class="bg-glow"></div>

      <template-sync-landing-header></template-sync-landing-header>

      <div class="container">

        <main>
          <section class="hero">
            <div class="badge">Git 模板同步重建方案</div>
            <h1>告别人肉比对<br />让 Git 帮你合模板</h1>
            <p>
              帮项目重新搭上模板的 Git 班车，轻松拉取并合并上游的所有功能与修复。
            </p>
            <div class="hero-actions">
              <a href="https://github.com/lsby/template-sync" target="_blank" class="btn btn-primary">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                View on GitHub
              </a>
            </div>
          </section>

          <div class="context-module">
            <div class="context-text">
              <h4>模板升级的噩梦</h4>
              <p>日常开发中，我们往往通过下载压缩包或拷贝代码来初始化项目。几个月后，上游模板发布了重大更新（修复了致命 Bug，或推出了新特性）。</p>
              <p>由于您的项目脱离了模板的 Git 历史，传统的升级方式极其痛苦：您必须<strong>手工逐个比对文件</strong>，小心翼翼地把更新内容复制粘贴过来，不仅极易出错且耗费大量时间。</p>
              <div class="highlight">
                Template Sync 就是为了解决这个痛点而生：它可以为您找回丢失的 Git 历史，让您能优雅地使用标准 Git 命令合并更新！
              </div>
            </div>
            <div class="context-illustration">
               <div class="illus-box tmpl">
                  <span class="illus-title">开源模板 (v2.0)</span>
                  <div class="illus-file updated">App.vue (更新)</div>
                  <div class="illus-file updated">utils.ts (新增)</div>
                  <div class="illus-file">其他文件...</div>
               </div>
               <div class="illus-arrow">
                  <svg width="40" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <span>手工比对复制</span>
                  <span style="opacity: 0.7; font-weight: normal;">(枯燥且易错)</span>
               </div>
               <div class="illus-box proj">
                  <span class="illus-title">您的项目</span>
                  <div class="illus-file">App.vue (被魔改)</div>
                  <div class="illus-file">业务逻辑...</div>
                  <div class="illus-file">其他文件...</div>
               </div>
            </div>
          </div>

          <template-sync-demo></template-sync-demo>
        </main>
      </div>

      <template-sync-landing-footer></template-sync-landing-footer>
    `
  }
}
