/**
 * TEKKEN 3 - Fighter Entity & Combat State Machine
 * Manages frame data, move lists, command input buffering, hitbox calculations,
 * juggle airborne physics, guard states, and health/rage systems.
 */

class Fighter {
    constructor(id, characterId, playerIndex, isAI = false) {
        this.id = id; // 'p1' or 'p2'
        this.characterId = characterId;
        this.playerIndex = playerIndex;
        this.isAI = isAI;

        // Visual Rig
        this.rig = null;
        this.config = window.fighterModelBuilder.getCharacterConfig(characterId, playerIndex);

        // Transform & Physics
        this.pos = { x: playerIndex === 1 ? -1.8 : 1.8, y: 0, z: 0 };
        this.vel = { x: 0, y: 0, z: 0 };
        this.facing = playerIndex === 1 ? 1 : -1; // 1 = facing right, -1 = facing left
        this.isGrounded = true;
        this.gravity = 24.0;
        this.arenaRadius = 6.8;

        // Health & Rounds
        this.maxHealth = 100;
        this.health = 100;
        this.redHealth = 100; // Red damage trail bar
        this.roundsWon = 0;
        this.isRageActive = false;

        // Combat & Animation States
        this.state = 'idle';
        this.animTime = 0;
        this.stateDuration = 0;
        this.currentMove = null;
        this.hitboxActive = false;
        this.hasHitOpponent = false;

        // Combo & Hit Reaction Tracking
        this.comboHitsReceived = 0;
        this.comboDamageReceived = 0;
        this.isJuggleAirborne = false;
        this.hitStunTimer = 0;
        this.blockStunTimer = 0;

        // Guard States
        this.isGuardingHigh = false;
        this.isGuardingLow = false;

        // Command Buffer for Special Input Execution
        this.inputBuffer = [];
        this.maxBufferSize = 20;

        // Define Move Set & Frame Data
        this.moveList = this.initializeMoveList();
    }

