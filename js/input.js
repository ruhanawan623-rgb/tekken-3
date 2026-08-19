/**
 * TEKKEN 3 - Unified Multi-Device Input Handler
 * Supports 1P & 2P Keyboards, Gamepad API (Xbox / PlayStation controllers),
 * and On-Screen Mobile Virtual Touch Controls.
 */

class InputManager {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.gamepads = {};
        this.p1Fighter = null;
        this.p2Fighter = null;
        this.isTwoPlayer = false;

        // Command history for Tekken motion inputs (e.g. f,n,d,df+2)
        this.p1History = [];
        this.p2History = [];

        this.initKeyboard();
        this.initGamepad();
    }

    setFighters(p1, p2, isTwoPlayer = false) {
        this.p1Fighter = p1;
        this.p2Fighter = p2;
        this.isTwoPlayer = isTwoPlayer;
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    initGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
        });
    }

    isPressed(key) {
        return Boolean(this.keys[key]);
    }

    justPressed(key) {
        return Boolean(this.keys[key]) && !Boolean(this.prevKeys[key]);
    }

    update() {
        this.pollGamepad();

        // 1P Control Processing
        if (this.p1Fighter && !this.p1Fighter.isAI && this.p1Fighter.health > 0) {
            this.processP1Inputs();
        }

        // 2P Control Processing
        if (this.p2Fighter && this.isTwoPlayer && !this.p2Fighter.isAI && this.p2Fighter.health > 0) {
            this.processP2Inputs();
        }

        // Clone current keys for edge detection
        this.prevKeys = { ...this.keys };
    }

    processP1Inputs() {
        const p1 = this.p1Fighter;

        // --- ATTACK BUTTONS ---
        // LP (1) -> U key
        if (this.justPressed('KeyU') || this.justPressed('u')) {
            if (this.isPressed('KeyS') || this.isPressed('s')) {
                p1.executeMove('crouch_sweep');
            } else {
                p1.executeMove('left_punch');
            }
            return;
        }

        // RP (2) -> I key
        if (this.justPressed('KeyI') || this.justPressed('i')) {
            if ((this.isPressed('KeyS') || this.isPressed('s')) && (this.isPressed('KeyD') || this.isPressed('d'))) {
                // Down-Forward+2 -> Launcher Uppercut / EWGF!
                if (p1.characterId === 'jin' || p1.characterId === 'heihachi') {
                    p1.executeMove('ewgf');
                } else if (p1.characterId === 'paul') {
                    p1.executeMove('deathfist');
                } else {
                    p1.executeMove('launcher');
                }
            } else {
                p1.executeMove('right_punch');
            }
            return;
        }

        // LK (3) -> J key
        if (this.justPressed('KeyJ') || this.justPressed('j')) {
            if (this.isPressed('KeyS') || this.isPressed('s')) {
                p1.executeMove('crouch_sweep');
            } else {
                p1.executeMove('left_kick');
            }
            return;
        }

        // RK (4) -> K key
        if (this.justPressed('KeyK') || this.justPressed('k')) {
            if (this.isPressed('KeyS') || this.isPressed('s')) {
                p1.executeMove('crouch_sweep');
            } else {
                p1.executeMove('right_kick');
            }
            return;
        }

        // Launcher direct shortcut (L key)
        if (this.justPressed('KeyL') || this.justPressed('l')) {
            p1.executeMove('launcher');
            return;
        }

        // Throw shortcut (O key)
        if (this.justPressed('KeyO') || this.justPressed('o')) {
            p1.executeMove('throw');
            return;
        }

        // Rage Art / Special (Space key)
        if (this.justPressed('Space')) {
            if (p1.isRageActive) {
                p1.executeMove('rage_art');
            } else {
                this.executeFighterSpecial(p1);
            }
            return;
        }

        // --- 3D SIDESTEPPING ---
        // Q: Sidestep into background (-Z)
        if (this.justPressed('KeyQ') || this.justPressed('q')) {
            p1.sidestep(-1);
            return;
        }
        // E: Sidestep into foreground (+Z)
        if (this.justPressed('KeyE') || this.justPressed('e')) {
            p1.sidestep(1);
            return;
        }

        // --- MOVEMENT & GUARDS ---
        const moveForward = (p1.facing === 1 && (this.isPressed('KeyD') || this.isPressed('d'))) ||
                            (p1.facing === -1 && (this.isPressed('KeyA') || this.isPressed('a')));

        const moveBack = (p1.facing === 1 && (this.isPressed('KeyA') || this.isPressed('a'))) ||
                         (p1.facing === -1 && (this.isPressed('KeyD') || this.isPressed('d')));

        const crouch = this.isPressed('KeyS') || this.isPressed('s');
        const jump = this.justPressed('KeyW') || this.justPressed('w');

        if (jump) {
            p1.jump();
        } else if (crouch) {
            p1.crouch(moveBack); // Low Guard if backing up while crouching
        } else if (moveForward) {
            p1.walk(1);
        } else if (moveBack) {
            p1.walk(-1); // High Guard auto while walking backward
        } else {
            p1.standIdle();
        }
    }

    processP2Inputs() {
        const p2 = this.p2Fighter;

        // P2 Attacks (Numpad)
        if (this.justPressed('Numpad4')) {
            p2.executeMove('left_punch');
            return;
        }
        if (this.justPressed('Numpad5')) {
            if (this.isPressed('ArrowDown') && this.isPressed('ArrowLeft')) {
                this.executeFighterSpecial(p2);
            } else {
                p2.executeMove('right_punch');
            }
            return;
        }
        if (this.justPressed('Numpad1')) {
            p2.executeMove('left_kick');
            return;
        }
        if (this.justPressed('Numpad2')) {
            if (this.isPressed('ArrowDown')) {
                p2.executeMove('crouch_sweep');
            } else {
                p2.executeMove('right_kick');
            }
            return;
        }
        if (this.justPressed('Numpad0')) {
            p2.executeMove('throw');
            return;
        }

        // P2 Sidesteps
        if (this.justPressed('PageUp')) {
            p2.sidestep(-1);
            return;
        }
        if (this.justPressed('PageDown')) {
            p2.sidestep(1);
            return;
        }

        // P2 Movement
        const moveForward = (p2.facing === 1 && this.isPressed('ArrowRight')) ||
                            (p2.facing === -1 && this.isPressed('ArrowLeft'));

        const moveBack = (p2.facing === 1 && this.isPressed('ArrowLeft')) ||
                         (p2.facing === -1 && this.isPressed('ArrowRight'));

        const crouch = this.isPressed('ArrowDown');
        const jump = this.justPressed('ArrowUp');

        if (jump) {
            p2.jump();
        } else if (crouch) {
            p2.crouch(moveBack);
        } else if (moveForward) {
            p2.walk(1);
        } else if (moveBack) {
            p2.walk(-1);
        } else {
            p2.standIdle();
        }
    }

    executeFighterSpecial(fighter) {
        const id = fighter.characterId;
        if (id === 'jin' || id === 'heihachi') {
            fighter.executeMove('ewgf');
        } else if (id === 'paul') {
            fighter.executeMove('deathfist');
        } else if (id === 'eddy') {
            fighter.executeMove('capoeira_spin');
        } else if (id === 'king') {
            fighter.executeMove('dropkick');
        } else if (id === 'yoshimitsu') {
            fighter.executeMove('sword_spin');
        } else {
            fighter.executeMove('launcher');
        }
    }

    pollGamepad() {
        if (!navigator.getGamepads) return;
        const pads = navigator.getGamepads();
        if (!pads || !pads[0]) return;

        const gp = pads[0];
        const p1 = this.p1Fighter;
        if (!p1 || p1.isAI || p1.health <= 0) return;

        // Gamepad Buttons Mapping
        // 0: A (Cross) -> LK (3)
        // 1: B (Circle) -> RK (4)
        // 2: X (Square) -> LP (1)
        // 3: Y (Triangle) -> RP (2)
        // 4: LB (L1) -> Sidestep Left
        // 5: RB (R1) -> Throw
        // 6: LT (L2) -> Sidestep Right
        // 7: RT (R2) -> Rage Art
        if (gp.buttons[2] && gp.buttons[2].pressed) p1.executeMove('left_punch');
        if (gp.buttons[3] && gp.buttons[3].pressed) p1.executeMove('right_punch');
        if (gp.buttons[0] && gp.buttons[0].pressed) p1.executeMove('left_kick');
        if (gp.buttons[1] && gp.buttons[1].pressed) p1.executeMove('right_kick');
        if (gp.buttons[4] && gp.buttons[4].pressed) p1.sidestep(-1);
        if (gp.buttons[6] && gp.buttons[6].pressed) p1.sidestep(1);
        if (gp.buttons[5] && gp.buttons[5].pressed) p1.executeMove('throw');
        if (gp.buttons[7] && gp.buttons[7].pressed) {
            if (p1.isRageActive) p1.executeMove('rage_art');
            else this.executeFighterSpecial(p1);
        }

        // D-Pad / Thumbstick Directions
        const axisX = gp.axes[0] || (gp.buttons[15] && gp.buttons[15].pressed ? 1 : gp.buttons[14] && gp.buttons[14].pressed ? -1 : 0);
        const axisY = gp.axes[1] || (gp.buttons[13] && gp.buttons[13].pressed ? 1 : gp.buttons[12] && gp.buttons[12].pressed ? -1 : 0);

        if (axisY < -0.6) {
            p1.jump();
        } else if (axisY > 0.6) {
            p1.crouch(axisX * p1.facing < -0.3);
        } else if (axisX * p1.facing > 0.4) {
            p1.walk(1);
        } else if (axisX * p1.facing < -0.4) {
            p1.walk(-1);
        }
    }

    // Touch Virtual Control Trigger
    triggerVirtualAction(action) {
        if (!this.p1Fighter || this.p1Fighter.health <= 0) return;
        const p1 = this.p1Fighter;

        switch (action) {
            case 'lp': p1.executeMove('left_punch'); break;
            case 'rp': p1.executeMove('right_punch'); break;
            case 'lk': p1.executeMove('left_kick'); break;
            case 'rk': p1.executeMove('right_kick'); break;
            case 'launcher': p1.executeMove('launcher'); break;
            case 'special': this.executeFighterSpecial(p1); break;
            case 'throw': p1.executeMove('throw'); break;
            case 'rage': if (p1.isRageActive) p1.executeMove('rage_art'); else this.executeFighterSpecial(p1); break;
            case 'ss_left': p1.sidestep(-1); break;
            case 'ss_right': p1.sidestep(1); break;
            case 'jump': p1.jump(); break;
            case 'crouch': p1.crouch(false); break;
            case 'forward': p1.walk(1); break;
            case 'back': p1.walk(-1); break;
            case 'release_dir': p1.standIdle(); break;
        }
    }
}

window.inputManager = new InputManager();
