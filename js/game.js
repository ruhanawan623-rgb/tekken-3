/**
 * TEKKEN 3 - Master Game Orchestrator & UI Manager
 * Ties together Menus, 3D Character Select, Arcade Ladder, VS Mode, Practice Mode,
 * Match Lifecycle, Round Banners, and HUD Overlays.
 */

class TekkenGame {
    constructor() {
        this.state = 'TITLE'; // 'TITLE', 'MODE_SELECT', 'CHAR_SELECT', 'STAGE_SELECT', 'INTRO', 'FIGHT', 'ROUND_END', 'MATCH_END', 'PRACTICE'
        this.gameMode = 'arcade'; // 'arcade', 'vs', 'practice'
        
        this.p1CharId = 'jin';
        this.p2CharId = 'paul';
        this.currentStage = 'dojo';

        this.p1Fighter = null;
        this.p2Fighter = null;
        this.aiController = null;

        // Arcade Ladder Setup
        this.arcadeLadder = ['paul', 'eddy', 'king', 'yoshimitsu', 'heihachi'];
        this.currentLadderStage = 0;

        this.roundCount = 1;
        this.maxRoundsToWin = 2; // Best of 3
        this.roundTimer = 60;
        this.introTimer = 0;
        this.roundEndTimer = 0;

        // Practice Mode Settings
        this.practiceDummyAction = 'stand'; // 'stand', 'crouch', 'guard_all', 'random_attack'

        // Character Select Turntables
        this.p1SelectIndex = 0;
        this.p2SelectIndex = 1;
        this.characterList = ['jin', 'paul', 'eddy', 'king', 'yoshimitsu'];
        this.stagesList = ['dojo', 'cyber', 'shrine'];

        this.isPaused = false;
        this.lastTime = 0;
    }

