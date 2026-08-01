var t=globalThis,e={},i={},a=t.parcelRequire3c83;null==a&&((a=function(t){if(t in e)return e[t].exports;if(t in i){var a=i[t];delete i[t];var s={id:t,exports:{}};return e[t]=s,a.call(s.exports,s,s.exports),s.exports}var r=Error("Cannot find module '"+t+"'");throw r.code="MODULE_NOT_FOUND",r}).register=function(t,e){i[t]=e},t.parcelRequire3c83=a),(0,a.register)("5aoCv",function(t,e){Object.defineProperty(t.exports,"首页组件",{get:()=>r,set:void 0,enumerable:!0,configurable:!0});var i=a("8HIZi");function s(t){if(t instanceof Error){let e=t.message.match(/Error invoking remote method '[^']+': Error: (.*)$/s);return e?.[1]??t.message}return String(t)}class r extends i.组件基类{static{this.注册组件("lsby-index",this)}元素(t){let e=this.shadow.getElementById(t);if(null===e)throw Error(`\u{7F3A}\u{5C11}\u{754C}\u{9762}\u{5143}\u{7D20}\u{FF1A}${t}`);return e}当前参数(){let t=this.元素("template-branch").value;if(""===this.项目路径)throw Error("请选择项目仓库");if(""===this.模板路径)throw Error("请选择模板仓库");if(""===t)throw Error("请选择模板分支");return{项目路径:this.项目路径,模板路径:this.模板路径,模板分支:t}}当前创建参数(){let t=this.元素("output-branch").value.trim();if(""===t)throw Error("请输入输出分支名称");return{...this.当前参数(),输出分支:t}}设置忙碌(t){for(let e of this.shadow.querySelectorAll("button"))e.disabled=t;this.元素("template-branch").disabled=t,this.元素("output-branch").disabled=t}显示消息(t,e="info"){let i=this.元素("message");i.textContent=t,i.dataset.type=e,i.hidden=!1}清除消息(){this.元素("message").hidden=!0}设置路径(t,e){"project"===t?this.项目路径=e:this.模板路径=e,this.元素(`${t}-path`).value=e,this.分析结果=null,this.嫁接结果=null,this.元素("result").hidden=!0,this.元素("graft-result").hidden=!0}async 选择项目(){let t=await window.electronAPI.选择目录();null!==t&&this.设置路径("project",t)}async 选择模板(){let t=await window.electronAPI.选择目录();if(null!==t){this.设置路径("template",t),this.设置忙碌(!0);try{let e=await window.electronAPI.列出模板分支(t);this.元素("template-branch").replaceChildren(...e.map(t=>{let e=document.createElement("option");return e.value=t,e.textContent=t,e})),this.清除消息()}catch(t){this.显示消息(s(t),"error")}finally{this.设置忙碌(!1)}}}填充提交(t,e){var i;this.元素(`${t}-hash`).textContent=e.哈希.slice(0,8),this.元素(`${t}-subject`).textContent=""!==e.标题?e.标题:"（无提交说明）",this.元素(`${t}-time`).textContent=(i=e.提交时间,new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(1e3*i)))}async 分析(){this.设置忙碌(!0),this.清除消息();try{let t,e,i,a,s=await window.electronAPI.分析仓库(this.当前参数());this.分析结果=s,this.嫁接结果=null,this.填充提交("project-root",s.项目起点),this.填充提交("template-root",s.模板起点),this.填充提交("template-tip",s.模板最新),this.元素("update-count").textContent=String(s.更新提交数),this.元素("boundary-count").textContent=String(s.边界提交.length),this.元素("output-branch").value=(t=new Date,e=t=>String(t).padStart(2,"0"),i=`${t.getFullYear()}${e(t.getMonth()+1)}${e(t.getDate())}`,a=`${e(t.getHours())}${e(t.getMinutes())}${e(t.getSeconds())}`,`template-sync/${i}-${a}`),this.元素("result").hidden=!1,this.元素("graft-result").hidden=!0,this.显示消息("匹配成功。请确认关键信息和输出分支名称。","success")}catch(t){this.元素("result").hidden=!0,this.显示消息(s(t),"error")}finally{this.设置忙碌(!1)}}async 创建嫁接(){this.设置忙碌(!0),this.清除消息();try{let t=await window.electronAPI.创建嫁接(this.当前创建参数());this.嫁接结果=t,this.元素("graft-branch").textContent=t.导入分支,this.元素("rewritten-count").textContent=String(t.重建提交数),this.元素("merge-command").textContent=t.合并命令,this.元素("rebase-command").textContent=t.变基命令,this.元素("connected-note").textContent=0===t.重建提交数?"模板没有新的提交，导入分支直接指向项目起点。":`\u{5DF2}\u{5C06}\u{6A21}\u{677F}\u{516C}\u{5171}\u{70B9}\u{4E4B}\u{540E}\u{7684} ${t.重建提交数} \u{4E2A}\u{63D0}\u{4EA4}\u{91CD}\u{5EFA}\u{5230}\u{9879}\u{76EE}\u{8D77}\u{70B9}\u{4E0A}\u{FF1B}\u{66F4}\u{65E9}\u{7684}\u{6A21}\u{677F}\u{5386}\u{53F2}\u{4E0D}\u{4F1A}\u{88AB}\u{5F15}\u{5165}\u{3002}`,this.元素("graft-result").hidden=!1,this.元素("result").hidden=!0,this.显示消息("分支创建完成。它现在是项目仓库中的普通本地分支。","success")}catch(t){this.显示消息(s(t),"error")}finally{this.设置忙碌(!1)}}返回选择(){this.分析结果=null,this.元素("result").hidden=!0,this.清除消息()}重新开始(){this.分析结果=null,this.嫁接结果=null,this.元素("result").hidden=!0,this.元素("graft-result").hidden=!0,this.清除消息()}async 复制命令(t){let e=this.元素(t).textContent;await navigator.clipboard.writeText(e),this.显示消息(`\u{5DF2}\u{590D}\u{5236}\u{FF1A}${e}`,"success")}async 当加载时(){this.shadow.innerHTML=`
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
          <div class="mark">\u{2197}</div>
          <div>
            <h1>Template Sync</h1>
            <p class="subtitle">\u{627E}\u{56DE}\u{9879}\u{76EE}\u{4E0E}\u{6A21}\u{677F}\u{4E22}\u{5931}\u{7684}\u{5171}\u{540C}\u{5386}\u{53F2}\u{FF0C}\u{751F}\u{6210}\u{53EF}\u{4F9B} merge \u{6216} rebase \u{7684}\u{672C}\u{5730}\u{6A21}\u{677F}\u{5206}\u{652F}\u{3002}</p>
          </div>
        </header>

        <section class="card">
          <h2><span class="step">1</span>\u{9009}\u{62E9}\u{9879}\u{76EE}\u{548C}\u{6A21}\u{677F}</h2>
          <div class="field">
            <label for="project-path">\u{9879}\u{76EE}\u{4ED3}\u{5E93}</label>
            <input id="project-path" readonly placeholder="\u{9009}\u{62E9}\u{57FA}\u{4E8E}\u{6A21}\u{677F}\u{521B}\u{5EFA}\u{7684}\u{9879}\u{76EE}\u{76EE}\u{5F55}" />
            <button id="select-project">\u{9009}\u{62E9}</button>
          </div>
          <div class="field">
            <label for="template-path">\u{6A21}\u{677F}\u{4ED3}\u{5E93}</label>
            <input id="template-path" readonly placeholder="\u{9009}\u{62E9}\u{6A21}\u{677F}\u{76EE}\u{5F55}" />
            <button id="select-template">\u{9009}\u{62E9}</button>
          </div>
          <div class="field">
            <label for="template-branch">\u{6A21}\u{677F}\u{5206}\u{652F}</label>
            <select id="template-branch"><option value="">\u{8BF7}\u{5148}\u{9009}\u{62E9}\u{6A21}\u{677F}\u{4ED3}\u{5E93}</option></select>
            <span></span>
          </div>
          <div class="actions">
            <button class="primary" id="analyze">\u{7EE7}\u{7EED}</button>
          </div>
          <div class="message" id="message" hidden></div>
        </section>

        <section class="card" id="result" hidden>
          <h2><span class="step">2</span>\u{786E}\u{8BA4}\u{5AC1}\u{63A5}\u{4FE1}\u{606F}</h2>
          <div class="commit-grid">
            <article class="commit">
              <div class="commit-label">\u{9879}\u{76EE}\u{8D77}\u{70B9}</div>
              <div class="commit-title" id="project-root-subject"></div>
              <div class="meta"><span id="project-root-hash"></span><span id="project-root-time"></span></div>
            </article>
            <article class="commit">
              <div class="commit-label">\u{5339}\u{914D}\u{7684}\u{6A21}\u{677F}\u{63D0}\u{4EA4}</div>
              <div class="commit-title" id="template-root-subject"></div>
              <div class="meta"><span id="template-root-hash"></span><span id="template-root-time"></span></div>
            </article>
            <article class="commit">
              <div class="commit-label">\u{6A21}\u{677F}\u{6700}\u{65B0}\u{63D0}\u{4EA4}</div>
              <div class="commit-title" id="template-tip-subject"></div>
              <div class="meta"><span id="template-tip-hash"></span><span id="template-tip-time"></span></div>
            </article>
          </div>
          <div class="facts">
            <span>\u{6A21}\u{677F}\u{66F4}\u{65B0} <strong id="update-count"></strong> \u{4E2A}\u{63D0}\u{4EA4}</span>
            <span>\u{5AC1}\u{63A5}\u{5165}\u{53E3} <strong id="boundary-count"></strong> \u{4E2A}</span>
            <span>\u{66F4}\u{65E9}\u{6A21}\u{677F}\u{5386}\u{53F2}\u{4E0D}\u{4F1A}\u{8FDB}\u{5165}\u{8F93}\u{51FA}\u{5206}\u{652F}</span>
          </div>
          <div class="field">
            <label for="output-branch">\u{8F93}\u{51FA}\u{5206}\u{652F}</label>
            <input id="output-branch" placeholder="\u{4F8B}\u{5982} template-sync/20260731-120000" spellcheck="false" />
            <span></span>
          </div>
          <p class="note">\u{5C06}\u{521B}\u{5EFA}\u{4E00}\u{4E2A}\u{5168}\u{65B0}\u{7684}\u{666E}\u{901A}\u{672C}\u{5730}\u{5206}\u{652F}\u{FF1B}\u{5DF2}\u{6709}\u{540C}\u{540D}\u{5206}\u{652F}\u{4E0D}\u{4F1A}\u{88AB}\u{8986}\u{76D6}\u{3002}</p>
          <div class="actions">
            <button id="back">\u{8FD4}\u{56DE}\u{4FEE}\u{6539}</button>
            <button class="primary" id="create-graft">\u{786E}\u{8BA4}\u{5E76}\u{521B}\u{5EFA}\u{5206}\u{652F}</button>
          </div>
        </section>

        <section class="card" id="graft-result" hidden>
          <h2><span class="step">3</span>\u{5206}\u{652F}\u{521B}\u{5EFA}\u{5B8C}\u{6210}</h2>
          <p class="note" id="connected-note"></p>
          <div class="facts">
            <span>\u{5BFC}\u{5165}\u{5206}\u{652F} <strong id="graft-branch"></strong></span>
            <span>\u{91CD}\u{5EFA}\u{63D0}\u{4EA4} <strong id="rewritten-count"></strong> \u{4E2A}</span>
          </div>
          <div class="command-row">
            <span>\u{5408}\u{5E76}</span><code id="merge-command"></code><button id="copy-merge">\u{590D}\u{5236}</button>
          </div>
          <div class="command-row">
            <span>\u{53D8}\u{57FA}</span><code id="rebase-command"></code><button id="copy-rebase">\u{590D}\u{5236}</button>
          </div>
          <div class="actions">
            <button id="open-project">\u{6253}\u{5F00}\u{9879}\u{76EE}\u{76EE}\u{5F55}</button>
            <button id="restart">\u{521B}\u{5EFA}\u{53E6}\u{4E00}\u{4E2A}\u{5206}\u{652F}</button>
          </div>
        </section>
      </main>
    `,this.元素("select-project").onclick=async()=>await this.选择项目(),this.元素("select-template").onclick=async()=>await this.选择模板(),this.元素("analyze").onclick=async()=>await this.分析(),this.元素("create-graft").onclick=async()=>await this.创建嫁接(),this.元素("back").onclick=()=>this.返回选择(),this.元素("restart").onclick=()=>this.重新开始(),this.元素("copy-merge").onclick=async()=>await this.复制命令("merge-command"),this.元素("copy-rebase").onclick=async()=>await this.复制命令("rebase-command"),this.元素("open-project").onclick=async()=>await window.electronAPI.打开目录(this.项目路径)}constructor(...t){super(...t),this.项目路径="",this.模板路径="",this.分析结果=null,this.嫁接结果=null}}});