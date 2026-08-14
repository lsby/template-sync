function t(t,e,i,a){Object.defineProperty(t,e,{get:i,set:a,enumerable:!0,configurable:!0})}var e=globalThis,i={},a={},o=e.parcelRequire3c83;null==o&&((o=function(t){if(t in i)return i[t].exports;if(t in a){var e=a[t];delete a[t];var o={id:t,exports:{}};return i[t]=o,e.call(o.exports,o,o.exports),o.exports}var n=Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}).register=function(t,e){a[t]=e},e.parcelRequire3c83=o);var n=o.register;n("4Clh9",function(e,i){function a(t,e){for(let i in e){let a=e[i];void 0!==a&&(t.style[i]=String(a))}}function o(t,e){let i=document.createElement(t);if(void 0===e)return i;let{children:o,style:n,...s}=e;for(let t in s){let e=s[t];void 0!==e&&(t.includes("-")||t.includes(":")?i.setAttribute(t,String(e)):i[t]=e)}return void 0!==n&&a(i,n),void 0!==o&&function t(e,i){if(null!=i&&"boolean"!=typeof i){if(Array.isArray(i)){for(let a of i)t(e,a);return}if("string"==typeof i||"number"==typeof i)return void e.appendChild(document.createTextNode(String(i)));if(i instanceof DocumentFragment)return void e.appendChild(i);(i instanceof HTMLElement||i instanceof SVGElement)&&e.appendChild(i)}}(i,o),i}function n(t,e){if(void 0!==e)for(let i in e){let a=e[i];void 0!==a&&t.setProperty(i,String(a))}}t(e.exports,"应用样式",()=>a),t(e.exports,"创建元素",()=>o),t(e.exports,"应用宿主样式",()=>n)}),n("gGbkw",function(e,i){t(e.exports,"落地页演示组件",()=>s);var a=o("8HIZi");let n=[{阶段标记:"pain",标题:"步骤 1：孤立的 Git 历史",说明:"由于项目当初是通过复制文件建立的，您的业务代码与开源模板在 Git 中是两棵完全孤立的树。想要告别痛苦的手工复制，第一步就是必须让它们重新建立起血缘关系。"},{阶段标记:"solution",标题:"步骤 2：破局 (Tree Hash 原理)",说明:"Template Sync 的核心思路是：即使没有相同的 Commit Hash，只要初始状态的文件内容完全一致，它们的 Tree Hash 就是相同的。我们需要在模板漫长的历史中，找到那个真实的“起源”版本。"},{阶段标记:"match",标题:"步骤 3：匹配 (寻根与对齐)",说明:"系统自动扫描，发现项目起点（P1）的 Tree Hash 恰好与模板历史中间的某个提交（T3）完美匹配。T3 就是我们项目的真实起源点！"},{阶段标记:"rewrite",标题:"步骤 4：重构 (重写 Parent 拓扑)",说明:"接下来，提取模板在 T3 之后的所有更新（T4, T5），不改变其文件内容和作者信息，仅仅将它们内部的 Parent 指针，动态“嫁接”到您的项目起点 P1 上。"},{阶段标记:"graft",标题:"步骤 5：融合 (无缝合并更新)",说明:"最终生成一个纯本地的分支（图中绿色节点）。现在，它与您的项目拥有了共同的祖先 P1，您可以像普通分支一样，用 git merge 干净利落地将模板最新特性融入业务代码！"}];class s extends a.组件基类{static{this.注册组件("template-sync-demo",this)}元素(t){let e=this.shadow.getElementById(t);if(null===e)throw Error(`\u{7F3A}\u{5C11}\u{754C}\u{9762}\u{5143}\u{7D20}\u{FF1A}${t}`);return e}async 当加载时(){this.render(),this.更新步骤视图()}render(){this.shadow.innerHTML=`
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

        /* \u{6B65}\u{9AA4}\u{6307}\u{793A}\u{680F} */
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

        /* \u{53EF}\u{89C6}\u{5316}\u{52A8}\u{753B}\u{753B}\u{5E03}\u{533A}\u{57DF} */
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

        /* Git \u{8282}\u{70B9} */
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

        /* \u{6807}\u{7B7E}\u{6307}\u{793A}\u{5668} (Branch Labels) */
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

        /* \u{52A8}\u{753B}\u{72B6}\u{6001}\u{7C7B} */
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

        /* \u{89E3}\u{8BF4}\u{6587}\u{5B57}\u{533A} */
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
            <h3>Git \u{5386}\u{53F2}\u{5AC1}\u{63A5}\u{4EA4}\u{4E92}\u{6F14}\u{793A}</h3>
            <p>\u{89C2}\u{5BDF} Template Sync \u{5982}\u{4F55}\u{5C06}\u{72EC}\u{7ACB}\u{7684}\u{4EE3}\u{7801}\u{62F7}\u{8D1D}\u{7CBE}\u{51C6}\u{7269}\u{5316}\u{4E3A}\u{5173}\u{8054}\u{7684}\u{5206}\u{652F}</p>
          </div>
          <div class="controls">
            <button class="btn-ctrl" id="btn-prev">\u{4E0A}\u{4E00}\u{6B65}</button>
            <button class="btn-ctrl" id="btn-next">\u{4E0B}\u{4E00}\u{6B65}</button>
            <button class="btn-ctrl" id="btn-reset">\u{91CD}\u{7F6E}</button>
          </div>
        </div>

        <div class="step-indicators">
          ${n.map((t,e)=>`
            <div class="indicator-item ${0===e?"active":""}" id="indicator-${e}">
              <span class="step-num">STAGE 0${e+1}</span>
              <span class="step-label">${t.标题.split("：")[1]}</span>
            </div>
          `).join("")}
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
            <div class="branch-tag tag-tmpl" style="left: 780px; top: 50px;">\u{6A21}\u{677F}\u{5206}\u{652F} (master)</div>
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
            <div class="branch-tag tag-graft" id="tag-graft" style="left: 780px; top: 150px;">\u{751F}\u{6210}\u{7684}\u{5206}\u{652F} (template-sync)</div>
            <div class="git-node node-graft node-hidden" id="node-graft-4" style="left: 550px; top: 150px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T4'</span><span class="desc">Parent \u{91CD}\u{5199}</span></div>
            </div>
            <div class="git-node node-graft node-hidden" id="node-graft-5" style="left: 700px; top: 150px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">T5'</span><span class="desc">Tip</span></div>
            </div>

            <!-- Project Nodes (Row 3: y=250) -->
            <div class="branch-tag tag-proj" style="left: 780px; top: 250px;">\u{60A8}\u{7684}\u{9879}\u{76EE} (main)</div>
            <div class="git-node node-proj node-proj-1" style="left: 400px; top: 250px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">P1</span><span class="desc">\u{8D77}\u{70B9} (Tree: hash_A)</span></div>
            </div>
            <div class="git-node node-proj" style="left: 550px; top: 250px;">
              <div class="git-dot"></div>
              <div class="git-label"><span class="hash">P2</span><span class="desc">\u{4E1A}\u{52A1}\u{5F00}\u{53D1}</span></div>
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
    `,this.元素("btn-prev").onclick=()=>this.上一页(),this.元素("btn-next").onclick=()=>this.下一页(),this.元素("btn-reset").onclick=()=>this.重置(),n.forEach((t,e)=>{let i=this.shadow.getElementById(`indicator-${e}`);null!==i&&(i.onclick=()=>this.跳转到步骤(e))})}跳转到步骤(t){this.当前步骤=Math.max(0,Math.min(n.length-1,t)),this.更新步骤视图()}上一页(){this.当前步骤>0&&(this.当前步骤--,this.更新步骤视图())}下一页(){this.当前步骤<n.length-1&&(this.当前步骤++,this.更新步骤视图())}重置(){this.当前步骤=0,this.更新步骤视图()}更新步骤视图(){let t=n[this.当前步骤];if(void 0===t)return;n.forEach((t,e)=>{let i=this.shadow.getElementById(`indicator-${e}`);null!==i&&(e===this.当前步骤?i.classList.add("active"):i.classList.remove("active"))});let e=this.元素("btn-prev"),i=this.元素("btn-next");e.disabled=0===this.当前步骤,i.disabled=this.当前步骤===n.length-1,this.元素("exp-title").textContent=t.标题,this.元素("exp-text").textContent=t.说明,this.元素("graph-container").className="graph-container stage-"+t.阶段标记;let a=this.元素("path-graft-line"),o=this.元素("node-graft-4"),s=this.元素("node-graft-5"),r=this.元素("tag-graft");"graft"===t.阶段标记?(a.style.opacity="1",o.classList.remove("node-hidden"),s.classList.remove("node-hidden"),r.style.opacity="1"):(a.style.opacity="0",o.classList.add("node-hidden"),s.classList.add("node-hidden"),r.style.opacity="0")}constructor(...t){super(...t),this.当前步骤=0}}}),n("4Tlsu",function(e,i){t(e.exports,"落地页页脚组件",()=>r);var a=o("8HIZi"),n=o("4Clh9");let s=new URL(o("9QacD")).toString();class r extends a.组件基类{static{this.注册组件("template-sync-landing-footer",this)}async 当加载时(){let t=(0,n.创建元素)("footer",{style:{padding:"40px 20px",backgroundColor:"transparent",borderTop:"1px solid rgba(255, 255, 255, 0.06)",textAlign:"center",color:"#64748b",fontSize:"14px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px"}}),e=(0,n.创建元素)("div"),i=(0,n.创建元素)("span",{textContent:"© 2026 "}),a=(0,n.创建元素)("a",{textContent:"科达雅软件工作室"});a.href="https://hbybyyang.cn/",a.style.color="inherit",a.style.textDecoration="none",a.style.transition="color 0.3s ease",a.onmouseenter=()=>{a.style.color="#a78bfa"},a.onmouseleave=()=>{a.style.color="inherit"};let o=(0,n.创建元素)("span",{textContent:" All rights reserved."});e.appendChild(i),e.appendChild(a),e.appendChild(o);let r=(0,n.创建元素)("div",{style:{display:"flex",flexWrap:"wrap",justifyContent:"center",alignItems:"center",gap:"16px",marginTop:"4px"}}),l=(0,n.创建元素)("a",{textContent:"新ICP备2026003876号-1",href:"https://beian.miit.gov.cn/",target:"_blank",style:{color:"#64748b",textDecoration:"none",transition:"color 0.3s ease",marginTop:"0px"}});l.onmouseenter=()=>{l.style.color="#a78bfa"},l.onmouseleave=()=>{l.style.color="#64748b"};let d=(0,n.创建元素)("a",{href:"https://beian.mps.gov.cn/#/query/webSearch?code=65010402002238",target:"_blank",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"4px",marginTop:"0px",color:"#64748b",textDecoration:"none",transition:"color 0.3s ease"}});d.onmouseenter=()=>{d.style.color="#a78bfa"},d.onmouseleave=()=>{d.style.color="#64748b"};let p=(0,n.创建元素)("img",{src:s,style:{width:"16px",height:"16px"}}),u=(0,n.创建元素)("span",{textContent:"新公网安备65010402002238号"});d.appendChild(p),d.appendChild(u),r.appendChild(l),r.appendChild(d),t.append(e,r),this.shadow.append(t)}}}),n("9QacD",function(t,e){t.exports=import.meta.resolve("7G6cr")}),n("3kzXM",function(e,i){t(e.exports,"落地页头部组件",()=>l);var a=o("8HIZi"),n=o("4Clh9");let s=new URL(o("2JIIo")).toString(),r=new URL(o("iDtD3")).toString();class l extends a.组件基类{static{this.注册组件("template-sync-landing-header",this)}async 当加载时(){let t=this.获得宿主样式();t.display="block",t.width="100%",t.boxSizing="border-box";let e=(0,n.创建元素)("header",{className:"landing-header-container",style:{display:"flex",justifyContent:"space-between",alignItems:"center",height:"70px",padding:"0 40px",boxSizing:"border-box",zIndex:"100",position:"sticky",top:"0",transition:"all 0.3s ease",background:"var(--头部背景, rgba(9, 13, 22, 0.8))",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255, 255, 255, 0.08)",flexShrink:"0",boxShadow:"0 2px 8px rgba(0, 0, 0, 0.3)"}}),i=(0,n.创建元素)("div",{style:{display:"flex",alignItems:"center",gap:"12px"}}),a=(0,n.创建元素)("div",{className:"header-main-logo",style:{width:"34px",height:"34px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",borderRadius:"9px",overflow:"hidden",transition:"transform 0.2s ease, box-shadow 0.2s ease"}}),o=(0,n.创建元素)("img",{src:s,style:{width:"100%",height:"100%",objectFit:"contain"}});a.appendChild(o),a.onmouseenter=()=>{a.style.transform="scale(1.08)",a.style.boxShadow="0 0 15px rgba(168, 85, 247, 0.4)"},a.onmouseleave=()=>{a.style.transform="scale(1.0)",a.style.boxShadow="none"},a.onclick=()=>{window.location.assign("https://hbybyyang.cn/")};let l=(0,n.创建元素)("span",{className:"header-logo-separator",textContent:"×",style:{fontSize:"18px",fontWeight:"700",color:"rgba(255, 255, 255, 0.3)",userSelect:"none",padding:"0 4px"}}),d=(0,n.创建元素)("div",{style:{display:"flex",alignItems:"center",gap:"12px",cursor:"pointer",userSelect:"none",transition:"transform 0.2s ease"}}),p=(0,n.创建元素)("img",{src:r,style:{width:"36px",height:"36px",borderRadius:"10px",objectFit:"contain",transition:"transform 0.2s ease"}}),u=(0,n.创建元素)("span",{className:"landing-header-logo-text",textContent:"Template Sync",style:{fontSize:"22px",margin:"0",fontWeight:"bold",background:"linear-gradient(135deg, var(--主色调), #a855f7)",webkitBackgroundClip:"text",webkitTextFillColor:"transparent",fontFamily:"'Outfit', 'Inter', sans-serif"}});d.appendChild(p),d.appendChild(u),d.onmouseenter=()=>{d.style.transform="scale(1.03)"},d.onmouseleave=()=>{d.style.transform="scale(1.0)"},d.onclick=()=>{window.location.assign("./landing.html")},i.appendChild(a),i.appendChild(l),i.appendChild(d),e.appendChild(i);let c=(0,n.创建元素)("a",{className:"header-github-btn",href:"https://github.com/lsby/template-sync",target:"_blank",style:{display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"20px",background:"rgba(255, 255, 255, 0.08)",border:"1px solid rgba(255, 255, 255, 0.12)",color:"#f1f5f9",textDecoration:"none",fontSize:"14px",fontWeight:"500",transition:"all 0.3s ease",cursor:"pointer"}});c.onmouseenter=()=>{c.style.background="rgba(255, 255, 255, 0.15)",c.style.borderColor="rgba(168, 85, 247, 0.6)",c.style.boxShadow="0 0 12px rgba(168, 85, 247, 0.3)"},c.onmouseleave=()=>{c.style.background="rgba(255, 255, 255, 0.08)",c.style.borderColor="rgba(255, 255, 255, 0.12)",c.style.boxShadow="none"};let g=(0,n.创建元素)("div",{style:{width:"18px",height:"18px",display:"flex",alignItems:"center",justifyContent:"center"}});g.innerHTML='<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.35 3.12.9.01.64.01 1.11.01 1.38 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>';let x=(0,n.创建元素)("span",{className:"header-github-text",textContent:"GitHub"});c.appendChild(g),c.appendChild(x),e.appendChild(c);let h=(0,n.创建元素)("style",{textContent:`
        @media (max-width: 768px) {
          .landing-header-container {
            padding: 0 16px !important;
            height: 60px !important;
          }
          .landing-header-logo-text {
            font-size: 16px !important;
          }
          .header-main-logo, .header-logo-separator {
            display: none !important;
          }
          .header-github-text {
            display: none !important;
          }
          .header-github-btn {
            padding: 8px !important;
            border-radius: 50% !important;
          }
        }
      `});this.shadow.appendChild(h),this.shadow.appendChild(e)}}}),n("2JIIo",function(t,e){t.exports=import.meta.resolve("ijqTe")}),n("iDtD3",function(t,e){t.exports=import.meta.resolve("jqk7M")}),n("az2jq",function(e,i){t(e.exports,"落地页组件",()=>n);var a=o("8HIZi");o("gGbkw"),o("4Tlsu"),o("3kzXM");class n extends a.组件基类{static{this.注册组件("template-sync-landing",this)}元素(t){let e=this.shadow.getElementById(t);if(null===e)throw Error(`\u{7F3A}\u{5C11}\u{754C}\u{9762}\u{5143}\u{7D20}\u{FF1A}${t}`);return e}async 当加载时(){if(!0==(void 0!==window.electronAPI))return void window.location.replace("./main.html");this.shadow.innerHTML=`
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

        /* \u{80CC}\u{666F}\u{75DB}\u{70B9}\u{6A21}\u{5757} */
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
            <div class="badge">Git \u{6A21}\u{677F}\u{540C}\u{6B65}\u{91CD}\u{5EFA}\u{65B9}\u{6848}</div>
            <h1>\u{544A}\u{522B}\u{4EBA}\u{8089}\u{6BD4}\u{5BF9}<br />\u{8BA9} Git \u{5E2E}\u{4F60}\u{5408}\u{6A21}\u{677F}</h1>
            <p>
              \u{5E2E}\u{9879}\u{76EE}\u{91CD}\u{65B0}\u{642D}\u{4E0A}\u{6A21}\u{677F}\u{7684} Git \u{73ED}\u{8F66}\u{FF0C}\u{8F7B}\u{677E}\u{62C9}\u{53D6}\u{5E76}\u{5408}\u{5E76}\u{4E0A}\u{6E38}\u{7684}\u{6240}\u{6709}\u{529F}\u{80FD}\u{4E0E}\u{4FEE}\u{590D}\u{3002}
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
              <h4>\u{6A21}\u{677F}\u{5347}\u{7EA7}\u{7684}\u{5669}\u{68A6}</h4>
              <p>\u{65E5}\u{5E38}\u{5F00}\u{53D1}\u{4E2D}\u{FF0C}\u{6211}\u{4EEC}\u{5F80}\u{5F80}\u{901A}\u{8FC7}\u{4E0B}\u{8F7D}\u{538B}\u{7F29}\u{5305}\u{6216}\u{62F7}\u{8D1D}\u{4EE3}\u{7801}\u{6765}\u{521D}\u{59CB}\u{5316}\u{9879}\u{76EE}\u{3002}\u{51E0}\u{4E2A}\u{6708}\u{540E}\u{FF0C}\u{4E0A}\u{6E38}\u{6A21}\u{677F}\u{53D1}\u{5E03}\u{4E86}\u{91CD}\u{5927}\u{66F4}\u{65B0}\u{FF08}\u{4FEE}\u{590D}\u{4E86}\u{81F4}\u{547D} Bug\u{FF0C}\u{6216}\u{63A8}\u{51FA}\u{4E86}\u{65B0}\u{7279}\u{6027}\u{FF09}\u{3002}</p>
              <p>\u{7531}\u{4E8E}\u{60A8}\u{7684}\u{9879}\u{76EE}\u{8131}\u{79BB}\u{4E86}\u{6A21}\u{677F}\u{7684} Git \u{5386}\u{53F2}\u{FF0C}\u{4F20}\u{7EDF}\u{7684}\u{5347}\u{7EA7}\u{65B9}\u{5F0F}\u{6781}\u{5176}\u{75DB}\u{82E6}\u{FF1A}\u{60A8}\u{5FC5}\u{987B}<strong>\u{624B}\u{5DE5}\u{9010}\u{4E2A}\u{6BD4}\u{5BF9}\u{6587}\u{4EF6}</strong>\u{FF0C}\u{5C0F}\u{5FC3}\u{7FFC}\u{7FFC}\u{5730}\u{628A}\u{66F4}\u{65B0}\u{5185}\u{5BB9}\u{590D}\u{5236}\u{7C98}\u{8D34}\u{8FC7}\u{6765}\u{FF0C}\u{4E0D}\u{4EC5}\u{6781}\u{6613}\u{51FA}\u{9519}\u{4E14}\u{8017}\u{8D39}\u{5927}\u{91CF}\u{65F6}\u{95F4}\u{3002}</p>
              <div class="highlight">
                Template Sync \u{5C31}\u{662F}\u{4E3A}\u{4E86}\u{89E3}\u{51B3}\u{8FD9}\u{4E2A}\u{75DB}\u{70B9}\u{800C}\u{751F}\u{FF1A}\u{5B83}\u{53EF}\u{4EE5}\u{4E3A}\u{60A8}\u{627E}\u{56DE}\u{4E22}\u{5931}\u{7684} Git \u{5386}\u{53F2}\u{FF0C}\u{8BA9}\u{60A8}\u{80FD}\u{4F18}\u{96C5}\u{5730}\u{4F7F}\u{7528}\u{6807}\u{51C6} Git \u{547D}\u{4EE4}\u{5408}\u{5E76}\u{66F4}\u{65B0}\u{FF01}
              </div>
            </div>
            <div class="context-illustration">
               <div class="illus-box tmpl">
                  <span class="illus-title">\u{5F00}\u{6E90}\u{6A21}\u{677F} (v2.0)</span>
                  <div class="illus-file updated">App.vue (\u{66F4}\u{65B0})</div>
                  <div class="illus-file updated">utils.ts (\u{65B0}\u{589E})</div>
                  <div class="illus-file">\u{5176}\u{4ED6}\u{6587}\u{4EF6}...</div>
               </div>
               <div class="illus-arrow">
                  <svg width="40" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <span>\u{624B}\u{5DE5}\u{6BD4}\u{5BF9}\u{590D}\u{5236}</span>
                  <span style="opacity: 0.7; font-weight: normal;">(\u{67AF}\u{71E5}\u{4E14}\u{6613}\u{9519})</span>
               </div>
               <div class="illus-box proj">
                  <span class="illus-title">\u{60A8}\u{7684}\u{9879}\u{76EE}</span>
                  <div class="illus-file">App.vue (\u{88AB}\u{9B54}\u{6539})</div>
                  <div class="illus-file">\u{4E1A}\u{52A1}\u{903B}\u{8F91}...</div>
                  <div class="illus-file">\u{5176}\u{4ED6}\u{6587}\u{4EF6}...</div>
               </div>
            </div>
          </div>

          <template-sync-demo></template-sync-demo>
        </main>
      </div>

      <template-sync-landing-footer></template-sync-landing-footer>
    `}}});