    init() {
        // Initialize 3D Engine in container
        const container = document.getElementById('webgl-canvas-container');
        window.graphicsEngine.init(container);

        // Bind UI Event Listeners
        this.bindUIEvents();

        // Start Main Render Loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    bindUIEvents() {
        // Start Button / Title Click
        const btnStart = document.getElementById('btn-press-start');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                window.soundEngine.init();
                window.soundEngine.playMenuSelect();
                this.showModeSelect();
            });
        }

        // Mode Select Buttons
        const btnArcade = document.getElementById('btn-mode-arcade');
        const btnVS = document.getElementById('btn-mode-vs');
        const btnPractice = document.getElementById('btn-mode-practice');

        if (btnArcade) btnArcade.addEventListener('click', () => this.selectGameMode('arcade'));
        if (btnVS) btnVS.addEventListener('click', () => this.selectGameMode('vs'));
        if (btnPractice) btnPractice.addEventListener('click', () => this.selectGameMode('practice'));

        // Stage Select Buttons
        document.querySelectorAll('.stage-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stageId = e.currentTarget.dataset.stage;
                this.selectStage(stageId);
            });
        });

        // CRT Scanline Filter Toggle
        const crtToggle = document.getElementById('crt-toggle');
        if (crtToggle) {
            crtToggle.addEventListener('change', (e) => {
                document.getElementById('crt-overlay').classList.toggle('active', e.target.checked);
            });
        }

        // Audio Mute Toggle
        const audioToggle = document.getElementById('audio-mute-btn');
        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                const muted = window.soundEngine.toggleMute();
                audioToggle.textContent = muted ? '🔇 UNMUTE' : '🔊 SOUND';
            });
        }

        // Move List Popout Button
        const btnMoveList = document.getElementById('btn-toggle-movelist');
        const moveListModal = document.getElementById('movelist-modal');
        const btnCloseModal = document.getElementById('btn-close-movelist');

        if (btnMoveList && moveListModal) {
            btnMoveList.addEventListener('click', () => {
                this.populateMoveListModal();
                moveListModal.classList.add('visible');
            });
        }
        if (btnCloseModal && moveListModal) {
            btnCloseModal.addEventListener('click', () => {
                moveListModal.classList.remove('visible');
            });
        }

        // On-screen Mobile Touch Pad
        this.bindTouchControls();
    }

    bindTouchControls() {
        const touchButtons = document.querySelectorAll('.touch-btn');
        touchButtons.forEach(btn => {
            const action = btn.dataset.action;
            const trigger = (e) => {
                e.preventDefault();
                window.soundEngine.init();
                window.inputManager.triggerVirtualAction(action);
            };

            btn.addEventListener('touchstart', trigger, { passive: false });
            btn.addEventListener('mousedown', trigger);

            if (action.startsWith('forward') || action.startsWith('back') || action.startsWith('crouch')) {
                const release = (e) => {
                    e.preventDefault();
                    window.inputManager.triggerVirtualAction('release_dir');
                };
                btn.addEventListener('touchend', release, { passive: false });
                btn.addEventListener('mouseup', release);
            }
        });
    }

    // --- NAVIGATION & SCREENS ---

    showModeSelect() {
        this.state = 'MODE_SELECT';
        this.hideAllScreens();
        document.getElementById('screen-mode-select').classList.remove('hidden');
    }

    selectGameMode(mode) {
        window.soundEngine.playMenuSelect();
        this.gameMode = mode;
        this.showCharacterSelect();
    }

    showCharacterSelect() {
        this.state = 'CHAR_SELECT';
        this.hideAllScreens();
        document.getElementById('screen-char-select').classList.remove('hidden');

        this.renderCharacterGrid();
        this.updateCharacterPreview();
    }

    renderCharacterGrid() {
        const grid = document.getElementById('char-grid');
        if (!grid) return;
        grid.innerHTML = '';

        this.characterList.forEach((charId, idx) => {
            const conf = window.fighterModelBuilder.getCharacterConfig(charId, 1);
            const card = document.createElement('div');
            card.className = `char-card ${idx === this.p1SelectIndex ? 'p1-selected' : ''} ${this.gameMode === 'vs' && idx === this.p2SelectIndex ? 'p2-selected' : ''}`;
            card.dataset.index = idx;
            card.innerHTML = `
                <div class="char-card-portrait" style="background: ${conf.portraitBg}">
                    <span class="char-card-letter">${conf.name[0]}</span>
                </div>
                <div class="char-card-name">${conf.name.split(' ')[0]}</div>
            `;

            card.addEventListener('click', () => {
                window.soundEngine.playMenuMove();
                this.p1SelectIndex = idx;
                this.p1CharId = this.characterList[idx];
                this.renderCharacterGrid();
                this.updateCharacterPreview();
            });

            grid.appendChild(card);
        });

        // Stage Selector in Char Select
        const stageGrid = document.getElementById('stage-select-bar');
        if (stageGrid) {
            stageGrid.innerHTML = `
                <button class="stage-tag ${this.currentStage === 'dojo' ? 'active' : ''}" onclick="window.game.selectStage('dojo')">MISHIMA DOJO</button>
                <button class="stage-tag ${this.currentStage === 'cyber' ? 'active' : ''}" onclick="window.game.selectStage('cyber')">CYBER TOKYO</button>
                <button class="stage-tag ${this.currentStage === 'shrine' ? 'active' : ''}" onclick="window.game.selectStage('shrine')">SUNSET SHRINE</button>
            `;
        }

        // Confirm Selection Button
        const btnConfirm = document.getElementById('btn-confirm-char');
        if (btnConfirm) {
            btnConfirm.onclick = () => {
                window.soundEngine.playMenuSelect();
                this.startMatchSetup();
            };
        }
    }

    selectStage(stageId) {
        window.soundEngine.playMenuMove();
        this.currentStage = stageId;
        window.graphicsEngine.buildStage(stageId);
        this.renderCharacterGrid();
    }

    updateCharacterPreview() {
        const p1Conf = window.fighterModelBuilder.getCharacterConfig(this.characterList[this.p1SelectIndex], 1);
        const nameEl = document.getElementById('p1-preview-name');
        const styleEl = document.getElementById('p1-preview-style');
        const descEl = document.getElementById('p1-preview-desc');

        if (nameEl) nameEl.textContent = p1Conf.name;
        if (styleEl) styleEl.textContent = `${p1Conf.country} • ${p1Conf.fightingStyle}`;
        if (descEl) descEl.textContent = p1Conf.description;
    }

    // --- MATCH START & LIFECYCLE ---

    startMatchSetup() {
        this.p1CharId = this.characterList[this.p1SelectIndex];

        if (this.gameMode === 'arcade') {
            this.currentLadderStage = 0;
            this.p2CharId = this.arcadeLadder[this.currentLadderStage];
        } else if (this.gameMode === 'practice') {
            this.p2CharId = 'paul';
        } else {
            // VS 2P
            this.p2CharId = this.characterList[this.p2SelectIndex] || 'paul';
        }

        this.roundCount = 1;
        this.startMatch();
    }

    startMatch() {
        this.hideAllScreens();
        document.getElementById('hud-layer').classList.remove('hidden');

        // Build Stage
        window.graphicsEngine.buildStage(this.currentStage);

        // Remove old fighter models if existing
        if (this.p1Fighter && this.p1Fighter.rig) {
            window.graphicsEngine.scene.remove(this.p1Fighter.rig.root);
        }
        if (this.p2Fighter && this.p2Fighter.rig) {
            window.graphicsEngine.scene.remove(this.p2Fighter.rig.root);
        }

        // Create P1 & P2 Fighters
        this.p1Fighter = new Fighter('p1', this.p1CharId, 1, false);
        this.p2Fighter = new Fighter('p2', this.p2CharId, 2, this.gameMode !== 'vs');

        // Create 3D Articulated Rigs
        const p1Rig = window.fighterModelBuilder.buildModel(THREE, this.p1CharId, 1);
        const p2Rig = window.fighterModelBuilder.buildModel(THREE, this.p2CharId, 2);

        window.graphicsEngine.scene.add(p1Rig.root);
        window.graphicsEngine.scene.add(p2Rig.root);

        this.p1Fighter.setRig(p1Rig);
        this.p2Fighter.setRig(p2Rig);

        // Set Input & AI Controllers
        window.inputManager.setFighters(this.p1Fighter, this.p2Fighter, this.gameMode === 'vs');

        if (this.p2Fighter.isAI) {
            const diff = this.gameMode === 'practice' ? 'easy' : 
                         this.currentLadderStage >= 4 ? 'master' : 
                         this.currentLadderStage >= 2 ? 'hard' : 'medium';
            this.aiController = new FighterAI(this.p2Fighter, diff);
        } else {
            this.aiController = null;
        }

        // Reset positions & HP
        this.p1Fighter.resetForRound(-1.8);
        this.p2Fighter.resetForRound(1.8);

        // Reset Combat System
        window.combatSystem.resetMatch(60);

        // Start BGM & Announcer
        window.soundEngine.startBGM(this.currentStage);
        
        // Show Match Intro Banner
        this.startRoundIntro();
    }

    startRoundIntro() {
        this.state = 'INTRO';
        this.introTimer = 2.4;

        this.p1Fighter.resetForRound(-1.8);
        this.p2Fighter.resetForRound(1.8);
        window.combatSystem.resetMatch(60);

        const banner = document.getElementById('announcer-banner');
        banner.className = 'announcer-banner show';
        
        const isFinal = (this.p1Fighter.roundsWon === this.maxRoundsToWin - 1 && this.p2Fighter.roundsWon === this.maxRoundsToWin - 1);
        const roundTitle = isFinal ? "FINAL ROUND" : `ROUND ${this.roundCount}`;
        
        banner.innerHTML = `<div class="announcer-big">${roundTitle}</div><div class="announcer-sub">GET READY...</div>`;
        window.soundEngine.announceRound(this.roundCount, isFinal);

        setTimeout(() => {
            banner.innerHTML = `<div class="announcer-big fight-text">FIGHT!</div>`;
        }, 1300);

        setTimeout(() => {
            banner.className = 'announcer-banner';
            this.state = 'FIGHT';
        }, 2200);

        this.updateHUDStaticInfo();
    }

    updateHUDStaticInfo() {
        document.getElementById('p1-name-hud').textContent = this.p1Fighter.config.name;
        document.getElementById('p2-name-hud').textContent = this.p2Fighter.config.name;
        this.renderRoundBadges();
    }

    renderRoundBadges() {
        const p1Wins = document.getElementById('p1-round-wins');
        const p2Wins = document.getElementById('p2-round-wins');

        p1Wins.innerHTML = '';
        p2Wins.innerHTML = '';

        for (let i = 0; i < this.maxRoundsToWin; i++) {
            p1Wins.innerHTML += `<span class="round-dot ${i < this.p1Fighter.roundsWon ? 'filled' : ''}"></span>`;
            p2Wins.innerHTML += `<span class="round-dot ${i < this.p2Fighter.roundsWon ? 'filled' : ''}"></span>`;
        }
    }

    // --- MAIN GAME LOOP (60 FPS) ---

    gameLoop(timestamp) {
        requestAnimationFrame((t) => this.gameLoop(t));

        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Clamp dt for stability
        this.lastTime = timestamp;

        if (this.isPaused) return;

        // 1. Process Unified User Inputs (Keyboard, Gamepad, Touch)
        window.inputManager.update();

        // 2. State-specific Processing
        if (this.state === 'FIGHT') {
            this.updateFightingState(dt);
        } else if (this.state === 'INTRO') {
            this.updateIntroState(dt);
        } else if (this.state === 'ROUND_END') {
            this.updateRoundEndState(dt);
        }

        // 3. Update Camera Tracking
        if (this.p1Fighter && this.p2Fighter) {
            window.graphicsEngine.updateCamera(this.p1Fighter.pos, this.p2Fighter.pos, dt);
        }

        // 4. Render 3D Graphics
        window.graphicsEngine.render(dt);

        // 5. Update HUD Elements
        this.updateHUDDynamic();
    }

    updateFightingState(dt) {
        // AI Decision update
        if (this.aiController) {
            this.aiController.update(this.p1Fighter, dt);
        }

        // Combat arbitration & physics time dilation
        const effectiveDt = window.combatSystem.update(this.p1Fighter, this.p2Fighter, dt);

        // Update Fighter state machines
        this.p1Fighter.update(effectiveDt, this.p2Fighter);
        this.p2Fighter.update(effectiveDt, this.p1Fighter);

        // Check if Round has ended
        if (window.combatSystem.isRoundOver) {
            this.state = 'ROUND_END';
            this.roundEndTimer = 3.5;
            this.renderRoundBadges();

            const banner = document.getElementById('announcer-banner');
            banner.className = 'announcer-banner show';
            const winner = window.combatSystem.roundWinner;
            
            if (winner === 'p1') {
                banner.innerHTML = `<div class="announcer-big ko-text">K.O.</div><div class="announcer-sub">${this.p1Fighter.config.name} WINS</div>`;
            } else if (winner === 'p2') {
                banner.innerHTML = `<div class="announcer-big ko-text">K.O.</div><div class="announcer-sub">${this.p2Fighter.config.name} WINS</div>`;
            } else {
                banner.innerHTML = `<div class="announcer-big">DOUBLE K.O.</div>`;
            }
        }
    }

    updateIntroState(dt) {
        if (this.p1Fighter && this.p2Fighter) {
            this.p1Fighter.update(dt, this.p2Fighter);
            this.p2Fighter.update(dt, this.p1Fighter);
        }
    }

    updateRoundEndState(dt) {
        this.roundEndTimer -= dt;

        if (this.p1Fighter && this.p2Fighter) {
            this.p1Fighter.update(dt, this.p2Fighter);
            this.p2Fighter.update(dt, this.p1Fighter);
        }

        if (this.roundEndTimer <= 0) {
            document.getElementById('announcer-banner').className = 'announcer-banner';
            window.graphicsEngine.stopCinematicKO();

            // Check if Match has been won (First to 2 rounds)
            if (this.p1Fighter.roundsWon >= this.maxRoundsToWin) {
                this.handleMatchVictory('p1');
            } else if (this.p2Fighter.roundsWon >= this.maxRoundsToWin) {
                this.handleMatchVictory('p2');
            } else {
                // Next Round
                this.roundCount++;
                this.startRoundIntro();
            }
        }
    }

    handleMatchVictory(winner) {
        if (this.gameMode === 'arcade' && winner === 'p1') {
            this.currentLadderStage++;
            if (this.currentLadderStage < this.arcadeLadder.length) {
                // Next Ladder Stage Opponent!
                this.p2CharId = this.arcadeLadder[this.currentLadderStage];
                this.roundCount = 1;
                this.startMatch();
                return;
            }
        }

        // Show Game Over / Victory Modal
        this.state = 'MATCH_END';
        this.hideAllScreens();
        
        const winScreen = document.getElementById('screen-match-over');
        winScreen.classList.remove('hidden');

        const title = document.getElementById('match-over-title');
        const desc = document.getElementById('match-over-desc');
        const winnerFighter = winner === 'p1' ? this.p1Fighter : this.p2Fighter;

        if (winner === 'p1' && this.gameMode === 'arcade') {
            title.textContent = "CONGRATULATIONS!";
            desc.textContent = `${this.p1Fighter.config.name} IS THE KING OF THE IRON FIST TOURNAMENT!`;
        } else {
            title.textContent = `${winnerFighter.config.name} WINS!`;
            desc.textContent = `FINAL SCORE: ${this.p1Fighter.roundsWon} - ${this.p2Fighter.roundsWon}`;
        }

        // Rematch & Main Menu listeners
        document.getElementById('btn-rematch').onclick = () => {
            this.roundCount = 1;
            this.startMatch();
        };
        document.getElementById('btn-main-menu').onclick = () => {
            window.soundEngine.stopBGM();
            this.showModeSelect();
        };
    }

    // --- HUD UPDATES ---

    updateHUDDynamic() {
        if (!this.p1Fighter || !this.p2Fighter) return;

        // Health Bars
        const p1Pct = Math.max(0, (this.p1Fighter.health / this.p1Fighter.maxHealth) * 100);
        const p1RedPct = Math.max(0, (this.p1Fighter.redHealth / this.p1Fighter.maxHealth) * 100);
        const p2Pct = Math.max(0, (this.p2Fighter.health / this.p2Fighter.maxHealth) * 100);
        const p2RedPct = Math.max(0, (this.p2Fighter.redHealth / this.p2Fighter.maxHealth) * 100);

        document.getElementById('p1-health-bar').style.width = `${p1Pct}%`;
        document.getElementById('p1-health-red').style.width = `${p1RedPct}%`;
        document.getElementById('p2-health-bar').style.width = `${p2Pct}%`;
        document.getElementById('p2-health-red').style.width = `${p2RedPct}%`;

        // Rage Aura Glow Indicators
        document.getElementById('p1-rage-aura').classList.toggle('active', this.p1Fighter.isRageActive);
        document.getElementById('p2-rage-aura').classList.toggle('active', this.p2Fighter.isRageActive);

        // Timer
        const timeVal = Math.ceil(window.combatSystem.matchTime);
        document.getElementById('match-timer').textContent = timeVal < 10 ? `0${timeVal}` : timeVal;

        // Combo Counter HUD
        const comboP1 = document.getElementById('p1-combo-hud');
        const comboP2 = document.getElementById('p2-combo-hud');

        if (this.p2Fighter.comboHitsReceived >= 2) {
            comboP1.innerHTML = `<span class="combo-num">${this.p2Fighter.comboHitsReceived}</span> HITS! <span class="combo-dmg">${this.p2Fighter.comboDamageReceived} DMG</span>`;
            comboP1.classList.add('visible');
        } else {
            comboP1.classList.remove('visible');
        }

        if (this.p1Fighter.comboHitsReceived >= 2) {
            comboP2.innerHTML = `<span class="combo-num">${this.p1Fighter.comboHitsReceived}</span> HITS! <span class="combo-dmg">${this.p1Fighter.comboDamageReceived} DMG</span>`;
            comboP2.classList.add('visible');
        } else {
            comboP2.classList.remove('visible');
        }
    }

    populateMoveListModal() {
        const container = document.getElementById('movelist-content');
        if (!container || !this.p1Fighter) return;

        const conf = this.p1Fighter.config;
        const moves = this.p1Fighter.moveList;

        let html = `<h3>${conf.name} - COMMAND LIST</h3><table class="movelist-table">
            <thead><tr><th>MOVE NAME</th><th>COMMAND</th><th>TYPE</th><th>DAMAGE</th></tr></thead><tbody>`;

        for (let key in moves) {
            const m = moves[key];
            html += `<tr>
                <td><strong>${m.name}</strong></td>
                <td><span class="cmd-badge">${m.command}</span></td>
                <td><span class="type-badge ${m.type}">${m.type.toUpperCase()}</span></td>
                <td>${m.damage}</td>
            </tr>`;
        }

        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    hideAllScreens() {
        document.querySelectorAll('.game-screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('hud-layer').classList.add('hidden');
    }
}

// Global instance & boot on load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new TekkenGame();
    window.game.init();
});
