/**
 * TEKKEN 3 - Adaptive Arcade Fighter AI
 * Emulates authentic Tekken arcade CPU behavior: spacing/footsies, 3D sidesteps,
 * high/low mixups, whiff punishing, and aerial juggle combos.
 */

class FighterAI {
    constructor(fighter, difficulty = 'medium') {
        this.fighter = fighter;
        this.difficulty = difficulty; // 'easy', 'medium', 'hard', 'master'

        this.decisionTimer = 0;
        this.decisionInterval = 0.12; // 120ms reaction cycle
        this.currentAction = 'idle';
        this.actionTimer = 0;
        this.comboQueue = [];

        // Difficulty Tuning
        this.params = this.getDifficultyParams(difficulty);
    }

    setDifficulty(diff) {
        this.difficulty = diff;
        this.params = this.getDifficultyParams(diff);
    }

    getDifficultyParams(diff) {
        switch (diff) {
            case 'easy':
                return {
                    reactionSpeed: 0.28,
                    blockChance: 0.35,
                    counterChance: 0.3,
                    comboProficiency: 0.3,
                    sidestepChance: 0.15,
                    aggression: 0.45
                };
            case 'hard':
                return {
                    reactionSpeed: 0.08,
                    blockChance: 0.82,
                    counterChance: 0.8,
                    comboProficiency: 0.85,
                    sidestepChance: 0.55,
                    aggression: 0.78
                };
            case 'master':
                return {
                    reactionSpeed: 0.04,
                    blockChance: 0.95,
                    counterChance: 0.92,
                    comboProficiency: 0.98,
                    sidestepChance: 0.75,
                    aggression: 0.9
                };
            case 'medium':
            default:
                return {
                    reactionSpeed: 0.16,
                    blockChance: 0.6,
                    counterChance: 0.55,
                    comboProficiency: 0.6,
                    sidestepChance: 0.35,
                    aggression: 0.62
                };
        }
    }

    update(opponent, dt) {
        if (!this.fighter || !opponent || this.fighter.health <= 0) return;

        this.decisionTimer += dt;
        this.actionTimer -= dt;

        // Process queued combo moves (e.g. during an aerial juggle)
        if (this.comboQueue.length > 0 && this.fighter.canAct()) {
            const nextMove = this.comboQueue.shift();
            this.fighter.executeMove(nextMove);
            return;
        }

        // Periodic AI brain cycle
        if (this.decisionTimer >= this.params.reactionSpeed) {
            this.decisionTimer = 0;
            this.makeDecision(opponent);
        }

        // Execute sustained movement (walking/crouching)
        this.executeSustainedAction();
    }

    makeDecision(opponent) {
        if (!this.fighter.canAct()) return;

        const xDist = Math.abs(opponent.pos.x - this.fighter.pos.x);
        const zDist = Math.abs(opponent.pos.z - this.fighter.pos.z);

        // 1. Reactive Defense: Player is attacking
        if (opponent.isAttacking() && opponent.currentMove) {
            const move = opponent.currentMove;
            const roll = Math.random();

            // 3D Sidestep Evasion
            if (roll < this.params.sidestepChance && ['high', 'mid'].includes(move.type)) {
                this.fighter.sidestep(Math.random() > 0.5 ? 1 : -1);
                return;
            }

            // Guard High or Guard Low
            if (roll < this.params.blockChance) {
                if (move.type === 'low') {
                    this.currentAction = 'crouch_guard';
                    this.actionTimer = 0.4;
                    return;
                } else if (move.type === 'high' || move.type === 'mid') {
                    this.currentAction = 'guard';
                    this.actionTimer = 0.35;
                    return;
                }
            }
        }

        // 2. Juggle Follow-up: Opponent is launched in the air!
        if (opponent.isJuggleAirborne && opponent.pos.y > 0.5) {
            if (Math.random() < this.params.comboProficiency) {
                this.queueJuggleCombo();
                return;
            }
        }

        // 3. Rage Art Execution: Low HP finisher!
        if (this.fighter.isRageActive && xDist < 2.0 && Math.random() < 0.4) {
            this.fighter.executeMove('rage_art');
            return;
        }

        // 4. Offensive Spacing & Attack Decision
        if (xDist > 2.8) {
            // Far distance: Advance or close in
            this.currentAction = 'walk_forward';
            this.actionTimer = 0.35 + Math.random() * 0.2;
        } else if (xDist > 1.4) {
            // Mid distance: Poke with long reach or signature specials
            const roll = Math.random();
            if (roll < 0.35) {
                this.currentAction = 'walk_forward';
                this.actionTimer = 0.2;
            } else if (roll < 0.6) {
                this.fighter.executeMove('left_kick'); // Mid poke
            } else if (roll < 0.8) {
                this.fighter.executeMove('right_kick'); // Roundhouse
            } else {
                this.executeSpecialMove();
            }
        } else {
            // Close Range Combat: Fast jabs, mixups, launchers, or throws!
            const roll = Math.random();
            if (roll < 0.25) {
                this.fighter.executeMove('left_punch'); // Fast 10f jab
            } else if (roll < 0.45) {
                this.fighter.executeMove('right_punch'); // 2
            } else if (roll < 0.65) {
                this.fighter.executeMove('launcher'); // Launch into juggle!
            } else if (roll < 0.8) {
                this.fighter.executeMove('crouch_sweep'); // Low sweep mixup
            } else if (roll < 0.9) {
                this.fighter.executeMove('throw'); // Close grab
            } else {
                this.executeSpecialMove();
            }
        }
    }

    executeSpecialMove() {
        const id = this.fighter.characterId;
        if (id === 'jin' || id === 'heihachi') {
            this.fighter.executeMove('ewgf');
        } else if (id === 'paul') {
            this.fighter.executeMove('deathfist');
        } else if (id === 'eddy') {
            this.fighter.executeMove('capoeira_spin');
        } else if (id === 'king') {
            this.fighter.executeMove('dropkick');
        } else if (id === 'yoshimitsu') {
            this.fighter.executeMove('sword_spin');
        } else {
            this.fighter.executeMove('launcher');
        }
    }

    queueJuggleCombo() {
        const id = this.fighter.characterId;
        if (id === 'jin' || id === 'heihachi') {
            this.comboQueue = ['left_punch', 'right_punch', 'right_kick'];
        } else if (id === 'paul') {
            this.comboQueue = ['left_punch', 'deathfist'];
        } else if (id === 'eddy') {
            this.comboQueue = ['left_kick', 'right_kick'];
        } else {
            this.comboQueue = ['left_punch', 'right_punch'];
        }
    }

    executeSustainedAction() {
        if (!this.fighter.canAct()) return;

        if (this.actionTimer > 0) {
            if (this.currentAction === 'walk_forward') {
                this.fighter.walk(1);
            } else if (this.currentAction === 'walk_back' || this.currentAction === 'guard') {
                this.fighter.walk(-1);
            } else if (this.currentAction === 'crouch_guard') {
                this.fighter.crouch(true);
            }
        } else {
            this.fighter.standIdle();
        }
    }
}

window.FighterAI = FighterAI;
