import { OrbVisualizer } from './orb';
import { VoiceRecorder } from './voice';
import { WebSocketClient } from './ws';

document.addEventListener('DOMContentLoaded', async () => {
  const canvasContainer = document.getElementById('canvas-container');
  const chatContainer = document.getElementById('chat-container');
  const micBtn = document.getElementById('mic-btn');
  const textInput = document.getElementById('text-input') as HTMLInputElement;
  const sendBtn = document.getElementById('send-btn');
  
  if (!canvasContainer || !chatContainer || !micBtn || !textInput || !sendBtn) return;
  
  // Initialize Visualizer
  const orb = new OrbVisualizer(canvasContainer);
  
  let currentMarvisBubble: HTMLElement | null = null;
  let currentStatusBubble: HTMLElement | null = null;

  const appendMessage = (text: string, type: 'user' | 'marvis' | 'status') => {
    if (type === 'status' && currentStatusBubble) {
      currentStatusBubble.textContent = text;
      return currentStatusBubble;
    }
    if (type !== 'status' && currentStatusBubble) {
      currentStatusBubble.remove();
      currentStatusBubble = null;
    }
    
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (type === 'status') currentStatusBubble = div;
    return div;
  };

  const updateAgent = (
    agentId: 'research' | 'icp' | 'contact' | 'outreach' | 'crm', 
    status: string, 
    progress: number, 
    logMsg?: string
  ) => {
    const item = document.getElementById(`agent-${agentId}`);
    const statusEl = document.getElementById(`status-${agentId}`);
    const progressEl = document.getElementById(`progress-${agentId}`);
    
    if (item) {
      if (status !== 'Idle' && status !== 'Done') {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    }
    if (statusEl) statusEl.textContent = status;
    if (progressEl) progressEl.style.width = `${progress}%`;
    
    if (logMsg) {
      const logBox = document.getElementById('telemetry-log');
      if (logBox) {
        const line = document.createElement('div');
        line.className = 'log-line';
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        line.innerHTML = `<span style="color: rgba(255,255,255,0.3)">[${timestamp}]</span> <span style="color: #00e5ff">[${agentId.toUpperCase()}]</span> ${logMsg}`;
        logBox.appendChild(line);
        logBox.scrollTop = logBox.scrollHeight;
      }
    }
  };

  const resetAllAgents = () => {
    const agents: Array<'research' | 'icp' | 'contact' | 'outreach' | 'crm'> = ['research', 'icp', 'contact', 'outreach', 'crm'];
    agents.forEach(id => updateAgent(id, 'Idle', 0));
  };

  const setHudActive = (isActive: boolean, logText?: string) => {
    const reticle = document.getElementById('hud-reticle');
    const hudLog = document.getElementById('hud-agent-log');
    
    if (reticle) {
      if (isActive) {
        reticle.classList.add('active');
      } else {
        reticle.classList.remove('active');
      }
    }
    if (hudLog && logText) {
      hudLog.textContent = logText;
    }
  };

  const renderResearchCard = (element: HTMLElement) => {
    element.textContent = "";
    
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <div class="card-title">
        <div class="step-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
        <span>SDR Backend Processing...</span>
      </div>
      
      <!-- LIVE CONNECTING GRAPH -->
      <div class="connection-graph">
        <svg width="100%" height="150" viewBox="0 0 300 150" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <!-- Base links -->
          <path d="M 150 75 L 50 45" class="base-link" />
          <path d="M 150 75 L 250 45" class="base-link" />
          <path d="M 150 75 L 150 125" class="base-link" />
          
          <!-- Pulse links -->
          <path d="M 150 75 L 50 45" class="pulse-link" id="link-research" />
          <path d="M 150 75 L 250 45" class="pulse-link" id="link-icp" />
          <path d="M 150 75 L 150 125" class="pulse-link" id="link-outreach" />
          
          <!-- Marvis Master Node -->
          <g class="graph-node master active">
            <circle cx="150" cy="75" r="14" />
            <text x="150" y="79" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">J</text>
            <text x="150" y="55" text-anchor="middle" font-size="9" fill="#00e5ff" font-weight="600">MARVIS</text>
          </g>
          
          <!-- Research Agent Node -->
          <g class="graph-node agent" id="node-research">
            <circle cx="50" cy="45" r="10" />
            <text x="50" y="27" text-anchor="middle" font-size="8">Research</text>
          </g>
          
          <!-- ICP Agent Node -->
          <g class="graph-node agent" id="node-icp">
            <circle cx="250" cy="45" r="10" />
            <text x="250" y="27" text-anchor="middle" font-size="8">ICP Scoring</text>
          </g>
          
          <!-- Outreach Agent Node -->
          <g class="graph-node agent" id="node-outreach">
            <circle cx="150" cy="125" r="10" />
            <text x="150" y="142" text-anchor="middle" font-size="8">Outreach</text>
          </g>
        </svg>
      </div>

      <div class="process-steps" style="margin-top: 15px;">
        <div class="process-step active" id="step-1" style="display: flex; align-items: center; gap: 12px; opacity: 1;">
          <div class="step-icon" style="width:20px; height:20px; display:flex; align-items:center; justify-content:center;"><div class="step-spinner"></div></div>
          <span>Discovering relevant M&A advisory accounts...</span>
        </div>
        <div class="process-step" id="step-2" style="display: flex; align-items: center; gap: 12px; opacity: 0.5;">
          <div class="step-icon" style="width:20px; height:20px; display:flex; align-items:center; justify-content:center;"></div>
          <span>Qualifying target profiles against Ideal Customer Profile (ICP)...</span>
        </div>
        <div class="process-step" id="step-3" style="display: flex; align-items: center; gap: 12px; opacity: 0.5;">
          <div class="step-icon" style="width:20px; height:20px; display:flex; align-items:center; justify-content:center;"></div>
          <span>Readying personalized campaign outreach sequences...</span>
        </div>
      </div>
    `;
    element.appendChild(card);
    
    const step1 = card.querySelector('#step-1') as HTMLElement;
    const step2 = card.querySelector('#step-2') as HTMLElement;
    const step3 = card.querySelector('#step-3') as HTMLElement;
    const titleSpinner = card.querySelector('.card-title .step-spinner') as HTMLElement;
    
    // Graph selectors
    const nodeResearch = card.querySelector('#node-research') as HTMLElement;
    const nodeIcp = card.querySelector('#node-icp') as HTMLElement;
    const nodeOutreach = card.querySelector('#node-outreach') as HTMLElement;
    
    const linkResearch = card.querySelector('#link-research') as HTMLElement;
    const linkIcp = card.querySelector('#link-icp') as HTMLElement;
    const linkOutreach = card.querySelector('#link-outreach') as HTMLElement;
    
    // Telemetry updates & Graph active start
    setHudActive(true, 'SDR.PROC: RESEARCH');
    updateAgent('research', 'Scanning...', 30, 'Searching web for M&A advisory firms...');
    updateAgent('icp', 'Idle', 0);
    
    if (nodeResearch) nodeResearch.classList.add('active');
    if (linkResearch) linkResearch.classList.add('active');
    
    setTimeout(() => {
      if (step1) {
        step1.querySelector('.step-icon')!.innerHTML = '<span class="step-check">✓</span>';
        step1.style.opacity = '0.7';
      }
      if (step2) {
        step2.style.opacity = '1';
        step2.querySelector('.step-icon')!.innerHTML = '<div class="step-spinner"></div>';
      }
      // Telemetry updates
      updateAgent('research', 'Done', 100, 'Discovered 342 candidate websites.');
      updateAgent('icp', 'Scoring...', 50, 'Matching candidates against Ideal Customer Profile (ICP)...');
      
      // Graph updates
      if (nodeResearch) {
        nodeResearch.classList.remove('active');
        nodeResearch.classList.add('completed');
      }
      if (linkResearch) {
        linkResearch.classList.remove('active');
        linkResearch.classList.add('completed');
      }
      if (nodeIcp) nodeIcp.classList.add('active');
      if (linkIcp) linkIcp.classList.add('active');
      
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 1000);

    setTimeout(() => {
      if (step2) {
        step2.querySelector('.step-icon')!.innerHTML = '<span class="step-check">✓</span>';
        step2.style.opacity = '0.7';
      }
      if (step3) {
        step3.style.opacity = '1';
        step3.querySelector('.step-icon')!.innerHTML = '<div class="step-spinner"></div>';
      }
      // Telemetry updates
      updateAgent('icp', 'Done', 100, 'Calculated match scores. 20 high-priority targets prioritized.');
      updateAgent('outreach', 'Preparing...', 30, 'Preparing personalized email pitches...');
      
      // Graph updates
      if (nodeIcp) {
        nodeIcp.classList.remove('active');
        nodeIcp.classList.add('completed');
      }
      if (linkIcp) {
        linkIcp.classList.remove('active');
        linkIcp.classList.add('completed');
      }
      if (nodeOutreach) nodeOutreach.classList.add('active');
      if (linkOutreach) linkOutreach.classList.add('active');
      
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 2000);

    setTimeout(() => {
      if (step3) {
        step3.querySelector('.step-icon')!.innerHTML = '<span class="step-check">✓</span>';
        step3.style.opacity = '0.7';
      }
      if (titleSpinner) {
        titleSpinner.outerHTML = '<span class="step-check" style="margin-right: 5px;">✓</span>';
      }
      // Telemetry updates
      updateAgent('outreach', 'Done', 100, 'Omnichannel campaign sequence compiled.');
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1000);
      
      // Graph updates
      if (nodeOutreach) {
        nodeOutreach.classList.remove('active');
        nodeOutreach.classList.add('completed');
      }
      if (linkOutreach) {
        linkOutreach.classList.remove('active');
        linkOutreach.classList.add('completed');
      }
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'card-actions';
      const showBtn = document.createElement('button');
      showBtn.className = 'card-btn';
      showBtn.textContent = 'Show Top Prospects';
      showBtn.addEventListener('click', () => {
        textInput.value = 'Show top prospects.';
        handleSend();
      });
      actionsDiv.appendChild(showBtn);
      card.appendChild(actionsDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 3000);
  };

  const renderProspectsCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- LIVE CONNECTING GRAPH -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="70" viewBox="0 0 300 70" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <path d="M 100 35 L 200 35" class="base-link" />
          <path d="M 100 35 L 200 35" class="pulse-link" id="link-contact" />
          
          <g class="graph-node master active">
            <circle cx="100" cy="35" r="12" />
            <text x="100" y="39" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">J</text>
            <text x="100" y="18" text-anchor="middle" font-size="8" fill="#00e5ff" font-weight="600">MARVIS</text>
          </g>
          
          <g class="graph-node agent" id="node-contact">
            <circle cx="200" cy="35" r="10" />
            <text x="200" y="18" text-anchor="middle" font-size="8">Contact Discovery</text>
          </g>
        </svg>
      </div>

      <div class="card-title">🎯 Qualified Prospects (Top 3 of 342)</div>
      <table class="prospect-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Domain</th>
            <th>ICP Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Apex M&A Partners</strong></td>
            <td>apex-ma.com</td>
            <td><span class="score-badge">98%</span></td>
            <td><button class="card-btn btn-exclude" style="padding: 4px 8px; margin: 0; font-size: 0.75rem;">Exclude</button></td>
          </tr>
          <tr>
            <td><strong>Summit Capital Group</strong></td>
            <td>summitcap.com</td>
            <td><span class="score-badge">94%</span></td>
            <td><button class="card-btn btn-exclude" style="padding: 4px 8px; margin: 0; font-size: 0.75rem;">Exclude</button></td>
          </tr>
          <tr>
            <td><strong>Beacon Financial</strong></td>
            <td>beacon-fin.com</td>
            <td><span class="score-badge">91%</span></td>
            <td><button class="card-btn btn-exclude" style="padding: 4px 8px; margin: 0; font-size: 0.75rem;">Exclude</button></td>
          </tr>
        </tbody>
      </table>
      <div class="card-actions">
        <button class="card-btn" id="btn-launch-campaign">Launch Outreach Campaign</button>
        <button class="card-btn secondary">Customize Sequence</button>
      </div>
    `;
    element.appendChild(card);
    
    const nodeContact = card.querySelector('#node-contact') as HTMLElement;
    const linkContact = card.querySelector('#link-contact') as HTMLElement;
    
    if (nodeContact) nodeContact.classList.add('active');
    if (linkContact) linkContact.classList.add('active');
    
    // Telemetry updates
    setHudActive(true, 'SDR.PROC: RETRIEVING');
    updateAgent('contact', 'Enriching...', 50, 'Scraping contact info and verifying emails...');
    setTimeout(() => {
      updateAgent('contact', 'Done', 100, 'Verified decision-maker emails for Apex, Summit, and Beacon.');
      if (nodeContact) {
        nodeContact.classList.remove('active');
        nodeContact.classList.add('completed');
      }
      if (linkContact) {
        linkContact.classList.remove('active');
        linkContact.classList.add('completed');
      }
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1500);
    }, 1200);
    
    card.querySelectorAll('.btn-exclude').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = (e.target as HTMLElement).closest('tr');
        if (row) {
          row.style.opacity = '0.3';
          (e.target as HTMLButtonElement).disabled = true;
          (e.target as HTMLButtonElement).textContent = "Excluded";
        }
      });
    });

    const launchBtn = card.querySelector('#btn-launch-campaign');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        textInput.value = 'Launch campaign.';
        handleSend();
      });
    }
  };

  const renderCampaignCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- LIVE CONNECTING GRAPH -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="70" viewBox="0 0 300 70" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <path d="M 100 35 L 200 35" class="base-link" />
          <path d="M 100 35 L 200 35" class="pulse-link" id="link-outreach-node" />
          
          <g class="graph-node master active">
            <circle cx="100" cy="35" r="12" />
            <text x="100" y="39" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">J</text>
            <text x="100" y="18" text-anchor="middle" font-size="8" fill="#00e5ff" font-weight="600">MARVIS</text>
          </g>
          
          <g class="graph-node agent" id="node-outreach-node">
            <circle cx="200" cy="35" r="10" />
            <text x="200" y="18" text-anchor="middle" font-size="8">Outreach Agent</text>
          </g>
        </svg>
      </div>

      <div class="card-title">🚀 Outreach Campaign Created</div>
      <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 0; margin-bottom: 15px;">
        Omnichannel campaign sequence compiled for approved prospects.
      </p>
      <div class="sequence-steps">
        <div class="sequence-step">
          <div class="sequence-type">Step 1: Introduction Email</div>
          <div class="sequence-desc">Personalized pitch focusing on AI-driven M&A workflow improvements. Sent immediately.</div>
        </div>
        <div class="sequence-step">
          <div class="sequence-type">Step 2: LinkedIn Connection Request</div>
          <div class="sequence-desc">Social connection invitation with personalized conversational hook. 1 day delay.</div>
        </div>
        <div class="sequence-step">
          <div class="sequence-type">Step 3: Follow-up Email</div>
          <div class="sequence-desc">Case study showcasing 40% performance gains in target industries. 3 days delay.</div>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-btn" id="btn-show-report">View Executive Report</button>
      </div>
    `;
    element.appendChild(card);
    
    const nodeOutreach = card.querySelector('#node-outreach-node') as HTMLElement;
    const linkOutreach = card.querySelector('#link-outreach-node') as HTMLElement;
    
    if (nodeOutreach) nodeOutreach.classList.add('active');
    if (linkOutreach) linkOutreach.classList.add('active');
    
    // Telemetry updates
    setHudActive(true, 'SDR.PROC: OUTBOUND');
    updateAgent('outreach', 'Sending...', 40, 'Launching email sequence and connection requests...');
    setTimeout(() => {
      updateAgent('outreach', 'Active', 100, 'Campaign live. 3 personalized email sequences running.');
      if (nodeOutreach) {
        nodeOutreach.classList.remove('active');
        nodeOutreach.classList.add('completed');
      }
      if (linkOutreach) {
        linkOutreach.classList.remove('active');
        linkOutreach.classList.add('completed');
      }
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1500);
    }, 1200);
    
    const reportBtn = card.querySelector('#btn-show-report');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        textInput.value = "Give me today's report.";
        handleSend();
      });
    }
  };

  const renderDashboardCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- LIVE CONNECTING GRAPH -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="70" viewBox="0 0 300 70" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <path d="M 100 35 L 200 35" class="base-link" />
          <path d="M 100 35 L 200 35" class="pulse-link" id="link-crm-node" />
          
          <g class="graph-node master active">
            <circle cx="100" cy="35" r="12" />
            <text x="100" y="39" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">J</text>
            <text x="100" y="18" text-anchor="middle" font-size="8" fill="#00e5ff" font-weight="600">MARVIS</text>
          </g>
          
          <g class="graph-node agent" id="node-crm-node">
            <circle cx="200" cy="35" r="10" />
            <text x="200" y="18" text-anchor="middle" font-size="8">CRM Agent</text>
          </g>
        </svg>
      </div>

      <div class="card-title">📊 Executive CRM Dashboard</div>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Total Leads</div>
          <div class="metric-value cyan">420</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Meetings Booked</div>
          <div class="metric-value green">17</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Opportunities</div>
          <div class="metric-value purple">9</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Pipeline</div>
          <div class="metric-value gold">$2.4M</div>
        </div>
      </div>
    `;
    element.appendChild(card);
    
    const nodeCrm = card.querySelector('#node-crm-node') as HTMLElement;
    const linkCrm = card.querySelector('#link-crm-node') as HTMLElement;
    
    if (nodeCrm) nodeCrm.classList.add('active');
    if (linkCrm) linkCrm.classList.add('active');
    
    // Telemetry updates
    setHudActive(true, 'SDR.PROC: CRM_SYNC');
    updateAgent('crm', 'Syncing...', 50, 'Aggregating metrics and updating Salesforce records...');
    setTimeout(() => {
      updateAgent('crm', 'Done', 100, 'CRM pipeline dashboard fully updated ($2.4M active pipeline).');
      if (nodeCrm) {
        nodeCrm.classList.remove('active');
        nodeCrm.classList.add('completed');
      }
      if (linkCrm) {
        linkCrm.classList.remove('active');
        linkCrm.classList.add('completed');
      }
    }, 1000);
  };

  const renderSalesFocusCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- LIVE CONNECTING GRAPH -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="70" viewBox="0 0 300 70" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <path d="M 100 35 L 200 35" class="base-link" />
          <path d="M 100 35 L 200 35" class="pulse-link" id="link-icp-node" />
          
          <g class="graph-node master active">
            <circle cx="100" cy="35" r="12" />
            <text x="100" y="39" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">J</text>
            <text x="100" y="18" text-anchor="middle" font-size="8" fill="#00e5ff" font-weight="600">MARVIS</text>
          </g>
          
          <g class="graph-node agent" id="node-icp-node">
            <circle cx="200" cy="35" r="10" />
            <text x="200" y="18" text-anchor="middle" font-size="8">ICP Scoring</text>
          </g>
        </svg>
      </div>

      <div class="card-title">🎯 Highest Intent Accounts This Week</div>
      
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
        <!-- Account 1 -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; transition: all 0.3s ease; position: relative;" 
             class="account-row"
             onmouseover="this.style.borderColor='rgba(0, 229, 255, 0.4)'; this.style.background='rgba(0, 229, 255, 0.03)'; this.style.boxShadow='0 0 10px rgba(0, 229, 255, 0.1)';" 
             onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'; this.style.background='rgba(255, 255, 255, 0.02)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #fff; font-size: 0.95rem;">1. Firm A</span>
            <span class="score-badge" style="background: rgba(0, 255, 102, 0.1); color: #00ff66; border: 1px solid rgba(0, 255, 102, 0.2); font-weight: 600; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px;">92%</span>
          </div>
          <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.5);">Buying signals detected:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;">
              <span style="background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.25); color: #00e5ff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">💰 Recently funded</span>
              <span style="background: rgba(0, 255, 102, 0.1); border: 1px solid rgba(0, 255, 102, 0.25); color: #00ff66; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">📈 Hiring aggressively</span>
              <span style="background: rgba(213, 0, 249, 0.1); border: 1px solid rgba(213, 0, 249, 0.25); color: #d500f9; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">💻 Tech modernization</span>
            </div>
          </div>
        </div>

        <!-- Account 2 -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; transition: all 0.3s ease; position: relative;" 
             class="account-row"
             onmouseover="this.style.borderColor='rgba(0, 229, 255, 0.4)'; this.style.background='rgba(0, 229, 255, 0.03)'; this.style.boxShadow='0 0 10px rgba(0, 229, 255, 0.1)';" 
             onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'; this.style.background='rgba(255, 255, 255, 0.02)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #fff; font-size: 0.95rem;">2. Firm B</span>
            <span class="score-badge" style="background: rgba(0, 229, 255, 0.1); color: #00e5ff; border: 1px solid rgba(0, 229, 255, 0.2); font-weight: 600; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px;">87%</span>
          </div>
          <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.5);">Buying signals detected:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;">
              <span style="background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.25); color: #00e5ff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">💰 Recently funded</span>
              <span style="background: rgba(0, 255, 102, 0.1); border: 1px solid rgba(0, 255, 102, 0.25); color: #00ff66; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">📈 Hiring aggressively</span>
              <span style="background: rgba(213, 0, 249, 0.1); border: 1px solid rgba(213, 0, 249, 0.25); color: #d500f9; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">💻 Tech modernization</span>
            </div>
          </div>
        </div>

        <!-- Account 3 -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; transition: all 0.3s ease; position: relative;" 
             class="account-row"
             onmouseover="this.style.borderColor='rgba(0, 229, 255, 0.4)'; this.style.background='rgba(0, 229, 255, 0.03)'; this.style.boxShadow='0 0 10px rgba(0, 229, 255, 0.1)';" 
             onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'; this.style.background='rgba(255, 255, 255, 0.02)'; this.style.boxShadow='none';">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #fff; font-size: 0.95rem;">3. Firm C</span>
            <span class="score-badge" style="background: rgba(255, 214, 0, 0.1); color: #ffd600; border: 1px solid rgba(255, 214, 0, 0.2); font-weight: 600; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px;">84%</span>
          </div>
          <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.5);">Buying signals detected:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;">
              <span style="background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.25); color: #00e5ff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">💰 Recently funded</span>
              <span style="background: rgba(0, 255, 102, 0.1); border: 1px solid rgba(0, 255, 102, 0.25); color: #00ff66; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">📈 Hiring aggressively</span>
              <span style="background: rgba(213, 0, 249, 0.1); border: 1px solid rgba(213, 0, 249, 0.25); color: #d500f9; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 500;">💻 Tech modernization</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card-actions" style="margin-top: 18px;">
        <button class="card-btn" id="btn-focus-campaign">Add to Outreach Campaign</button>
        <button class="card-btn secondary" id="btn-focus-details">Show Details</button>
      </div>
    `;
    element.appendChild(card);

    const nodeIcp = card.querySelector('#node-icp-node') as HTMLElement;
    const linkIcp = card.querySelector('#link-icp-node') as HTMLElement;

    if (nodeIcp) nodeIcp.classList.add('active');
    if (linkIcp) linkIcp.classList.add('active');

    // Telemetry updates
    setHudActive(true, 'SDR.PROC: ICP_PRIORITY');
    updateAgent('icp', 'Evaluating...', 60, 'Evaluating high-intent accounts and buying indicators...');

    setTimeout(() => {
      updateAgent('icp', 'Done', 100, 'Prioritized Firm A, Firm B, and Firm C as highest intent targets.');
      if (nodeIcp) {
        nodeIcp.classList.remove('active');
        nodeIcp.classList.add('completed');
      }
      if (linkIcp) {
        linkIcp.classList.remove('active');
        linkIcp.classList.add('completed');
      }
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1500);
    }, 1200);

    const campaignBtn = card.querySelector('#btn-focus-campaign');
    if (campaignBtn) {
      campaignBtn.addEventListener('click', () => {
        textInput.value = 'Launch campaign.';
        handleSend();
      });
    }

    const detailsBtn = card.querySelector('#btn-focus-details');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        textInput.value = 'Show top prospects.';
        handleSend();
      });
    }
  };

  const renderGoalAcceptedCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- LIVE CONNECTING GRAPH -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="150" viewBox="0 0 300 150" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <!-- Base links -->
          <path d="M 150 75 L 50 45" class="base-link" />
          <path d="M 150 75 L 250 45" class="base-link" />
          <path d="M 150 75 L 80 120" class="base-link" />
          <path d="M 150 75 L 220 120" class="base-link" />
          
          <!-- Pulse links -->
          <path d="M 150 75 L 50 45" class="pulse-link" id="link-goal-research" />
          <path d="M 150 75 L 250 45" class="pulse-link" id="link-goal-icp" />
          <path d="M 150 75 L 80 120" class="pulse-link" id="link-goal-enrich" />
          <path d="M 150 75 L 220 120" class="pulse-link" id="link-goal-outreach" />

          <!-- Marvis Master Node -->
          <g class="graph-node master active">
            <circle cx="150" cy="75" r="14" />
            <text x="150" y="79" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">J</text>
            <text x="150" y="55" text-anchor="middle" font-size="9" fill="#00e5ff" font-weight="600">MARVIS</text>
          </g>
          
          <!-- Research Node -->
          <g class="graph-node agent" id="node-goal-research">
            <circle cx="50" cy="45" r="9" />
            <text x="50" y="29" text-anchor="middle" font-size="7.5">Research</text>
          </g>
          
          <!-- ICP Node -->
          <g class="graph-node agent" id="node-goal-icp">
            <circle cx="250" cy="45" r="9" />
            <text x="250" y="29" text-anchor="middle" font-size="7.5">ICP Score</text>
          </g>
          
          <!-- Enrichment Node -->
          <g class="graph-node agent" id="node-goal-enrich">
            <circle cx="80" cy="120" r="9" />
            <text x="80" y="137" text-anchor="middle" font-size="7.5">Enrichment</text>
          </g>
          
          <!-- Outreach Node -->
          <g class="graph-node agent" id="node-goal-outreach">
            <circle cx="220" cy="120" r="9" />
            <text x="220" y="137" text-anchor="middle" font-size="7.5">Outreach</text>
          </g>
        </svg>
      </div>

      <div class="card-title">🎯 Goal Accepted: 20 Meetings (30 Days)</div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
        <!-- Required Actions -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; transition: all 0.3s ease;" 
             onmouseover="this.style.borderColor='rgba(0, 229, 255, 0.3)'; this.style.background='rgba(0, 229, 255, 0.01)';"
             onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'; this.style.background='rgba(255, 255, 255, 0.02)';">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #00e5ff; font-weight: 600; margin-bottom: 8px;">Required Actions</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.8);">
            <div>🏢 <strong>Target Accounts:</strong> 300</div>
            <div>👤 <strong>Contacts:</strong> 1,200</div>
            <div>✉️ <strong>Emails:</strong> 1,200</div>
            <div>🔗 <strong>LinkedIn:</strong> 1,200</div>
          </div>
        </div>

        <!-- Assigned Agents -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; transition: all 0.3s ease;" 
             onmouseover="this.style.borderColor='rgba(0, 255, 102, 0.3)'; this.style.background='rgba(0, 255, 102, 0.01)';"
             onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'; this.style.background='rgba(255, 255, 255, 0.02)';">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #00ff66; font-weight: 600; margin-bottom: 8px;">Workforce Assigned</div>
          <div style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 0.75rem; color: rgba(255, 255, 255, 0.85);">
            <div><span style="color:#00ff66;">✓</span> Research Agent</div>
            <div><span style="color:#00ff66;">✓</span> ICP Agent</div>
            <div><span style="color:#00ff66;">✓</span> Enrichment Agent</div>
            <div><span style="color:#00ff66;">✓</span> Outreach Agent</div>
            <div><span style="color:#00ff66;">✓</span> Follow-up Agent</div>
            <div><span style="color:#00ff66;">✓</span> Meeting Agent</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 15px;">
        <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); font-weight: 600; margin-bottom: 8px;">Projected Outcomes</div>
        <div class="metric-grid" style="grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div class="metric-card" style="padding: 10px 8px;">
            <div class="metric-label" style="font-size: 0.65rem;">Meetings</div>
            <div class="metric-value green" style="font-size: 1.25rem;">22</div>
          </div>
          <div class="metric-card" style="padding: 10px 8px;">
            <div class="metric-label" style="font-size: 0.65rem;">Opportunities</div>
            <div class="metric-value purple" style="font-size: 1.25rem;">8</div>
          </div>
          <div class="metric-card" style="padding: 10px 8px;">
            <div class="metric-label" style="font-size: 0.65rem;">Pipeline</div>
            <div class="metric-value gold" style="font-size: 1.25rem;">$1.4M</div>
          </div>
        </div>
      </div>

      <div class="card-actions" style="margin-top: 18px;">
        <button class="card-btn" id="btn-goal-launch">Launch Campaign</button>
        <button class="card-btn secondary" id="btn-goal-customize">Adjust Strategy</button>
      </div>
    `;
    element.appendChild(card);

    const nodeResearch = card.querySelector('#node-goal-research') as HTMLElement;
    const nodeIcp = card.querySelector('#node-goal-icp') as HTMLElement;
    const nodeEnrich = card.querySelector('#node-goal-enrich') as HTMLElement;
    const nodeOutreach = card.querySelector('#node-goal-outreach') as HTMLElement;

    const linkResearch = card.querySelector('#link-goal-research') as HTMLElement;
    const linkIcp = card.querySelector('#link-goal-icp') as HTMLElement;
    const linkEnrich = card.querySelector('#link-goal-enrich') as HTMLElement;
    const linkOutreach = card.querySelector('#link-goal-outreach') as HTMLElement;

    // Pulse first node cluster (Research & ICP)
    if (nodeResearch) nodeResearch.classList.add('active');
    if (linkResearch) linkResearch.classList.add('active');
    if (nodeIcp) nodeIcp.classList.add('active');
    if (linkIcp) linkIcp.classList.add('active');

    // Telemetry updates
    setHudActive(true, 'SDR.PROC: GOAL_ALLOC');
    updateAgent('research', 'Analyzing...', 40, 'Targeting 300 AI Product firms...');
    updateAgent('icp', 'Assigning...', 30, 'Calculating Ideal Customer Profile match metrics...');

    setTimeout(() => {
      // Complete first cluster
      if (nodeResearch) { nodeResearch.classList.remove('active'); nodeResearch.classList.add('completed'); }
      if (linkResearch) { linkResearch.classList.remove('active'); linkResearch.classList.add('completed'); }
      if (nodeIcp) { nodeIcp.classList.remove('active'); nodeIcp.classList.add('completed'); }
      if (linkIcp) { linkIcp.classList.remove('active'); linkIcp.classList.add('completed'); }

      // Activate second cluster (Enrichment & Outreach)
      if (nodeEnrich) nodeEnrich.classList.add('active');
      if (linkEnrich) linkEnrich.classList.add('active');
      if (nodeOutreach) nodeOutreach.classList.add('active');
      if (linkOutreach) linkOutreach.classList.add('active');

      updateAgent('research', 'Done', 100, 'Accounts identified.');
      updateAgent('icp', 'Done', 100, 'ICP matching complete.');
      updateAgent('contact', 'Enriching...', 50, 'Scraping decision-maker emails (1,200 contacts)...');
      updateAgent('outreach', 'Preparing...', 20, 'Drafting personalized campaign sequences...');
    }, 1200);

    setTimeout(() => {
      if (nodeEnrich) { nodeEnrich.classList.remove('active'); nodeEnrich.classList.add('completed'); }
      if (linkEnrich) { linkEnrich.classList.remove('active'); linkEnrich.classList.add('completed'); }
      if (nodeOutreach) { nodeOutreach.classList.remove('active'); nodeOutreach.classList.add('completed'); }
      if (linkOutreach) { linkOutreach.classList.remove('active'); linkOutreach.classList.add('completed'); }

      updateAgent('contact', 'Done', 100, 'Decision-makers verified.');
      updateAgent('outreach', 'Ready', 100, 'Campaign sequence finalized (Email + LinkedIn).');
      
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1500);
    }, 2400);

    const launchBtn = card.querySelector('#btn-goal-launch');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        textInput.value = 'Launch campaign.';
        handleSend();
      });
    }

    const adjustBtn = card.querySelector('#btn-goal-customize');
    if (adjustBtn) {
      adjustBtn.addEventListener('click', () => {
        textInput.value = 'Show top prospects.';
        handleSend();
      });
    }
  };

  const renderPipelineGoalCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- LIVE CONNECTING GRAPH -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="150" viewBox="0 0 300 150" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <!-- Base links -->
          <path d="M 150 75 L 50 45" class="base-link" />
          <path d="M 150 75 L 250 45" class="base-link" />
          <path d="M 150 75 L 80 120" class="base-link" />
          <path d="M 150 75 L 220 120" class="base-link" />
          
          <!-- Pulse links -->
          <path d="M 150 75 L 50 45" class="pulse-link" id="link-pipe-research" />
          <path d="M 150 75 L 250 45" class="pulse-link" id="link-pipe-icp" />
          <path d="M 150 75 L 80 120" class="pulse-link" id="link-pipe-enrich" />
          <path d="M 150 75 L 220 120" class="pulse-link" id="link-pipe-outreach" />

          <!-- Marvis Master Node -->
          <g class="graph-node master active">
            <circle cx="150" cy="75" r="14" />
            <text x="150" y="79" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">J</text>
            <text x="150" y="55" text-anchor="middle" font-size="9" fill="#00e5ff" font-weight="600">MARVIS</text>
          </g>
          
          <!-- Research Node -->
          <g class="graph-node agent" id="node-pipe-research">
            <circle cx="50" cy="45" r="9" />
            <text x="50" y="29" text-anchor="middle" font-size="7.5">Research</text>
          </g>
          
          <!-- ICP Node -->
          <g class="graph-node agent" id="node-pipe-icp">
            <circle cx="250" cy="45" r="9" />
            <text x="250" y="29" text-anchor="middle" font-size="7.5">ICP Score</text>
          </g>
          
          <!-- Enrichment Node -->
          <g class="graph-node agent" id="node-pipe-enrich">
            <circle cx="80" cy="120" r="9" />
            <text x="80" y="137" text-anchor="middle" font-size="7.5">Enrichment</text>
          </g>
          
          <!-- Outreach Node -->
          <g class="graph-node agent" id="node-pipe-outreach">
            <circle cx="220" cy="120" r="9" />
            <text x="220" y="137" text-anchor="middle" font-size="7.5">Outreach</text>
          </g>
        </svg>
      </div>

      <div class="card-title">🎯 Goal Accepted: $2M Pipeline (90 Days)</div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
        <!-- Required Activities -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; transition: all 0.3s ease;" 
             onmouseover="this.style.borderColor='rgba(0, 229, 255, 0.3)'; this.style.background='rgba(0, 229, 255, 0.01)';"
             onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'; this.style.background='rgba(255, 255, 255, 0.02)';">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #00e5ff; font-weight: 600; margin-bottom: 8px;">Required Activities</div>
          <div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.85);">
            <div>🏢 <strong>Accounts:</strong> 520</div>
            <div>👤 <strong>Contacts:</strong> 2,400</div>
            <div>✉️ <strong>Emails:</strong> 2,400</div>
            <div>📅 <strong>Meetings Needed:</strong> 80</div>
            <div>📈 <strong>Opportunities:</strong> 20</div>
          </div>
        </div>

        <!-- Assigned Agents -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; transition: all 0.3s ease;" 
             onmouseover="this.style.borderColor='rgba(0, 255, 102, 0.3)'; this.style.background='rgba(0, 255, 102, 0.01)';"
             onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'; this.style.background='rgba(255, 255, 255, 0.02)';">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #00ff66; font-weight: 600; margin-bottom: 8px;">Strategy & Execution</div>
          <div style="display: grid; grid-template-columns: 1fr; gap: 3px; font-size: 0.75rem; color: rgba(255, 255, 255, 0.85);">
            <div><span style="color:#00ff66;">✓</span> Strategy Agent</div>
            <div><span style="color:#00ff66;">✓</span> Research Agent</div>
            <div><span style="color:#00ff66;">✓</span> ICP Agent</div>
            <div><span style="color:#00ff66;">✓</span> Enrichment Agent</div>
            <div><span style="color:#00ff66;">✓</span> Outreach Agent</div>
            <div><span style="color:#00ff66;">✓</span> Follow-up Agent</div>
            <div><span style="color:#00ff66;">✓</span> Meeting Agent</div>
            <div><span style="color:#00ff66;">✓</span> CRM Agent</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 15px; background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.15); border-radius: 8px; padding: 10px; font-size: 0.85rem; text-align: center; color: #fff;">
        🚀 Execution Plan Ready. Would you like me to launch?
      </div>

      <div class="card-actions" style="margin-top: 15px;">
        <button class="card-btn" id="btn-pipe-launch">Launch Campaign</button>
        <button class="card-btn secondary" id="btn-pipe-customize">Adjust Strategy</button>
      </div>
    `;
    element.appendChild(card);

    const nodeResearch = card.querySelector('#node-pipe-research') as HTMLElement;
    const nodeIcp = card.querySelector('#node-pipe-icp') as HTMLElement;
    const nodeEnrich = card.querySelector('#node-pipe-enrich') as HTMLElement;
    const nodeOutreach = card.querySelector('#node-pipe-outreach') as HTMLElement;

    const linkResearch = card.querySelector('#link-pipe-research') as HTMLElement;
    const linkIcp = card.querySelector('#link-pipe-icp') as HTMLElement;
    const linkEnrich = card.querySelector('#link-pipe-enrich') as HTMLElement;
    const linkOutreach = card.querySelector('#link-pipe-outreach') as HTMLElement;

    // Pulse first node cluster (Research & ICP)
    if (nodeResearch) nodeResearch.classList.add('active');
    if (linkResearch) linkResearch.classList.add('active');
    if (nodeIcp) nodeIcp.classList.add('active');
    if (linkIcp) linkIcp.classList.add('active');

    // Telemetry updates
    setHudActive(true, 'SDR.PROC: PIPELINE_GEN');
    updateAgent('research', 'Analyzing...', 50, 'Targeting 520 North American AI Product firms...');
    updateAgent('icp', 'Assigning...', 40, 'Generating Ideal Customer Profiles & Scoring...');

    setTimeout(() => {
      // Complete first cluster
      if (nodeResearch) { nodeResearch.classList.remove('active'); nodeResearch.classList.add('completed'); }
      if (linkResearch) { linkResearch.classList.remove('active'); linkResearch.classList.add('completed'); }
      if (nodeIcp) { nodeIcp.classList.remove('active'); nodeIcp.classList.add('completed'); }
      if (linkIcp) { linkIcp.classList.remove('active'); linkIcp.classList.add('completed'); }

      // Activate second cluster (Enrichment & Outreach)
      if (nodeEnrich) nodeEnrich.classList.add('active');
      if (linkEnrich) linkEnrich.classList.add('active');
      if (nodeOutreach) nodeOutreach.classList.add('active');
      if (linkOutreach) linkOutreach.classList.add('active');

      updateAgent('research', 'Done', 100, '520 accounts targeted.');
      updateAgent('icp', 'Done', 100, 'Scoring complete.');
      updateAgent('contact', 'Enriching...', 60, 'Resolving 2,400 decision-maker contact details...');
      updateAgent('outreach', 'Preparing...', 30, 'Readying 2,400 personalized email pitches...');
    }, 1200);

    setTimeout(() => {
      if (nodeEnrich) { nodeEnrich.classList.remove('active'); nodeEnrich.classList.add('completed'); }
      if (linkEnrich) { linkEnrich.classList.remove('active'); linkEnrich.classList.add('completed'); }
      if (nodeOutreach) { nodeOutreach.classList.remove('active'); nodeOutreach.classList.add('completed'); }
      if (linkOutreach) { linkOutreach.classList.remove('active'); linkOutreach.classList.add('completed'); }

      updateAgent('contact', 'Done', 100, '2,400 contacts enriched.');
      updateAgent('outreach', 'Ready', 100, 'Execution plan finalized.');
      
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1500);
    }, 2400);

    const launchBtn = card.querySelector('#btn-pipe-launch');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        textInput.value = 'Launch campaign.';
        handleSend();
      });
    }

    const adjustBtn = card.querySelector('#btn-pipe-customize');
    if (adjustBtn) {
      adjustBtn.addEventListener('click', () => {
        textInput.value = 'Show top prospects.';
        handleSend();
      });
    }
  };

  const renderMarketExpansionCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- TAM & EXPANSION COMPARISON GRAPH -->
      <div class="connection-graph" style="margin-bottom: 15px; display: flex; justify-content: center;">
        <svg width="100%" height="100" viewBox="0 0 300 100" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <!-- Scatter Plot Grid -->
          <line x1="40" y1="80" x2="260" y2="80" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
          <line x1="40" y1="20" x2="40" y2="80" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
          <text x="260" y="92" text-anchor="end" font-size="7" fill="rgba(255,255,255,0.4)">AI ADOPTION →</text>
          <text x="35" y="25" text-anchor="end" font-size="7" fill="rgba(255,255,255,0.4)" transform="rotate(-90 35 25)">TAM ($) →</text>
          
          <!-- Bubble points -->
          <!-- UK: TAM 120M, Adoption High (x=220, y=35, r=10) -->
          <circle cx="220" cy="35" r="10" fill="rgba(0, 229, 255, 0.2)" stroke="#00e5ff" stroke-width="1.5" style="cursor: pointer; transition: all 0.3s;" />
          <text x="220" y="38" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">UK</text>
          
          <!-- SG: TAM 80M, Adoption Very High (x=240, y=50, r=8) -->
          <circle cx="240" cy="50" r="8" fill="rgba(0, 255, 102, 0.15)" stroke="#00ff66" stroke-width="1.2" />
          <text x="240" y="53" text-anchor="middle" font-size="6.5" fill="#fff">SG</text>
          
          <!-- UAE: TAM 60M, Adoption Med-High (x=170, y=60, r=8) -->
          <circle cx="170" cy="60" r="8" fill="rgba(213, 0, 249, 0.15)" stroke="#d500f9" stroke-width="1.2" />
          <text x="170" y="63" text-anchor="middle" font-size="6.5" fill="#fff">UAE</text>
          
          <!-- AUS: TAM 50M, Adoption Med (x=120, y=65, r=7) -->
          <circle cx="120" cy="65" r="7" fill="rgba(255, 214, 0, 0.15)" stroke="#ffd600" stroke-width="1.2" />
          <text x="120" y="68" text-anchor="middle" font-size="6.5" fill="#fff">AUS</text>
        </svg>
      </div>

      <div class="card-title">🌐 Global Expansion Analysis</div>

      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 12px; margin-top: 10px;">
        <!-- Expansion targets -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #00e5ff; font-weight: 600; margin-bottom: 8px;">Results & Priority</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: #fff;">
            <div>🇬🇧 <strong>1. United Kingdom</strong> (Recommended)</div>
            <div style="color: rgba(255,255,255,0.6); padding-left: 20px;">- Ideal TAM & AI Adoption</div>
            <div>🇸🇬 <strong>2. Singapore</strong></div>
            <div>🇦🇪 <strong>3. United Arab Emirates</strong></div>
            <div>🇦🇺 <strong>4. Australia</strong></div>
          </div>
        </div>

        <!-- Criteria evaluated -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); font-weight: 600; margin-bottom: 8px;">Analysis Metrics</div>
          <div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; color: rgba(255, 255, 255, 0.8);">
            <div><span style="color:#00ff66;">✓</span> Market Size</div>
            <div><span style="color:#00ff66;">✓</span> Competition</div>
            <div><span style="color:#00ff66;">✓</span> AI Adoption</div>
            <div><span style="color:#00ff66;">✓</span> Regulatory Complexity</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 12px;">
        <div style="text-align: left;">
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); text-transform: uppercase;">UK Recommendation</div>
          <div style="font-size: 0.85rem; color: #fff; font-weight: 600; margin-top: 2px;">Start with UK M&A advisory firms</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); text-transform: uppercase;">Potential TAM</div>
          <div style="font-size: 1.1rem; color: #ffd600; font-weight: 700; margin-top: 2px;">$120M+</div>
        </div>
      </div>

      <div class="card-actions" style="margin-top: 15px;">
        <button class="card-btn" id="btn-expand-uk">Find UK Prospects</button>
        <button class="card-btn secondary" id="btn-expand-compare">View TAM Breakdown</button>
      </div>
    `;
    element.appendChild(card);

    // Telemetry updates
    setHudActive(true, 'SDR.PROC: TAM_ANALYZE');
    updateAgent('research', 'Scanning...', 80, 'Analyzing global AI adoption and market sizes...');

    setTimeout(() => {
      updateAgent('research', 'Done', 100, 'Calculated TAM index for UK ($120M), Singapore ($80M), UAE ($60M), and Australia ($50M).');
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1000);
    }, 1200);

    const expandBtn = card.querySelector('#btn-expand-uk');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        textInput.value = 'Find UK M&A advisory firms.';
        handleSend();
      });
    }

    const compareBtn = card.querySelector('#btn-expand-compare');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => {
        textInput.value = 'Show top prospects.';
        handleSend();
      });
    }
  };

  const renderPredictiveProspectsCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- PROSPECT BUYING PROBABILITY VISUALIZATION -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="95" viewBox="0 0 300 95" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <!-- Firm A bar -->
          <text x="15" y="24" font-size="8" fill="#fff" font-weight="bold">1. Firm A</text>
          <rect x="75" y="14" width="160" height="11" rx="3" fill="rgba(255,255,255,0.05)" />
          <rect x="75" y="14" width="142" height="11" rx="3" fill="url(#grad-green)" />
          <text x="245" y="23" font-size="8.5" fill="#00ff66" font-weight="bold">89%</text>

          <!-- Firm B bar -->
          <text x="15" y="49" font-size="8" fill="#fff" font-weight="bold">2. Firm B</text>
          <rect x="75" y="39" width="160" height="11" rx="3" fill="rgba(255,255,255,0.05)" />
          <rect x="75" y="39" width="134" height="11" rx="3" fill="url(#grad-cyan)" />
          <text x="245" y="48" font-size="8.5" fill="#00e5ff" font-weight="bold">84%</text>

          <!-- Firm C bar -->
          <text x="15" y="74" font-size="8" fill="#fff" font-weight="bold">3. Firm C</text>
          <rect x="75" y="64" width="160" height="11" rx="3" fill="rgba(255,255,255,0.05)" />
          <rect x="75" y="64" width="129" height="11" rx="3" fill="url(#grad-gold)" />
          <text x="245" y="73" font-size="8.5" fill="#ffd600" font-weight="bold">81%</text>

          <!-- Gradients -->
          <defs>
            <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(0,255,102,0.2);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(0,255,102,1);stop-opacity:1" />
            </linearGradient>
            <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(0,229,255,0.2);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(0,229,255,1);stop-opacity:1" />
            </linearGradient>
            <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgba(255,214,0,0.2);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(255,214,0,1);stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div class="card-title">🔮 Predictive Buying Probability (30-Day Outlook)</div>

      <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 12px; margin-top: 10px;">
        <!-- Buying signals -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #00e5ff; font-weight: 600; margin-bottom: 8px;">Buying Signals Detected</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px; font-size: 0.75rem;">
            <span style="background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.2); color: #00e5ff; padding: 2px 6px; border-radius: 4px; font-weight: 500;">📈 Recent hiring</span>
            <span style="background: rgba(213, 0, 249, 0.1); border: 1px solid rgba(213, 0, 249, 0.2); color: #d500f9; padding: 2px 6px; border-radius: 4px; font-weight: 500;">💻 Tech modernization</span>
            <span style="background: rgba(0, 255, 102, 0.1); border: 1px solid rgba(0, 255, 102, 0.2); color: #00ff66; padding: 2px 6px; border-radius: 4px; font-weight: 500;">💰 Funding event</span>
            <span style="background: rgba(255, 214, 0, 0.1); border: 1px solid rgba(255, 214, 0, 0.2); color: #ffd600; padding: 2px 6px; border-radius: 4px; font-weight: 500;">🤝 M&A activity</span>
          </div>
        </div>

        <!-- Strategy recommendation -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); text-transform: uppercase;">Recommendation</div>
          <div style="font-size: 0.85rem; color: #00ff66; font-weight: 600; margin-top: 4px;">Assign High-Touch Campaign</div>
        </div>
      </div>

      <div class="card-actions" style="margin-top: 15px;">
        <button class="card-btn" id="btn-predict-campaign">Assign High-Touch Campaign</button>
        <button class="card-btn secondary" id="btn-predict-prospects">Show All Prospects</button>
      </div>
    `;
    element.appendChild(card);

    // Telemetry updates
    setHudActive(true, 'SDR.PROC: PRED_BUYING');
    updateAgent('icp', 'Evaluating...', 75, 'Scoring target accounts based on buying signals...');

    setTimeout(() => {
      updateAgent('icp', 'Done', 100, 'Scoring complete. Prioritized Firm A (89%), Firm B (84%), and Firm C (81%) as top prospects.');
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1000);
    }, 1200);

    const campaignBtn = card.querySelector('#btn-predict-campaign');
    if (campaignBtn) {
      campaignBtn.addEventListener('click', () => {
        textInput.value = 'Launch campaign.';
        handleSend();
      });
    }

    const prospectsBtn = card.querySelector('#btn-predict-prospects');
    if (prospectsBtn) {
      prospectsBtn.addEventListener('click', () => {
        textInput.value = 'Show top prospects.';
        handleSend();
      });
    }
  };

  const renderIndustryDemandCard = (element: HTMLElement) => {
    element.textContent = "";
    const card = document.createElement('div');
    card.className = "interactive-card";
    card.innerHTML = `
      <!-- SEGMENT DEMAND CHART -->
      <div class="connection-graph" style="margin-bottom: 15px;">
        <svg width="100%" height="110" viewBox="0 0 300 110" style="background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.15);">
          <!-- Investment Banking -->
          <text x="15" y="18" font-size="7.5" fill="#fff" font-weight="bold">Inv. Banking</text>
          <rect x="90" y="10" width="150" height="9" rx="3" fill="rgba(255,255,255,0.03)" />
          <rect x="90" y="10" width="142" height="9" rx="3" fill="#00ff66" />
          <text x="250" y="18" font-size="7.5" fill="#00ff66" font-weight="bold">95</text>

          <!-- Wealth Mgmt -->
          <text x="15" y="38" font-size="7.5" fill="rgba(255,255,255,0.8)">Wealth Mgmt</text>
          <rect x="90" y="30" width="150" height="9" rx="3" fill="rgba(255,255,255,0.03)" />
          <rect x="90" y="30" width="132" height="9" rx="3" fill="#00e5ff" />
          <text x="250" y="38" font-size="7.5" fill="#00e5ff" font-weight="bold">88</text>

          <!-- Insurance -->
          <text x="15" y="58" font-size="7.5" fill="rgba(255,255,255,0.8)">Insurance</text>
          <rect x="90" y="50" width="150" height="9" rx="3" fill="rgba(255,255,255,0.03)" />
          <rect x="90" y="50" width="123" height="9" rx="3" fill="#d500f9" />
          <text x="250" y="58" font-size="7.5" fill="#d500f9" font-weight="bold">82</text>

          <!-- Healthcare -->
          <text x="15" y="78" font-size="7.5" fill="rgba(255,255,255,0.8)">Healthcare</text>
          <rect x="90" y="70" width="150" height="9" rx="3" fill="rgba(255,255,255,0.03)" />
          <rect x="90" y="70" width="112" height="9" rx="3" fill="#ffd600" />
          <text x="250" y="78" font-size="7.5" fill="#ffd600" font-weight="bold">75</text>

          <!-- Mfg -->
          <text x="15" y="98" font-size="7.5" fill="rgba(255,255,255,0.8)">Manufacturing</text>
          <rect x="90" y="90" width="150" height="9" rx="3" fill="rgba(255,255,255,0.03)" />
          <rect x="90" y="90" width="105" height="9" rx="3" fill="rgba(255,255,255,0.4)" />
          <text x="250" y="98" font-size="7.5" fill="rgba(255,255,255,0.4)" font-weight="bold">70</text>
        </svg>
      </div>

      <div class="card-title">📊 Top AI Automation Demand Segments</div>

      <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; margin-top: 10px;">
        <!-- Investment Banking details -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #00e5ff; font-weight: 600; margin-bottom: 6px;">Investment Banking Highlights</div>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: rgba(255,255,255,0.85);">
            <div>🔍 Heavy research & documentation workload</div>
            <div>🤝 High manual effort in deal sourcing</div>
            <div>💰 High labor costs relative to automation TAM</div>
          </div>
        </div>

        <!-- Prioritization Recommendation -->
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); text-transform: uppercase;">Prioritize Segment</div>
          <div style="font-size: 0.85rem; color: #ffd600; font-weight: 700; margin-top: 4px;">Investment Banking</div>
        </div>
      </div>

      <div class="card-actions" style="margin-top: 15px;">
        <button class="card-btn" id="btn-demand-prioritize">Prioritize Investment Banking</button>
        <button class="card-btn secondary" id="btn-demand-other">Explore Other Segments</button>
      </div>
    `;
    element.appendChild(card);

    // Telemetry updates
    setHudActive(true, 'SDR.PROC: DEMAND_RESEARCH');
    updateAgent('research', 'Scanning...', 80, 'Analyzing industry workflows, manual labor hours, and automation demand index...');

    setTimeout(() => {
      updateAgent('research', 'Done', 100, 'Segment analysis complete. Investment Banking scored highest at 95/100.');
      setTimeout(() => {
        resetAllAgents();
        setHudActive(false, 'SDR.INIT: TRUE');
      }, 1000);
    }, 1200);

    const prioritizeBtn = card.querySelector('#btn-demand-prioritize');
    if (prioritizeBtn) {
      prioritizeBtn.addEventListener('click', () => {
        textInput.value = 'Find M&A advisory firms interested in AI.';
        handleSend();
      });
    }

    const otherBtn = card.querySelector('#btn-demand-other');
    if (otherBtn) {
      otherBtn.addEventListener('click', () => {
        textInput.value = 'Find UK M&A advisory firms.';
        handleSend();
      });
    }
  };
  
  // Initialize WebSocket
  const wsUrl = `ws://${window.location.hostname}:8000/ws`;
  const ws = new WebSocketClient(wsUrl, 
    (transcript) => {
      appendMessage(transcript, 'user');
      currentMarvisBubble = null;
    },
    (text) => {
      // Append text from Marvis as it streams
      if (!currentMarvisBubble) {
        window.speechSynthesis.cancel(); // Stop any previous speech
        currentMarvisBubble = appendMessage('', 'marvis');
      }
      currentMarvisBubble.textContent += text;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    },
    (fullText) => {
      if (fullText) {
        const utterance = new SpeechSynthesisUtterance(fullText);
        
        // Try to find a British voice
        const voices = window.speechSynthesis.getVoices();
        const britishVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('British'));
        if (britishVoice) utterance.voice = britishVoice;
        
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);

        // Convert the text response into a premium interactive card
        if (currentMarvisBubble) {
          const lowerText = fullText.toLowerCase();
          if (lowerText.includes("running research agent")) {
            renderResearchCard(currentMarvisBubble);
          } else if (lowerText.includes("found 342 accounts")) {
            renderProspectsCard(currentMarvisBubble);
          } else if (lowerText.includes("campaign created")) {
            renderCampaignCard(currentMarvisBubble);
          } else if (lowerText.includes("leads: 420")) {
            renderDashboardCard(currentMarvisBubble);
          } else if (lowerText.includes("highest intent accounts")) {
            renderSalesFocusCard(currentMarvisBubble);
          } else if (lowerText.includes("goal accepted")) {
            renderGoalAcceptedCard(currentMarvisBubble);
          } else if (lowerText.includes("target pipeline:\n$2m")) {
            renderPipelineGoalCard(currentMarvisBubble);
          } else if (lowerText.includes("potential tam:\n$120m+")) {
            renderMarketExpansionCard(currentMarvisBubble);
          } else if (lowerText.includes("predictive analysis complete")) {
            renderPredictiveProspectsCard(currentMarvisBubble);
          } else if (lowerText.includes("research completed")) {
            renderIndustryDemandCard(currentMarvisBubble);
          }
        }
      }
      currentMarvisBubble = null;
    },
    (status) => {
      appendMessage(status, 'status');
    }
  );
  ws.connect();
  
  // Initialize Voice Recorder
  const voice = new VoiceRecorder((base64Audio) => {
    ws.sendAudio(base64Audio);
  });
  
  let isRecording = false;
  
  micBtn.addEventListener('click', async () => {
    if (!voice.analyser) {
      const initialized = await voice.init();
      if (initialized && voice.analyser) {
        orb.setAnalyser(voice.analyser);
      } else {
        alert('Could not access microphone');
        return;
      }
    }
    
    if (!isRecording) {
      voice.start();
      isRecording = true;
      micBtn.textContent = 'Stop Listening';
      micBtn.classList.add('recording');
      appendMessage('Listening...', 'status');
    } else {
      voice.stop();
      isRecording = false;
      micBtn.textContent = '🎤 Listen';
      micBtn.classList.remove('recording');
      appendMessage('Processing...', 'status');
    }
  });

  const handleSend = () => {
    const text = textInput.value.trim();
    if (text) {
      ws.sendText(text);
      appendMessage(text, 'user');
      currentMarvisBubble = null;
      textInput.value = '';
    }
  };

  sendBtn.addEventListener('click', handleSend);
  textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});