    initializeMoveList() {
        return {
            // --- 4-BUTTON BASICS ---
            left_punch: {
                name: 'Left Jab (1)',
                command: '1',
                type: 'high',
                startup: 0.14,
                active: 0.12,
                recovery: 0.18,
                damage: 8,
                knockback: 0.35,
                launch: 0,
                onBlock: -2,
                anim: 'left_punch',
                sound: 'light'
            },
            right_punch: {
                name: 'Straight Right (2)',
                command: '2',
                type: 'high',
                startup: 0.18,
                active: 0.14,
                recovery: 0.22,
                damage: 13,
                knockback: 0.6,
                launch: 0,
                onBlock: -4,
                anim: 'right_punch',
                sound: 'medium'
            },
            left_kick: {
                name: 'Mid Side Kick (3)',
                command: '3',
                type: 'mid',
                startup: 0.22,
                active: 0.16,
                recovery: 0.26,
                damage: 16,
                knockback: 0.8,
                launch: 0,
                onBlock: -6,
                anim: 'left_kick',
                sound: 'medium'
            },
            right_kick: {
                name: 'High Roundhouse (4)',
                command: '4',
                type: 'high',
                startup: 0.25,
                active: 0.16,
                recovery: 0.3,
                damage: 20,
                knockback: 1.1,
                launch: 0,
                onBlock: -8,
                anim: 'right_kick',
                sound: 'heavy'
            },

            // --- UNIVERSAL COMBAT MOVES ---
            launcher: {
                name: 'Rising Uppercut Launcher (d/f+2)',
                command: 'df+2',
                type: 'mid',
                startup: 0.24,
                active: 0.18,
                recovery: 0.35,
                damage: 18,
                knockback: 0.4,
                launch: 3.2, // Launches opponent high into air!
                onBlock: -12,
                anim: 'launcher',
                sound: 'heavy',
                isLauncher: true
            },
            crouch_sweep: {
                name: 'Low Dragon Sweep (d+4)',
                command: 'd+4',
                type: 'low',
                startup: 0.28,
                active: 0.18,
                recovery: 0.36,
                damage: 15,
                knockback: 1.0,
                launch: 0.4, // Knockdown sweep
                onBlock: -14,
                anim: 'crouch_sweep',
                sound: 'medium',
                isKnockdown: true
            },
            throw: {
                name: 'Body Slam Throw (1+3)',
                command: '1+3',
                type: 'throw',
                startup: 0.2,
                active: 0.15,
                recovery: 0.4,
                damage: 28,
                knockback: 1.6,
                launch: 0.8,
                onBlock: 0,
                anim: 'throw',
                sound: 'heavy',
                isKnockdown: true
            },

            // --- SIGNATURE SPECIALS ---
            ewgf: {
                name: 'Electric Wind God Fist (f,n,d,d/f+2)',
                command: 'ewgf',
                type: 'high',
                startup: 0.22,
                active: 0.16,
                recovery: 0.24,
                damage: 25,
                knockback: 1.3,
                launch: 3.8, // Massive electric juggle launch
                onBlock: +3, // Plus on block!
                anim: 'ewgf',
                sound: 'heavy',
                isElectric: true,
                isLauncher: true
            },
            deathfist: {
                name: 'Phoenix Smasher / Deathfist (qcf+2)',
                command: 'qcf+2',
                type: 'mid',
                startup: 0.26,
                active: 0.18,
                recovery: 0.42,
                damage: 36, // Huge chunk of life!
                knockback: 2.4,
                launch: 0.6,
                onBlock: -16,
                anim: 'deathfist',
                sound: 'heavy',
                isKnockdown: true
            },
            capoeira_spin: {
                name: 'Meia Lua de Compasso (b+3+4)',
                command: 'capoeira',
                type: 'mid',
                startup: 0.24,
                active: 0.22,
                recovery: 0.3,
                damage: 24,
                knockback: 1.2,
                launch: 2.8,
                onBlock: -5,
                anim: 'capoeira_spin',
                sound: 'heavy',
                isLauncher: true
            },
            dropkick: {
                name: 'Flying Dropkick (f,f+3+4)',
                command: 'dropkick',
                type: 'mid',
                startup: 0.28,
                active: 0.2,
                recovery: 0.45,
                damage: 30,
                knockback: 2.2,
                launch: 1.0,
                onBlock: -10,
                anim: 'dropkick',
                sound: 'heavy',
                isKnockdown: true
            },
            sword_spin: {
                name: 'Manji Cyclone Blade (b+1,1,1)',
                command: 'sword_spin',
                type: 'unblockable',
                startup: 0.3,
                active: 0.35,
                recovery: 0.35,
                damage: 28,
                knockback: 1.4,
                launch: 1.2,
                onBlock: 0,
                anim: 'sword_spin',
                sound: 'heavy',
                isKnockdown: true
            },
            rage_art: {
                name: 'RAGE ART: Iron Fist Annihilation',
                command: 'rage_art',
                type: 'mid',
                startup: 0.35,
                active: 0.4,
                recovery: 0.5,
                damage: 48, // Devastating finisher!
                knockback: 3.0,
                launch: 2.5,
                onBlock: -20,
                anim: 'rage_art',
                sound: 'heavy',
                isCinematic: true,
                isKnockdown: true
            }
        };
    }

    /**
     * Attach 3D Rig instance
     */
    setRig(rig) {
        this.rig = rig;
    }

