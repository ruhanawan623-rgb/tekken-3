/**
 * TEKKEN 3 - Combat Arbiter & Hit Collision Engine
 * Governs 3D collision detection, High/Mid/Low guards, 3D sidestep evasion,
 * Counter Hits, Airborne juggle damage scaling, and K.O. slow-motion triggers.
 */

class CombatSystem {
    constructor() {
        this.timeDilation = 1.0;
        this.slowMoTimer = 0;
        this.matchTime = 60;
        this.isRoundOver = false;
        this.roundWinner = null;
    }

    resetMatch(timeLimit = 60) {
        this.matchTime = timeLimit;
        this.isRoundOver = false;
        this.roundWinner = null;
        this.timeDilation = 1.0;
        this.slowMoTimer = 0;
        window.graphicsEngine.stopCinematicKO();
    }

    update(p1, p2, dt) {
        // Slow motion update on K.O.
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            this.timeDilation = 0.2; // 20% speed for dramatic effect
            if (this.slowMoTimer <= 0) {
                this.timeDilation = 1.0;
            }
        }

        const effectiveDt = dt * this.timeDilation;

        // Check Hitbox Collisions
        if (p1.hitboxActive && !p1.hasHitOpponent) {
            this.checkAttackCollision(p1, p2);
        }
        if (p2.hitboxActive && !p2.hasHitOpponent) {
            this.checkAttackCollision(p2, p1);
        }

        // Pushbox collision (prevent fighters from walking straight through each other)
        this.resolveFighterPushbox(p1, p2);

        // Check Round End conditions
        if (!this.isRoundOver) {
            this.checkRoundEnd(p1, p2, dt);
        }

        return effectiveDt;
    }

    /**
     * Check if attacker's active move hits defender in 3D
     */
    checkAttackCollision(attacker, defender) {
        const move = attacker.currentMove;
        if (!move) return;

        // 1. Check 3D Z-axis clearance (3D sidestep evasion)
        const zDist = Math.abs(attacker.pos.z - defender.pos.z);
        if (zDist > 0.65) {
            // Dodged in 3D via sidestep! Whiff!
            return;
        }

        // 2. Calculate horizontal and vertical reach
        const xDist = (defender.pos.x - attacker.pos.x) * attacker.facing;
        const attackReach = move.knockback > 1.5 ? 1.65 : 1.35; // Special lunges have longer reach

        if (xDist < 0 || xDist > attackReach) {
            return; // Whiffed out of range
        }

        // Check if defender is invulnerable (e.g. grounded recovery)
        if (!defender.isVulnerable()) {
            return;
        }

        attacker.hasHitOpponent = true;

        // 3. Counter Hit (CH) Detection: opponent was in startup of an attack
        const isCounterHit = defender.isAttacking() && defender.animTime < (defender.currentMove.startup || 0.2);

        // 4. High / Mid / Low / Throw Guard Logic
        const hitResult = this.evaluateGuard(attacker, defender, move);

        if (hitResult === 'blocked') {
            defender.takeBlock(move.damage, move.knockback, move.type === 'low');
        } else if (hitResult === 'ducked') {
            // High attack completely whiffed over ducking opponent
            return;
        } else {
            // Successful Hit! Apply Juggle Damage Scaling
            let damage = move.damage;
            if (defender.isJuggleAirborne) {
                const hits = defender.comboHitsReceived;
                const scale = hits === 0 ? 1.0 : hits === 1 ? 0.8 : hits === 2 ? 0.65 : 0.5;
                damage = Math.round(damage * scale);
            }

            // Apply Hit to Defender
            defender.takeHit(
                damage,
                move.type,
                move.launch || 0,
                move.knockback,
                isCounterHit,
                move.isElectric
            );

            // Trigger K.O. Slow-Mo if lethal strike
            if (defender.health <= 0) {
                this.triggerKOSlowMo();
            }
        }
    }

    evaluateGuard(attacker, defender, move) {
        if (move.type === 'unblockable') {
            return 'hit';
        }

        if (move.type === 'throw') {
            // Throws connect if defender is standing close and not airborne
            if (defender.isGrounded && defender.state !== 'crouch' && defender.state !== 'crouch_guard') {
                return 'hit';
            }
            return 'ducked'; // Whiff
        }

        if (move.type === 'high') {
            // High attacks whiff over ducking opponents
            if (defender.state === 'crouch' || defender.state === 'crouch_guard' || defender.state === 'crouch_sweep') {
                return 'ducked';
            }
            // Blocked by standing high guard
            if (defender.isGuardingHigh) {
                return 'blocked';
            }
            return 'hit';
        }

        if (move.type === 'mid') {
            // Mid attacks hit ducking opponents (beats low guard!)
            if (defender.isGuardingHigh) {
                return 'blocked';
            }
            return 'hit';
        }

        if (move.type === 'low') {
            // Low attacks hit standing opponents (beats high guard!)
            if (defender.isGuardingLow) {
                return 'blocked';
            }
            return 'hit';
        }

        return 'hit';
    }

    resolveFighterPushbox(p1, p2) {
        const minDist = 0.65;
        const dx = p2.pos.x - p1.pos.x;
        const dz = p2.pos.z - p1.pos.z;
        const dist = Math.hypot(dx, dz);

        if (dist < minDist && dist > 0.001) {
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const nz = dz / dist;

            p1.pos.x -= nx * overlap;
            p1.pos.z -= nz * overlap;
            p2.pos.x += nx * overlap;
            p2.pos.z += nz * overlap;
        }
    }

    triggerKOSlowMo() {
        this.slowMoTimer = 1.4; // 1.4 seconds of cinematic slow motion
        window.graphicsEngine.startCinematicKO();
    }

    checkRoundEnd(p1, p2, dt) {
        // Countdown timer
        this.matchTime = Math.max(0, this.matchTime - dt);

        if (p1.health <= 0 && p2.health <= 0) {
            // Double K.O.!
            this.isRoundOver = true;
            this.roundWinner = 'draw';
            p1.roundsWon++;
            p2.roundsWon++;
            window.soundEngine.announceDoubleKO();
        } else if (p1.health <= 0) {
            // P2 Wins Round!
            this.isRoundOver = true;
            this.roundWinner = 'p2';
            p2.roundsWon++;
            p2.state = 'victory';
            p2.animTime = 0;
            window.soundEngine.announceKO();
            window.soundEngine.announceWinner(p2.config.name, p2.health === p2.maxHealth);
        } else if (p2.health <= 0) {
            // P1 Wins Round!
            this.isRoundOver = true;
            this.roundWinner = 'p1';
            p1.roundsWon++;
            p1.state = 'victory';
            p1.animTime = 0;
            window.soundEngine.announceKO();
            window.soundEngine.announceWinner(p1.config.name, p1.health === p1.maxHealth);
        } else if (this.matchTime <= 0) {
            // Time Over! Decision based on highest remaining HP
            this.isRoundOver = true;
            if (p1.health > p2.health) {
                this.roundWinner = 'p1';
                p1.roundsWon++;
                p1.state = 'victory';
                window.soundEngine.announceWinner(p1.config.name);
            } else if (p2.health > p1.health) {
                this.roundWinner = 'p2';
                p2.roundsWon++;
                p2.state = 'victory';
                window.soundEngine.announceWinner(p2.config.name);
            } else {
                this.roundWinner = 'draw';
                window.soundEngine.announceDraw();
            }
        }
    }
}

window.combatSystem = new CombatSystem();
