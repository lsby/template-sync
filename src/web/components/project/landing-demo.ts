import { 组件基类 } from '../../base/base'

type 剧本步骤 = { 阶段标记: 'pain' | 'solution' | 'match' | 'rewrite' | 'graft'; 标题: string; 说明: string }

let 演示步骤列表: 剧本步骤[] = [
  {
    阶段标记: 'pain',
    标题: '步骤 1：孤立的 Git 历史',
    说明: '由于项目当初是通过复制文件建立的，您的业务代码与开源模板在 Git 中是两棵完全孤立的树。想要告别痛苦的手工复制，第一步就是必须让它们重新建立起血缘关系。',
  },
  {
    阶段标记: 'solution',
    标题: '步骤 2：破局 (Tree Hash 原理)',
    说明: 'Template Sync 的核心思路是：即使没有相同的 Commit Hash，只要初始状态的文件内容完全一致，它们的 Tree Hash 就是相同的。我们需要在模板漫长的历史中，找到那个真实的“起源”版本。',
  },
  {
    阶段标记: 'match',
    标题: '步骤 3：匹配 (寻根与对齐)',
    说明: '系统自动扫描，发现项目起点（P1）的 Tree Hash 恰好与模板历史中间的某个提交（T3）完美匹配。T3 就是我们项目的真实起源点！',
  },
  {
    阶段标记: 'rewrite',
    标题: '步骤 4：重构 (重写 Parent 拓扑)',
    说明: '接下来，提取模板在 T3 之后的所有更新（T4, T5），不改变其文件内容和作者信息，仅仅将它们内部的 Parent 指针，动态“嫁接”到您的项目起点 P1 上。',
  },
  {
    阶段标记: 'graft',
    标题: '步骤 5：融合 (无缝合并更新)',
    说明: '最终生成一个纯本地的分支（图中绿色节点）。现在，它与您的项目拥有了共同的祖先 P1，您可以像普通分支一样，用 git merge 干净利落地将模板最新特性融入业务代码！',
  },
]

export class 落地页演示组件 extends 组件基类<{}, {}> {
  static {
    this.注册组件('template-sync-demo', this)
  }

  private 当前步骤 = 0

  private 元素<T extends HTMLElement>(id: string): T {
    let element = this.shadow.getElementById(id)
    if (element === null) throw new Error(`缺少界面元素：${id}`)
    return element as T
  }

  public async 当加载时(): Promise<void> {
    this.render()
    this.更新步骤视图()
  }

  private render(): void {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          margin: 40px 0 64px;
        }

        .demo-box {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }

        .demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .demo-title-group h3 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #f8fafc;
        }

        .demo-title-group p {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-ctrl {
          height: 38px;
          padding: 0 16px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-ctrl:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        .btn-ctrl:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* 步骤指示栏 */
        .step-indicators {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 32px;
        }

        .indicator-item {
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .indicator-item.active {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .indicator-item .step-num {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }

        .indicator-item.active .step-num {
          color: #818cf8;
        }

        .indicator-item .step-label {
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .indicator-item.active .step-label {
          color: #ffffff;
        }

        /* 可视化动画画布区域 */
        .stage-canvas {
          background: #090d16;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 24px;
          min-height: 380px;
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .graph-container {
          position: relative;
          width: 950px;
          height: 300px;
          transform-origin: center center;
        }

        svg.git-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .git-path {
          fill: none;
          stroke-width: 4px;
          transition: all 0.5s ease;
        }

        .path-tmpl { stroke: #38bdf8; }
        .path-proj { stroke: #fb923c; }
        .path-graft { stroke: #22c55e; stroke-dasharray: 8 4; animation: march 1s linear infinite; }
        .path-match { stroke: #a855f7; stroke-dasharray: 6 4; opacity: 0; transition: opacity 0.5s ease; }

        @keyframes march {
          to { stroke-dashoffset: -12; }
        }

        /* Git 节点 */
        .git-node {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translate(-50%, -15px); /* Center dot on coordinate */
          width: 120px;
          transition: all 0.5s ease;
        }

        .git-dot {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 4px solid #090d16;
          box-shadow: 0 0 0 2px transparent;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .node-tmpl .git-dot { background: #38bdf8; }
        .node-proj .git-dot { background: #fb923c; }
        .node-graft .git-dot { background: #22c55e; }

        .git-label {
          margin-top: 8px;
          text-align: center;
        }

        .git-label .hash {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          display: block;
        }

        .git-label .desc {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
          display: block;
        }

        /* 标签指示器 (Branch Labels) */
        .branch-tag {
          position: absolute;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          transform: translateY(-50%);
        }
        .tag-tmpl { background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; }
        .tag-proj { background: rgba(251, 146, 60, 0.2); border: 1px solid #fb923c; color: #fb923c; }
        .tag-graft { background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #22c55e; }

        /* 动画状态类 */
        .stage-solution .node-tmpl-3 .git-dot,
        .stage-solution .node-proj-1 .git-dot,
        .stage-match .node-tmpl-3 .git-dot,
        .stage-match .node-proj-1 .git-dot,
        .stage-rewrite .node-tmpl-3 .git-dot,
        .stage-rewrite .node-proj-1 .git-dot,
        .stage-graft .node-tmpl-3 .git-dot,
        .stage-graft .node-proj-1 .git-dot {
          box-shadow: 0 0 15px 4px rgba(168, 85, 247, 0.6);
          border-color: #a855f7;
        }

        .stage-rewrite .node-tmpl-4 .git-dot,
        .stage-rewrite .node-tmpl-5 .git-dot {
          box-shadow: 0 0 15px 4px rgba(56, 189, 248, 0.8);
          border-color: #38bdf8;
          transform: scale(1.1);
        }

        .stage-match .path-match,
        .stage-rewrite .path-match,
        .stage-graft .path-match {
          opacity: 1;
        }

        .node-hidden {
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 0px) scale(0.5);
        }

        /* 解说文字区 */
        .explanation-box {
          margin-top: 24px;
          padding: 20px 24px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(99, 102, 241, 0.25);
        }

        .explanation-title {
          font-size: 15px;
          font-weight: 700;
          color: #a5b4fc;
          margin: 0 0 8px;
        }

        .explanation-text {
          font-size: 14px;
          line-height: 1.6;
          color: #cbd5e1;
          margin: 0;
        }

        @media (max-width: 900px) {
          .graph-container {
            transform: scale(0.8);
          }
        }
        @media (max-width: 700px) {
          .step-indicators { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .graph-container {
            transform: scale(0.5);
          }
          .stage-canvas { min-height: 200px; padding: 10px; }
        }
      </style>

      <div class="demo-box">
        <div class="demo-header">
          <div class="demo-title-group">
            <h3>Git 历史嫁接交互演示</h3>
            <p>观察 Template Sync 如何将独立的代码拷贝精准物化为关联的分支</p>
          </div>
          <div class="controls">
            <button class="btn-ctrl" id="btn-prev">上一步</button>
            <button class="btn-ctrl" id="btn-next">下一步</button>
            <button class="btn-ctrl" id="btn-reset">重置</button>
          </div>
        </div>

        <div class="step-indicators">
          ${演示步骤列表
            .map(
              (step, idx) => `
            <div class="indicator-item ${idx === 0 ? 'active' : ''}" id="indicator-${idx}">
              <span class="step-num">STAGE 0${idx + 1}</span>
              <span class="step-label">${step.标题.split('：')[1]}</span>
            </div>
          `,
            )
            .join('')}
        </div>

        <div class="stage-canvas">
          <div class="graph-container" id="graph-container">
            <svg class="git-lines">
              <!-- Template Branch Line -->
              <path class="git-path path-tmpl" d="M 100 50 L 250 50 L 400 50 L 550 50 L 700 50" />
              <!-- Project Branch Line -->
              <path class="git-path path-proj" d="M 400 250 L 550 250 L 700 250" />
              <!-- Match Line -->
              <path class="git-path path-match" d="M 400 50 L 400 250" />
              <!-- Graft Branch Line -->
              <path class="git-path path-graft" id="path-graft-line" d="M 400 250 C 475 250, 475 150, 550 150 L 700 150" />
            </svg>

            <!-- Template Nodes (Row 1: y=50) -->
            <div class="branch-tag tag-tmpl" style="left: 780px; top: 50px;">模板分支 (master)</div>
            <div class="git-node node-tmpl" style="left: 100px; top: 50px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T1</span><span class="desc">v1.0.0</span></div>
            </div>
            <div class="git-node node-tmpl" style="left: 250px; top: 50px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T2</span><span class="desc">v1.1.0</span></div>
            </div>
            <div class="git-node node-tmpl node-tmpl-3" style="left: 400px; top: 50px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T3</span><span class="desc">v1.2.0 (Tree: hash_A)</span></div>
            </div>
            <div class="git-node node-tmpl node-tmpl-4" style="left: 550px; top: 50px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T4</span><span class="desc">v1.3.0</span></div>
            </div>
            <div class="git-node node-tmpl node-tmpl-5" style="left: 700px; top: 50px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T5</span><span class="desc">v2.0.0</span></div>
            </div>

            <!-- Grafted Nodes (Row 2: y=150) -->
            <div class="branch-tag tag-graft" id="tag-graft" style="left: 780px; top: 150px;">生成的分支 (template-sync)</div>
            <div class="git-node node-graft node-hidden" id="node-graft-4" style="left: 550px; top: 150px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T4'</span><span class="desc">Parent 重写</span></div>
            </div>
            <div class="git-node node-graft node-hidden" id="node-graft-5" style="left: 700px; top: 150px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T5'</span><span class="desc">Tip</span></div>
            </div>

            <!-- Project Nodes (Row 3: y=250) -->
            <div class="branch-tag tag-proj" style="left: 780px; top: 250px;">您的项目 (main)</div>
            <div class="git-node node-proj node-proj-1" style="left: 400px; top: 250px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">P1</span><span class="desc">起点 (Tree: hash_A)</span></div>
            </div>
            <div class="git-node node-proj" style="left: 550px; top: 250px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">P2</span><span class="desc">业务开发</span></div>
            </div>
            <div class="git-node node-proj" style="left: 700px; top: 250px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">P3</span><span class="desc">HEAD</span></div>
            </div>
          </div>
        </div>

        <div class="explanation-box">
          <h4 class="explanation-title" id="exp-title"></h4>
          <p class="explanation-text" id="exp-text"></p>
        </div>
      </div>
    `

    this.元素<HTMLButtonElement>('btn-prev').onclick = (): void => this.上一页()
    this.元素<HTMLButtonElement>('btn-next').onclick = (): void => this.下一页()
    this.元素<HTMLButtonElement>('btn-reset').onclick = (): void => this.重置()

    演示步骤列表.forEach((_, idx) => {
      let item = this.shadow.getElementById(`indicator-${idx}`)
      if (item !== null) {
        item.onclick = (): void => this.跳转到步骤(idx)
      }
    })
  }

  private 跳转到步骤(idx: number): void {
    this.当前步骤 = Math.max(0, Math.min(演示步骤列表.length - 1, idx))
    this.更新步骤视图()
  }

  private 上一页(): void {
    if (this.当前步骤 > 0) {
      this.当前步骤--
      this.更新步骤视图()
    }
  }

  private 下一页(): void {
    if (this.当前步骤 < 演示步骤列表.length - 1) {
      this.当前步骤++
      this.更新步骤视图()
    }
  }

  private 重置(): void {
    this.当前步骤 = 0
    this.更新步骤视图()
  }

  private 更新步骤视图(): void {
    let curr = 演示步骤列表[this.当前步骤]
    if (curr === undefined) return

    // 更新指示栏高亮
    演示步骤列表.forEach((_, idx) => {
      let item = this.shadow.getElementById(`indicator-${idx}`)
      if (item !== null) {
        if (idx === this.当前步骤) item.classList.add('active')
        else item.classList.remove('active')
      }
    })

    // 更新按钮禁用状态
    let btnPrev = this.元素<HTMLButtonElement>('btn-prev')
    let btnNext = this.元素<HTMLButtonElement>('btn-next')
    btnPrev.disabled = this.当前步骤 === 0
    btnNext.disabled = this.当前步骤 === 演示步骤列表.length - 1

    // 更新解说文字
    this.元素<HTMLElement>('exp-title').textContent = curr.标题
    this.元素<HTMLElement>('exp-text').textContent = curr.说明

    // 更新画布类名来控制动画状态
    let container = this.元素<HTMLElement>('graph-container')
    container.className = 'graph-container stage-' + curr.阶段标记

    // 控制 graft 分支的显示隐藏
    let pathGraft = this.元素<HTMLElement>('path-graft-line')
    let nodeGraft4 = this.元素<HTMLElement>('node-graft-4')
    let nodeGraft5 = this.元素<HTMLElement>('node-graft-5')
    let tagGraft = this.元素<HTMLElement>('tag-graft')

    let showGraft = curr.阶段标记 === 'graft'

    if (showGraft) {
      pathGraft.style.opacity = '1'
      nodeGraft4.classList.remove('node-hidden')
      nodeGraft5.classList.remove('node-hidden')
      tagGraft.style.opacity = '1'
    } else {
      pathGraft.style.opacity = '0'
      nodeGraft4.classList.add('node-hidden')
      nodeGraft5.classList.add('node-hidden')
      tagGraft.style.opacity = '0'
    }
  }
}