    /**
     * Main update loop for physics, states, and animation
     */
    update(dt, opponent) {
        // Face opponent in 3D arena
        if (this.canTurn()) {
            this.facing = opponent.pos.x >= this.pos.x ? 1 : -1;
        }

        // Rage check (< 25% HP)
        this.isRageActive = (this.health <= 25);

        // Update active action state timer
        this.animTime += dt;

        // Handle State-specific Logic
        if (this.isAttacking()) {
            this.updateAttack(dt);
        } else if (this.isHitStunned()) {
            this.updateHitStun(dt);
        } else if (this.isBlockStunned()) {
            this.updateBlockStun(dt);
        }

        // Integrate Physics & Juggle Gravity
        this.updatePhysics(dt);

        // Boundary Clamping inside circular fighting arena
        const distFromCenter = Math.hypot(this.pos.x, this.pos.z);
        if (distFromCenter > this.arenaRadius) {
            const angle = Math.atan2(this.pos.z, this.pos.x);
            this.pos.x = Math.cos(angle) * this.arenaRadius;
            this.pos.z = Math.sin(angle) * this.arenaRadius;
        }

        // Red Health Bar Catch-up Decay
        if (this.redHealth > this.health) {
            this.redHealth = Math.max(this.health, this.redHealth - dt * 25);
        }

        // Apply visual pose to 3D skeleton
        this.updateVisualPose();
    }

    canTurn() {
        return !['left_punch', 'right_punch', 'left_kick', 'right_kick', 'launcher', 'crouch_sweep', 'throw', 'ewgf', 'deathfist', 'capoeira_spin', 'dropkick', 'sword_spin', 'rage_art', 'hit_high', 'hit_mid', 'hit_low', 'juggle', 'knockdown'].includes(this.state);
    }

    isAttacking() {
        return Boolean(this.currentMove);
    }

    isHitStunned() {
        return ['hit_high', 'hit_mid', 'hit_low', 'juggle', 'knockdown', 'getup'].includes(this.state);
    }

    isBlockStunned() {
        return this.state === 'block_stagger';
    }

    isVulnerable() {
        return !['knockdown', 'getup'].includes(this.state);
    }

    canAct() {
        return ['idle', 'walk_forward', 'walk_back', 'crouch', 'crouch_guard', 'guard'].includes(this.state) && this.isGrounded;
    }

    // --- MOVE EXECUTION & BUFFERING ---

    executeMove(moveKey) {
        if (!this.canAct()) return false;

        const move = this.moveList[moveKey];
        if (!move) return false;

        // Rage art requires low health
        if (moveKey === 'rage_art' && !this.isRageActive) return false;

        this.currentMove = move;
        this.state = move.anim;
        this.animTime = 0;
        this.stateDuration = move.startup + move.active + move.recovery;
        this.hitboxActive = false;
        this.hasHitOpponent = false;

        // Play SFX & Voice Grunt
        window.soundEngine.playWhoosh(move.sound || 'medium');
        if (move.isElectric) {
            window.soundEngine.playElectricSparks();
            window.soundEngine.playVoiceGrunt(this.config.id, 'electric');
        } else if (moveKey === 'special' || moveKey === 'rage_art' || moveKey === 'launcher') {
            window.soundEngine.playVoiceGrunt(this.config.id, 'special');
        } else if (Math.random() < 0.25) {
            window.soundEngine.playVoiceGrunt(this.config.id, 'attack');
        }

        return true;
    }

    updateAttack(dt) {
        if (!this.currentMove) return;

        const totalTime = this.currentMove.startup + this.currentMove.active + this.currentMove.recovery;
        const progress = this.animTime / totalTime;

        // Hitbox active window
        if (this.animTime >= this.currentMove.startup && this.animTime <= this.currentMove.startup + this.currentMove.active) {
            this.hitboxActive = !this.hasHitOpponent;
        } else {
            this.hitboxActive = false;
        }

        // Finished move recovery
        if (this.animTime >= totalTime) {
            this.currentMove = null;
            this.hitboxActive = false;
            this.state = 'idle';
            this.animTime = 0;
        }
    }

    // --- PHYSICS & JUGGLES ---

