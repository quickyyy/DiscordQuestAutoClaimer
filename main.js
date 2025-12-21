(async function() {
    'use strict';

    // ==========================================
    // Configuration & Constants
    // ==========================================
    const CONFIG = {
        IGNORED_QUEST_ID: "1412491570820812933",
        PID_RANGE: 30000,
        PID_OFFSET: 1000,
        VIDEO_SPEED: 7,
        VIDEO_INTERVAL: 1, // seconds
        HEARTBEAT_INTERVAL: 20, // seconds
        MAX_FUTURE_SECONDS: 10
    };

    // ==========================================
    // UI Overlay
    // ==========================================
    class OverlayUI {
        constructor() {
            this.element = null;
            this.statusElement = null;
            this.listContainer = null;
            this.isCollapsed = false;
            this.isQuestRunning = false;
            this.autoRun = false;
            this.render();
        }

        render() {
            const existing = document.getElementById('quest-claimer-ui');
            if (existing) existing.remove();

            const container = document.createElement('div');
            container.id = 'quest-claimer-ui';
            container.style.cssText = `
                position: fixed; top: 20px; right: 20px; 
                background: #2b2d31; color: #dbdee1; 
                padding: 16px; border-radius: 8px; 
                z-index: 9999; font-family: 'gg sans', sans-serif; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                min-width: 320px; border: 1px solid #1e1f22;
                transition: height 0.3s ease;
            `;

            const header = document.createElement('div');
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';

            const title = document.createElement('h3');
            title.textContent = 'Quest Auto-Claimer';
            title.style.cssText = 'margin: 0; font-size: 16px; color: #fff; font-weight: 600;';

            const controls = document.createElement('div');
            controls.style.cssText = 'display: flex; gap: 8px; align-items: center;';

            const autoRunLabel = document.createElement('label');
            autoRunLabel.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 12px; color: #b5bac1; cursor: pointer; margin-right: 4px;';
            
            const autoRunCheckbox = document.createElement('input');
            autoRunCheckbox.type = 'checkbox';
            autoRunCheckbox.style.cssText = 'cursor: pointer;';
            autoRunCheckbox.onchange = (e) => { this.autoRun = e.target.checked; };
            
            autoRunLabel.appendChild(autoRunCheckbox);
            autoRunLabel.appendChild(document.createTextNode('Auto-run'));
            
            controls.appendChild(autoRunLabel);

            const collapseBtn = document.createElement('button');
            collapseBtn.textContent = '−';
            collapseBtn.style.cssText = `
                background: transparent; color: #b5bac1; border: none; 
                font-size: 20px; cursor: pointer; padding: 0 4px;
                line-height: 1;
            `;
            collapseBtn.onclick = () => this.toggleCollapse(container, collapseBtn);

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                background: transparent; color: #b5bac1; border: none; 
                font-size: 20px; cursor: pointer; padding: 0 4px;
                line-height: 1;
            `;
            closeBtn.onclick = () => container.remove();
            
            controls.appendChild(collapseBtn);
            controls.appendChild(closeBtn);
            header.appendChild(title);
            header.appendChild(controls);

            this.statusElement = document.createElement('div');
            this.statusElement.textContent = 'Initializing...';
            this.statusElement.style.cssText = 'margin-bottom: 12px; font-size: 13px; color: #949ba4; padding: 8px; background: #1e1f22; border-radius: 4px;';

            this.listContainer = document.createElement('div');
            this.listContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;';

            container.appendChild(header);
            container.appendChild(this.statusElement);
            container.appendChild(this.listContainer);

            document.body.appendChild(container);
            this.element = container;
            this.makeDraggable(container, header);
        }

        makeDraggable(element, handle) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            handle.style.cursor = 'move';
            
            handle.onmousedown = (e) => {
                if (['BUTTON', 'INPUT', 'LABEL'].includes(e.target.tagName)) return;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            };

            const elementDrag = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                
                if (element.style.right) {
                    element.style.left = element.offsetLeft + "px";
                    element.style.right = 'auto';
                }

                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            };

            const closeDragElement = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
        }

        toggleCollapse(container, btn) {
            this.isCollapsed = !this.isCollapsed;
            if (this.isCollapsed) {
                this.statusElement.style.display = 'none';
                this.listContainer.style.display = 'none';
                btn.textContent = '+';
                container.style.width = 'auto';
                container.style.minWidth = 'auto';
            } else {
                this.statusElement.style.display = 'block';
                this.listContainer.style.display = 'flex';
                btn.textContent = '−';
                container.style.minWidth = '320px';
            }
        }

        log(text, type = 'info') {
            if (this.statusElement) {
                this.statusElement.textContent = text;
                this.statusElement.style.color = type === 'error' ? '#fa777c' : '#949ba4';
            }
            console.log(`[QuestClaimer] ${text}`);
        }

        createQuestRow(quest, onStartQuest) {
            const row = document.createElement('div');
            row.dataset.questId = quest.id;
            row.style.cssText = `
                display: flex; align-items: center; justify-content: space-between;
                background: #313338; padding: 8px; border-radius: 4px;
                border: 1px solid #1e1f22;
            `;

            const info = document.createElement('div');
            info.style.cssText = 'flex: 1; min-width: 0; margin-right: 10px;';
            
            const name = document.createElement('div');
            name.textContent = quest.config.messages.questName;
            name.style.cssText = 'font-weight: 500; color: #fff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            
            const task = document.createElement('div');
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
            const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
                .find(x => taskConfig.tasks[x] != null);
            task.textContent = taskName.replace(/_/g, ' ');
            task.style.cssText = 'font-size: 11px; color: #b5bac1; margin-top: 2px;';

            info.appendChild(name);
            info.appendChild(task);

            const btn = document.createElement('button');
            btn.textContent = 'Start';
            btn.style.cssText = `
                background: #5865F2; color: white; border: none; 
                padding: 6px 12px; border-radius: 3px; cursor: pointer;
                font-size: 12px; font-weight: 500; transition: background 0.2s;
                min-width: 60px;
            `;

            if (this.isQuestRunning) {
                btn.disabled = true;
                btn.style.opacity = 0.5;
                btn.style.cursor = 'not-allowed';
            }
            
            const progressBg = document.createElement('div');
            progressBg.style.cssText = 'height: 4px; background: #1e1f22; margin-top: 6px; border-radius: 2px; overflow: hidden; display: none;';
            const progressBar = document.createElement('div');
            progressBar.style.cssText = 'height: 100%; width: 0%; background: #248046; transition: width 0.3s;';
            progressBg.appendChild(progressBar);
            
            info.appendChild(progressBg);

            btn.onclick = async () => {
                if (this.isQuestRunning) return;
                this.isQuestRunning = true;

                const allBtns = this.listContainer.querySelectorAll('button');
                allBtns.forEach(b => { b.disabled = true; b.style.opacity = 0.5; b.style.cursor = 'not-allowed'; });
                
                btn.textContent = 'Running...';
                progressBg.style.display = 'block';
                
                try {
                    await onStartQuest(quest, (percent, msg) => {
                        progressBar.style.width = `${percent}%`;
                        this.log(msg);
                    });
                    btn.textContent = 'Done';
                    btn.style.background = '#248046';
                } catch (e) {
                    btn.textContent = 'Error';
                    btn.style.background = '#da373c';
                    this.log(e.message, 'error');
                } finally {
                    this.isQuestRunning = false;
                    const currentBtns = this.listContainer.querySelectorAll('button');
                    let nextBtn = null;

                    currentBtns.forEach(b => { 
                        if (b !== btn && b.textContent !== 'Done') {
                            b.disabled = false; 
                            b.style.opacity = 1; 
                            b.style.cursor = 'pointer'; 
                            if (!nextBtn && b.textContent === 'Start') {
                                nextBtn = b;
                            }
                        }
                    });

                    if (this.autoRun && nextBtn) {
                        setTimeout(() => nextBtn.click(), 1000);
                    }
                }
            };

            row.appendChild(info);
            row.appendChild(btn);
            return row;
        }

        setQuests(quests, onStartQuest) {
            if (quests.length === 0) {
                this.listContainer.innerHTML = '';
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = 'No active quests found.';
                emptyMsg.style.cssText = 'text-align: center; color: #949ba4; font-size: 13px; padding: 10px;';
                this.listContainer.appendChild(emptyMsg);
                return;
            }

            if (this.listContainer.firstChild && !this.listContainer.firstChild.dataset?.questId) {
                this.listContainer.innerHTML = '';
            }

            const existingRows = Array.from(this.listContainer.children);
            const existingIds = existingRows.map(row => row.dataset.questId).filter(Boolean);
            const newIds = quests.map(q => q.id);

            existingRows.forEach(row => {
                if (row.dataset.questId && !newIds.includes(row.dataset.questId)) {
                    row.remove();
                }
            });

            quests.forEach(quest => {
                if (!existingIds.includes(quest.id)) {
                    const row = this.createQuestRow(quest, onStartQuest);
                    this.listContainer.appendChild(row);
                }
            });
        }
    }

    // ==========================================
    // Discord Internals Access
    // ==========================================
    class DiscordInternals {
        constructor() {
            this.modules = this._extractModules();
        }

        _extractModules() {
            let wpRequire;
            if (typeof webpackChunkdiscord_app !== 'undefined') {
                wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                webpackChunkdiscord_app.pop();
            } else {
                throw new Error("Discord Webpack global not found.");
            }

            const modules = Object.values(wpRequire.c);
            const findModule = (filter) => {
                const mod = modules.find(x => x?.exports && filter(x.exports));
                return mod?.exports;
            };
            const getExport = (mod, key = 'Z') => mod?.[key] ?? mod?.ZP ?? mod;

            return {
                ApplicationStreamingStore: getExport(findModule(e => e?.Z?.__proto__?.getStreamerActiveStreamMetadata)),
                RunningGameStore: getExport(findModule(e => e?.ZP?.getRunningGames)),
                QuestsStore: getExport(findModule(e => e?.Z?.__proto__?.getQuest)),
                ChannelStore: getExport(findModule(e => e?.Z?.__proto__?.getAllThreadsForParent)),
                GuildChannelStore: getExport(findModule(e => e?.ZP?.getSFWDefaultChannel)),
                FluxDispatcher: getExport(findModule(e => e?.Z?.__proto__?.flushWaitQueue)),
                API: getExport(findModule(e => e?.tn?.get), 'tn')
            };
        }

        get stores() { return this.modules; }
        get api() { return this.modules.API; }
    }

    // ==========================================
    // Strategies: Task Handlers
    // ==========================================
    class TaskStrategy {
        constructor(internals, quest, onProgress) {
            this.internals = internals;
            this.quest = quest;
            this.api = internals.api;
            this.onProgress = onProgress;
        }

        async execute() { throw new Error("Not implemented"); }
        
        get secondsNeeded() {
            const taskConfig = this.quest.config.taskConfig ?? this.quest.config.taskConfigV2;
            const taskName = this.getTaskName();
            return taskConfig.tasks[taskName].target;
        }

        get secondsDone() {
            const taskName = this.getTaskName();
            return this.quest.userStatus?.progress?.[taskName]?.value ?? 0;
        }

        getTaskName() {
            const taskConfig = this.quest.config.taskConfig ?? this.quest.config.taskConfigV2;
            return ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
                .find(x => taskConfig.tasks[x] != null);
        }

        updateProgress(current, total) {
            const percent = (current / total) * 100;
            if (this.onProgress) {
                this.onProgress(percent, `Progress: ${Math.floor(current)}/${total}s (${Math.floor(percent)}%)`);
            }
        }
    }

    class VideoTaskStrategy extends TaskStrategy {
        async execute() {
            const { VIDEO_SPEED, VIDEO_INTERVAL, MAX_FUTURE_SECONDS } = CONFIG;
            const enrolledAt = new Date(this.quest.userStatus.enrolledAt).getTime();
            const secondsNeeded = this.secondsNeeded;
            let secondsDone = this.secondsDone;
            let completed = false;

            this.updateProgress(secondsDone, secondsNeeded);

            while (true) {
                const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + MAX_FUTURE_SECONDS;
                const timestamp = secondsDone + VIDEO_SPEED;
                
                if (maxAllowed - secondsDone >= VIDEO_SPEED) {
                    try {
                        const res = await this.api.post({
                            url: `/quests/${this.quest.id}/video-progress`,
                            body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) }
                        });
                        completed = res.body.completed_at != null;
                        secondsDone = Math.min(secondsNeeded, timestamp);
                        this.updateProgress(secondsDone, secondsNeeded);
                    } catch (e) {
                        console.error(e);
                        this.onProgress(0, `Error: ${e.message || 'Request failed'}`);
                    }
                }

                if (timestamp >= secondsNeeded || completed) break;
                await new Promise(r => setTimeout(r, VIDEO_INTERVAL * 1000));
            }

            if (!completed) {
                await this.api.post({
                    url: `/quests/${this.quest.id}/video-progress`,
                    body: { timestamp: secondsNeeded }
                });
            }
            this.updateProgress(secondsNeeded, secondsNeeded);
        }
    }

    class MockStoreStrategy extends TaskStrategy {
        constructor(internals, quest, onProgress, isApp) {
            super(internals, quest, onProgress);
            this.isApp = isApp;
            this.pid = Math.floor(Math.random() * CONFIG.PID_RANGE) + CONFIG.PID_OFFSET;
        }

        async waitForCompletion(cleanupCallback) {
            const secondsNeeded = this.secondsNeeded;
            const { FluxDispatcher } = this.internals.stores;
            let currentProgress = this.secondsDone;

            this.updateProgress(currentProgress, secondsNeeded);
            this.onProgress(0, "Quest active. Simulating progress...");

            const visualInterval = setInterval(() => {
                currentProgress++;
                if (currentProgress < secondsNeeded) {
                    this.updateProgress(currentProgress, secondsNeeded);
                }
            }, 1000);

            return new Promise((resolve) => {
                const handler = (data) => {
                    const realProgress = this.quest.config.configVersion === 1 
                        ? data.userStatus.streamProgressSeconds 
                        : Math.floor(data.userStatus.progress[this.getTaskName()].value);
                    
                    currentProgress = realProgress;
                    this.updateProgress(realProgress, secondsNeeded);

                    if (realProgress >= secondsNeeded) {
                        clearInterval(visualInterval);
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                        cleanupCallback();
                        resolve();
                    }
                };
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
            });
        }
    }

    class PlayOnDesktopStrategy extends MockStoreStrategy {
        async execute() {
            if (!this.isApp) {
                throw new Error("Desktop App required for this quest.");
            }

            const { RunningGameStore, FluxDispatcher } = this.internals.stores;
            const applicationId = this.quest.config.application.id;
            
            const res = await this.api.get({url: `/applications/public?application_ids=${applicationId}`});
            const appData = res.body[0];
            const exeName = appData.executables.find(x => x.os === "win32").name.replace(">", "");

            const fakeGame = {
                cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                exeName,
                exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                hidden: false,
                isLauncher: false,
                id: applicationId,
                name: appData.name,
                pid: this.pid,
                pidPath: [this.pid],
                processName: appData.name,
                start: Date.now(),
            };

            const originalGetRunningGames = RunningGameStore.getRunningGames;
            const originalGetGameForPID = RunningGameStore.getGameForPID;
            
            try {
                RunningGameStore.getRunningGames = () => [fakeGame];
                RunningGameStore.getGameForPID = (pid) => pid === this.pid ? fakeGame : null;
                
                FluxDispatcher.dispatch({
                    type: "RUNNING_GAMES_CHANGE", 
                    removed: [], 
                    added: [fakeGame], 
                    games: [fakeGame]
                });

                this.onProgress(0, `Spoofing game: ${appData.name}`);
                
                await this.waitForCompletion(() => {
                    FluxDispatcher.dispatch({
                        type: "RUNNING_GAMES_CHANGE", 
                        removed: [fakeGame], 
                        added: [], 
                        games: []
                    });
                });

            } finally {
                RunningGameStore.getRunningGames = originalGetRunningGames;
                RunningGameStore.getGameForPID = originalGetGameForPID;
            }
        }
    }

    class StreamOnDesktopStrategy extends MockStoreStrategy {
        async execute() {
            if (!this.isApp) {
                throw new Error("Desktop App required for this quest.");
            }

            const { ApplicationStreamingStore } = this.internals.stores;
            const originalGetStreamerActiveStreamMetadata = ApplicationStreamingStore.getStreamerActiveStreamMetadata;

            try {
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                    id: this.quest.config.application.id,
                    pid: this.pid,
                    sourceName: null
                });

                this.onProgress(0, `Spoofing stream. Join a VC with a friend!`);
                
                await this.waitForCompletion(() => {});

            } finally {
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = originalGetStreamerActiveStreamMetadata;
            }
        }
    }

    class ActivityStrategy extends TaskStrategy {
        async execute() {
            const { ChannelStore, GuildChannelStore } = this.internals.stores;
            
            const privateChannel = ChannelStore.getSortedPrivateChannels()[0];
            const guildChannel = Object.values(GuildChannelStore.getAllGuilds())
                .find(x => x?.VOCAL?.length > 0)?.VOCAL[0]?.channel;
            
            const channelId = privateChannel?.id ?? guildChannel?.id;

            if (!channelId) {
                throw new Error("No voice channel found.");
            }

            const streamKey = `call:${channelId}:1`;
            const secondsNeeded = this.secondsNeeded;
            let currentProgress = this.secondsDone;
            
            this.onProgress(0, `Spoofing activity in channel...`);
            this.updateProgress(currentProgress, secondsNeeded);

            while (true) {
                try {
                    const res = await this.api.post({
                        url: `/quests/${this.quest.id}/heartbeat`, 
                        body: { stream_key: streamKey, terminal: false }
                    });
                    
                    const realProgress = res.body.progress.PLAY_ACTIVITY.value;
                    currentProgress = realProgress;
                    this.updateProgress(currentProgress, secondsNeeded);

                    if (realProgress >= secondsNeeded) {
                        await this.api.post({
                            url: `/quests/${this.quest.id}/heartbeat`, 
                            body: { stream_key: streamKey, terminal: true }
                        });
                        break;
                    }
                } catch (e) {
                    console.error(e);
                }

                for (let i = 0; i < CONFIG.HEARTBEAT_INTERVAL; i++) {
                    await new Promise(r => setTimeout(r, 1000));
                    currentProgress++;
                    if (currentProgress < secondsNeeded) {
                        this.updateProgress(currentProgress, secondsNeeded);
                    }
                }
            }
        }
    }

    // ==========================================
    // Main Controller
    // ==========================================
    class QuestManager {
        constructor(ui) {
            this.ui = ui;
            this.internals = new DiscordInternals();
            this.isApp = typeof DiscordNative !== "undefined";

            const { QuestsStore } = this.internals.stores;
            if (QuestsStore?.addChangeListener) {
                QuestsStore.addChangeListener(() => this.updateQuests());
            }
        }

        updateQuests() {
            const quests = this.getEligibleQuests();
            this.ui.log(`Updated quests: ${quests.length} found.`);
            this.ui.setQuests(quests, (quest, onProgress) => this.runQuest(quest, onProgress));
        }

        getEligibleQuests() {
            const { QuestsStore } = this.internals.stores;
            return [...QuestsStore.quests.values()].filter(x => 
                x.id !== CONFIG.IGNORED_QUEST_ID && 
                x.userStatus?.enrolledAt && 
                !x.userStatus?.completedAt && 
                new Date(x.config.expiresAt).getTime() > Date.now()
            );
        }

        async runQuest(quest, onProgress) {
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
            const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
                .find(x => taskConfig.tasks[x] != null);

            let strategy;
            switch (taskName) {
                case "WATCH_VIDEO":
                case "WATCH_VIDEO_ON_MOBILE":
                    strategy = new VideoTaskStrategy(this.internals, quest, onProgress);
                    break;
                case "PLAY_ON_DESKTOP":
                    strategy = new PlayOnDesktopStrategy(this.internals, quest, onProgress, this.isApp);
                    break;
                case "STREAM_ON_DESKTOP":
                    strategy = new StreamOnDesktopStrategy(this.internals, quest, onProgress, this.isApp);
                    break;
                case "PLAY_ACTIVITY":
                    strategy = new ActivityStrategy(this.internals, quest, onProgress);
                    break;
                default:
                    throw new Error(`Unknown task type: ${taskName}`);
            }

            if (strategy) {
                await strategy.execute();
            }
        }
    }

    const ui = new OverlayUI();
    try {
        const manager = new QuestManager(ui);
        const quests = manager.getEligibleQuests();
        ui.log(`Found ${quests.length} active quests.`);
        ui.setQuests(quests, (quest, onProgress) => manager.runQuest(quest, onProgress));
    } catch (e) {
        ui.log("Initialization failed: " + e.message, 'error');
        console.error("Failed to initialize Quest Autoclaimer:", e);
    }
})();