    updatePhysics(dt) {
        // Horizontal Friction
        if (this.isGrounded) {
            this.vel.x *= Math.pow(0.005, dt);
            this.vel.z *= Math.pow(0.005, dt);
        }

        // Apply Velocity
        this.pos.x += this.vel.x * dt;
        this.pos.z += this.vel.z * dt;

        // Gravity & Airborne States
        if (!this.isGrounded || this.pos.y > 0) {
            this.vel.y -= this.gravity * dt;
            this.pos.y += this.vel.y * dt;

            if (this.pos.y <= 0) {
                // Landed on floor
                this.pos.y = 0;
                this.vel.y = 0;
                this.isGrounded = true;

                if (this.isJuggleAirborne || this.state === 'juggle') {
                    // Smashed onto ground after juggle
                    this.isJuggleAirborne = false;
                    this.state = 'knockdown';
                    this.animTime = 0;
                    this.stateDuration = 0.65; // Grounded stun before tech roll
                    window.soundEngine.playGroundSlam();
                    window.graphicsEngine.spawnDust(this.pos);
                } else if (this.state === 'jump') {
                    this.state = 'idle';
                    this.animTime = 0;
                    window.graphicsEngine.spawnDust(this.pos);
                }
            }
        }
    }

    updateHitStun(dt) {
        this.hitStunTimer -= dt;

        if (this.state === 'knockdown' && this.animTime >= this.stateDuration) {
            // Auto Tech Roll Getup
            this.state = 'getup';
            this.animTime = 0;
            this.stateDuration = 0.35;
        } else if (this.state === 'getup' && this.animTime >= this.stateDuration) {
            this.state = 'idle';
            this.animTime = 0;
            this.comboHitsReceived = 0;
            this.comboDamageReceived = 0;
        } else if (this.hitStunTimer <= 0 && !this.isJuggleAirborne && !['knockdown', 'getup'].includes(this.state)) {
            this.state = 'idle';
            this.animTime = 0;
            this.comboHitsReceived = 0;
            this.comboDamageReceived = 0;
        }
    }

    updateBlockStun(dt) {
        this.blockStunTimer -= dt;
        if (this.blockStunTimer <= 0) {
            this.state = 'idle';
            this.animTime = 0;
        }
    }

    // --- COMBAT REACTIONS ---

    takeHit(damage, hitLevel, launchHeight, knockback, isCounter = false, isElectric = false) {
        // Apply Rage Boost if attacker had rage
        const finalDamage = Math.round(damage * (isCounter ? 1.25 : 1.0));
        this.health = Math.max(0, this.health - finalDamage);

        // Cancel attacker's move on hit
        this.currentMove = null;
        this.hitboxActive = false;

        // Combo Tracking
        this.comboHitsReceived++;
        this.comboDamageReceived += finalDamage;

        // Knockback velocity
        this.vel.x = -this.facing * knockback * (this.isJuggleAirborne ? 1.3 : 1.0);

        if (launchHeight > 0 || this.isJuggleAirborne) {
            // Juggle Launch Physics
            this.isJuggleAirborne = true;
            this.isGrounded = false;
            this.vel.y = this.isJuggleAirborne ? Math.max(launchHeight * 1.5, 4.5) : launchHeight * 3.2;
            this.state = 'juggle';
            this.animTime = 0;
            this.hitStunTimer = 1.0;
        } else {
            // Ground Hit Stun
            this.hitStunTimer = 0.38 + (finalDamage > 18 ? 0.15 : 0);
            if (hitLevel === 'low') {
                this.state = 'hit_low';
            } else if (hitLevel === 'mid') {
                this.state = 'hit_mid';
            } else {
                this.state = 'hit_high';
            }
            this.animTime = 0;
        }

        // Visual & Sound Feedback
        const hitOrigin = {
            x: this.pos.x,
            y: this.pos.y + (hitLevel === 'low' ? 0.3 : hitLevel === 'mid' ? 1.0 : 1.45),
            z: this.pos.z
        };

        window.soundEngine.playHit(finalDamage >= 24 ? 'heavy' : finalDamage <= 10 ? 'light' : 'medium', isCounter);
        if (isElectric) {
            window.soundEngine.playElectricSparks();
        }

        if (finalDamage >= 18 || isKnockdown || isLaunch) {
            window.soundEngine.playVoiceGrunt(this.config.id, this.health <= 0 ? 'ko' : 'hit');
        }

        window.graphicsEngine.spawnHitSparks(
            hitOrigin,
            finalDamage >= 24 ? 'heavy' : 'medium',
            isCounter,
            isElectric
        );
    }

    takeBlock(damage, knockback, isLow = false) {
        const chipDamage = 0; // Tekken 3 standard: no chip damage on regular blocks
        this.health = Math.max(0, this.health - chipDamage);

        this.vel.x = -this.facing * knockback * 0.4;
        this.blockStunTimer = 0.22;
        this.state = 'block_stagger';
        this.animTime = 0;

        const blockOrigin = {
            x: this.pos.x,
            y: this.pos.y + (isLow ? 0.5 : 1.25),
            z: this.pos.z
        };

        window.soundEngine.playBlock();
        window.graphicsEngine.spawnBlockSparks(blockOrigin);
    }

    // --- 3D MOVEMENT ACTIONS ---

    walk(direction) { // 1 = forward, -1 = backward
        if (!this.canAct()) return;
        const walkSpeed = 2.4;
        this.pos.x += direction * this.facing * walkSpeed * 0.016;
        this.state = direction === 1 ? 'walk_forward' : 'walk_back';
        this.isGuardingHigh = (direction === -1); // Auto high guard while backing up
    }

    crouch(isGuarding = false) {
        if (!this.canAct()) return;
        this.state = isGuarding ? 'crouch_guard' : 'crouch';
        this.isGuardingLow = isGuarding;
    }

    sidestep(direction) { // -1 = Left / into background, 1 = Right / foreground
        if (!this.canAct()) return;
        this.state = direction === -1 ? 'sidestep_left' : 'sidestep_right';
        this.animTime = 0;
        this.stateDuration = 0.32;

        const stepSpeed = 4.2;
        this.vel.z = direction * stepSpeed;
        window.soundEngine.playWhoosh('fast');
    }

    jump() {
        if (!this.canAct()) return;
        this.isGrounded = false;
        this.vel.y = 8.2;
        this.state = 'jump';
        this.animTime = 0;
        window.soundEngine.playWhoosh('medium');
    }

    standIdle() {
        if (['walk_forward', 'walk_back', 'crouch', 'crouch_guard', 'guard'].includes(this.state)) {
            this.state = 'idle';
            this.animTime = 0;
            this.isGuardingHigh = false;
            this.isGuardingLow = false;
        }
    }

    // --- 3D SKELETAL RIG SYNC ---

    updateVisualPose() {
        if (!this.rig) return;

        // Evaluate joint transforms from AnimationController
        const pose = window.animationController.evaluatePose(
            this.state,
            this.animTime,
            this.characterId,
            this.facing === -1
        );

        // Apply root world transform + 3D position
        pose.rootPos.x += this.pos.x;
        pose.rootPos.y += this.pos.y;
        pose.rootPos.z += this.pos.z;

        window.fighterModelBuilder.applyPoseToRig(this.rig, pose);
    }

    resetForRound(startPosX) {
        this.pos = { x: startPosX, y: 0, z: 0 };
        this.vel = { x: 0, y: 0, z: 0 };
        this.health = this.maxHealth;
        this.redHealth = this.maxHealth;
        this.state = 'idle';
        this.animTime = 0;
        this.currentMove = null;
        this.hitboxActive = false;
        this.hasHitOpponent = false;
        this.isJuggleAirborne = false;
        this.isGrounded = true;
        this.comboHitsReceived = 0;
        this.comboDamageReceived = 0;
        this.facing = startPosX < 0 ? 1 : -1;
    }
}

window.Fighter = Fighter;
