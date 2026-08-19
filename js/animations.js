/**
 * TEKKEN 3 - Skeletal Keyframe Animation System & Pose Interpolator
 * Provides authentic martial arts combat animations for 3D articulated fighter rigs.
 */

class AnimationController {
    constructor() {
        // Base rest pose definitions
    }

    // Helper: Linear / Ease interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // S-curve smoothstep for organic martial arts snaps
    smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Compute skeletal joint rotations & offsets for a given state and progress (0.0 to 1.0)
     * @param {string} state - Current animation state name
     * @param {number} progress - Animation progress (0.0 to 1.0 or elapsed time for loops)
     * @param {string} characterId - Fighter archetype ('jin', 'paul', 'eddy', 'king', 'yoshimitsu', 'heihachi')
     * @param {boolean} isRightFighter - Whether fighter is on P2 side (mirrors stance)
     */
    evaluatePose(state, progress, characterId = 'jin', isRightFighter = false) {
        const pose = {
            rootPos: { x: 0, y: 0, z: 0 },
            rootRot: { x: 0, y: isRightFighter ? -Math.PI / 2 : Math.PI / 2, z: 0 },
            spine: { x: 0, y: 0, z: 0 },
            head: { x: 0, y: 0, z: 0 },
            leftShoulder: { x: 0, y: 0, z: 0 },
            leftArm: { x: 0, y: 0, z: 0 },
            leftForearm: { x: 0, y: 0, z: 0 },
            rightShoulder: { x: 0, y: 0, z: 0 },
            rightArm: { x: 0, y: 0, z: 0 },
            rightForearm: { x: 0, y: 0, z: 0 },
            leftThigh: { x: 0, y: 0, z: 0 },
            leftShin: { x: 0, y: 0, z: 0 },
            leftFoot: { x: 0, y: 0, z: 0 },
            rightThigh: { x: 0, y: 0, z: 0 },
            rightShin: { x: 0, y: 0, z: 0 },
            rightFoot: { x: 0, y: 0, z: 0 }
        };

        const sign = isRightFighter ? -1 : 1;

        switch (state) {
            case 'idle':
                this.applyIdlePose(pose, progress, characterId, sign);
                break;
            case 'walk_forward':
                this.applyWalkPose(pose, progress, 1, sign);
                break;
            case 'walk_back':
                this.applyWalkPose(pose, progress, -1, sign);
                break;
            case 'crouch':
                this.applyCrouchPose(pose, progress, sign);
                break;
            case 'crouch_guard':
                this.applyCrouchGuardPose(pose, progress, sign);
                break;
            case 'guard':
                this.applyGuardPose(pose, progress, sign);
                break;
            case 'jump':
                this.applyJumpPose(pose, progress, sign);
                break;
            case 'sidestep_left':
                this.applySidestepPose(pose, progress, -1, sign);
                break;
            case 'sidestep_right':
                this.applySidestepPose(pose, progress, 1, sign);
                break;

            // --- STANDARD ATTACKS ---
            case 'left_punch': // LP (1) - Flash Jab
                this.applyLeftPunchPose(pose, progress, sign);
                break;
            case 'right_punch': // RP (2) - Straight Cross
                this.applyRightPunchPose(pose, progress, sign);
                break;
            case 'left_kick': // LK (3) - Mid Side Kick
                this.applyLeftKickPose(pose, progress, sign);
                break;
            case 'right_kick': // RK (4) - High Roundhouse
                this.applyRightKickPose(pose, progress, sign);
                break;
            case 'launcher': // DF+2 - Uppercut Launcher
                this.applyLauncherPose(pose, progress, sign);
                break;
            case 'crouch_sweep': // D+LK / D+RK - Low Leg Sweep
                this.applySweepPose(pose, progress, sign);
                break;
            case 'throw': // LP+LK / RP+RK - Grab & Body Throw
                this.applyThrowPose(pose, progress, sign);
                break;

            // --- SIGNATURE SPECIALS ---
            case 'ewgf': // Jin / Heihachi - Electric Wind God Fist
                this.applyEWGFPose(pose, progress, sign);
                break;
            case 'deathfist': // Paul - Phoenix Smasher
                this.applyDeathfistPose(pose, progress, sign);
                break;
            case 'capoeira_spin': // Eddy - Handstand Wheel Kick
                this.applyCapoeiraSpinPose(pose, progress, sign);
                break;
            case 'dropkick': // King - Flying Pro Wrestling Dropkick
                this.applyDropkickPose(pose, progress, sign);
                break;
            case 'sword_spin': // Yoshimitsu - Blade Whirlwind
                this.applySwordSpinPose(pose, progress, sign);
                break;
            case 'rage_art': // Super Cinematic Move
                this.applyRageArtPose(pose, progress, sign);
                break;

            // --- HIT REACTIONS & JUGGLES ---
            case 'hit_high':
                this.applyHitHighPose(pose, progress, sign);
                break;
            case 'hit_mid':
                this.applyHitMidPose(pose, progress, sign);
                break;
            case 'hit_low':
                this.applyHitLowPose(pose, progress, sign);
                break;
            case 'juggle': // Airborne juggle state
                this.applyJugglePose(pose, progress, sign);
                break;
            case 'knockdown': // Flattened on back
                this.applyKnockdownPose(pose, progress, sign);
                break;
            case 'getup': // Tech roll / Rising
                this.applyGetupPose(pose, progress, sign);
                break;
            case 'block_stagger':
                this.applyBlockStaggerPose(pose, progress, sign);
                break;
            case 'victory':
                this.applyVictoryPose(pose, progress, characterId, sign);
                break;

            default:
                this.applyIdlePose(pose, progress, characterId, sign);
                break;
        }

        return pose;
    }

    // --- POSE IMPLEMENTATIONS ---

    applyIdlePose(pose, t, characterId, sign) {
        const bounce = Math.sin(t * 7) * 0.04;
        const breath = Math.sin(t * 3.5) * 0.03;

        pose.rootPos.y = bounce;

        if (characterId === 'eddy') {
            // Eddy's iconic Capoeira Ginga rhythm
            const ginga = Math.sin(t * 4);
            const gingaCos = Math.cos(t * 4);
            pose.rootPos.x = ginga * 0.15 * sign;
            pose.spine.z = ginga * 0.12;
            pose.spine.y = gingaCos * 0.18;
            pose.leftArm.x = 0.8 + ginga * 0.3;
            pose.rightArm.x = 0.8 - ginga * 0.3;
            pose.leftForearm.x = 1.1;
            pose.rightForearm.x = 1.1;
            pose.leftThigh.x = -0.3 + ginga * 0.2;
            pose.rightThigh.x = -0.3 - ginga * 0.2;
            return;
        }

        // Standard Tekken martial arts fighting stance
        pose.spine.x = 0.08 + breath;
        pose.spine.y = -0.22 * sign;

        // Guarded hands
        pose.leftShoulder.z = 0.2;
        pose.leftArm.x = 0.65 + breath;
        pose.leftArm.z = 0.35;
        pose.leftForearm.x = 1.45 + bounce * 0.5;

        pose.rightShoulder.z = -0.15;
        pose.rightArm.x = 0.75 + breath;
        pose.rightArm.z = -0.2;
        pose.rightForearm.x = 1.6;

        // Balanced stance legs
        pose.leftThigh.x = -0.32;
        pose.leftThigh.z = 0.15;
        pose.leftShin.x = 0.52 + bounce * 0.8;
        pose.leftFoot.x = -0.2;

        pose.rightThigh.x = 0.28;
        pose.rightThigh.z = -0.15;
        pose.rightShin.x = 0.4 + bounce * 0.8;
        pose.rightFoot.x = -0.2;
    }

    applyWalkPose(pose, t, dir, sign) {
        const cycle = t * 10 * dir;
        const sin = Math.sin(cycle);
        const cos = Math.cos(cycle);

        pose.rootPos.y = Math.abs(sin) * 0.05;
        pose.spine.x = 0.12 * dir;
        pose.spine.y = -0.25 * sign;

        pose.leftArm.x = 0.7 + sin * 0.35;
        pose.leftForearm.x = 1.3;
        pose.rightArm.x = 0.7 - sin * 0.35;
        pose.rightForearm.x = 1.4;

        pose.leftThigh.x = -sin * 0.65;
        pose.leftShin.x = Math.max(0, cos * 0.75);

        pose.rightThigh.x = sin * 0.65;
        pose.rightShin.x = Math.max(0, -cos * 0.75);
    }

    applySidestepPose(pose, progress, stepDir, sign) {
        const t = Math.min(1, Math.max(0, progress));
        const arc = Math.sin(t * Math.PI);

        pose.rootPos.z = stepDir * arc * 0.5;
        pose.rootPos.y = arc * 0.08;
        pose.spine.z = -stepDir * arc * 0.2;
        pose.spine.y = stepDir * arc * 0.3 * sign;

        pose.leftArm.x = 0.9;
        pose.leftForearm.x = 1.2;
        pose.rightArm.x = 0.9;
        pose.rightForearm.x = 1.2;

        pose.leftThigh.z = stepDir * arc * 0.4;
        pose.rightThigh.z = stepDir * arc * 0.4;
    }

    applyCrouchPose(pose, progress, sign) {
        const t = Math.min(1, progress * 4);
        pose.rootPos.y = -0.38 * t;
        pose.spine.x = 0.4 * t;
        pose.spine.y = -0.2 * sign;

        pose.leftArm.x = 0.5 * t;
        pose.leftForearm.x = 1.6 * t;
        pose.rightArm.x = 0.5 * t;
        pose.rightForearm.x = 1.6 * t;

        pose.leftThigh.x = -1.1 * t;
        pose.leftShin.x = 1.65 * t;
        pose.rightThigh.x = -1.0 * t;
        pose.rightShin.x = 1.55 * t;
    }

    applyGuardPose(pose, progress, sign) {
        pose.spine.x = -0.05;
        pose.leftArm.x = 1.2;
        pose.leftArm.z = 0.4;
        pose.leftForearm.x = 1.8;
        pose.rightArm.x = 1.3;
        pose.rightArm.z = -0.3;
        pose.rightForearm.x = 1.8;

        pose.leftThigh.x = -0.3;
        pose.leftShin.x = 0.45;
        pose.rightThigh.x = 0.2;
        pose.rightShin.x = 0.4;
    }

    applyCrouchGuardPose(pose, progress, sign) {
        this.applyCrouchPose(pose, 1.0, sign);
        pose.leftArm.x = 0.9;
        pose.leftForearm.x = 1.9;
        pose.rightArm.x = 0.9;
        pose.rightForearm.x = 1.9;
    }

    applyJumpPose(pose, progress, sign) {
        const t = Math.min(1, Math.max(0, progress));
        const jumpArc = Math.sin(t * Math.PI);
        pose.rootPos.y = jumpArc * 1.3;

        pose.spine.x = 0.2;
        pose.leftArm.x = 1.1;
        pose.rightArm.x = 1.1;
        pose.leftThigh.x = -0.9;
        pose.leftShin.x = 1.4;
        pose.rightThigh.x = -0.8;
        pose.rightShin.x = 1.3;
    }

    // --- 4 BUTTON ATTACKS ---

    applyLeftPunchPose(pose, t, sign) {
        // Startup (0..0.3), Active strike (0.3..0.6), Recovery (0.6..1.0)
        let strike = 0;
        if (t < 0.35) {
            strike = (t / 0.35); // Fast snap
        } else if (t < 0.65) {
            strike = 1.0 - (t - 0.35) / 0.3 * 0.4; // Hold peak
        } else {
            strike = (1.0 - t) / 0.35 * 0.6; // Retract
        }

        pose.rootPos.x = strike * 0.18 * sign;
        pose.spine.y = (strike * 0.4 - 0.2) * sign;
        pose.spine.x = 0.1 * strike;

        // Left punch straight thrust
        pose.leftShoulder.x = strike * 0.2;
        pose.leftArm.x = 1.55 * strike + (1 - strike) * 0.6;
        pose.leftArm.z = (1 - strike) * 0.3;
        pose.leftForearm.x = 0.08 * strike + (1 - strike) * 1.4;

        // Guard with right hand
        pose.rightArm.x = 0.8;
        pose.rightForearm.x = 1.6;

        pose.leftThigh.x = -0.4;
        pose.leftShin.x = 0.55;
        pose.rightThigh.x = 0.3;
        pose.rightShin.x = 0.4;
    }

    applyRightPunchPose(pose, t, sign) {
        let strike = 0;
        if (t < 0.38) {
            strike = Math.pow(t / 0.38, 2);
        } else if (t < 0.65) {
            strike = 1.0;
        } else {
            strike = (1.0 - t) / 0.35;
        }

        pose.rootPos.x = strike * 0.25 * sign;
        pose.spine.y = (-strike * 0.6 - 0.1) * sign; // Deep torso twist
        pose.spine.x = 0.15 * strike;

        // Guard left
        pose.leftArm.x = 0.8;
        pose.leftForearm.x = 1.5;

        // Heavy Right Cross
        pose.rightShoulder.x = strike * 0.3;
        pose.rightArm.x = 1.58 * strike + (1 - strike) * 0.7;
        pose.rightArm.z = -0.1 * strike;
        pose.rightForearm.x = 0.05 * strike + (1 - strike) * 1.6;

        pose.leftThigh.x = -0.45;
        pose.leftShin.x = 0.6;
        pose.rightThigh.x = 0.4;
        pose.rightShin.x = 0.2;
    }

    applyLeftKickPose(pose, t, sign) {
        let kick = 0;
        if (t < 0.35) {
            kick = Math.sin((t / 0.35) * Math.PI * 0.5);
        } else if (t < 0.65) {
            kick = 1.0;
        } else {
            kick = (1.0 - t) / 0.35;
        }

        pose.rootPos.y = kick * 0.08;
        pose.spine.z = -kick * 0.3 * sign;
        pose.spine.y = kick * 0.3 * sign;

        // Arms for balance
        pose.leftArm.x = 0.4;
        pose.leftArm.z = 0.6;
        pose.rightArm.x = 0.7;

        // Left Mid Side Kick
        pose.leftThigh.x = -1.45 * kick + (1 - kick) * -0.3;
        pose.leftThigh.z = 0.3 * kick;
        pose.leftShin.x = 0.05 * kick + (1 - kick) * 0.5;

        // Support leg
        pose.rightThigh.x = 0.1;
        pose.rightShin.x = 0.25;
    }

    applyRightKickPose(pose, t, sign) {
        let kick = 0;
        if (t < 0.4) {
            kick = Math.pow(t / 0.4, 2);
        } else if (t < 0.65) {
            kick = 1.0;
        } else {
            kick = (1.0 - t) / 0.35;
        }

        pose.rootPos.y = kick * 0.12;
        pose.spine.x = -kick * 0.15;
        pose.spine.y = -kick * 0.8 * sign; // Full hip rotation

        pose.leftArm.x = 0.8;
        pose.rightArm.x = 0.4;
        pose.rightArm.z = -0.7;

        // Right High Roundhouse
        pose.rightThigh.x = -1.65 * kick + (1 - kick) * 0.2;
        pose.rightThigh.z = -0.35 * kick;
        pose.rightShin.x = 0.05 * kick + (1 - kick) * 0.4;
        pose.rightFoot.x = 0.4 * kick;

        pose.leftThigh.x = -0.2;
        pose.leftShin.x = 0.3;
    }

    applyLauncherPose(pose, t, sign) {
        // Uppercut launcher (DF+2)
        let strike = 0;
        if (t < 0.38) {
            strike = Math.pow(t / 0.38, 3);
        } else if (t < 0.6) {
            strike = 1.0;
        } else {
            strike = (1.0 - t) / 0.4;
        }

        pose.rootPos.y = strike * 0.18;
        pose.rootPos.x = strike * 0.25 * sign;
        pose.spine.x = -strike * 0.35; // Arched back
        pose.spine.y = -strike * 0.4 * sign;

        // Right Rising Uppercut
        pose.rightArm.x = 2.4 * strike + (1 - strike) * 0.7;
        pose.rightForearm.x = 1.4 * strike + (1 - strike) * 1.5;

        pose.leftArm.x = 0.5;
        pose.leftForearm.x = 1.2;

        pose.leftThigh.x = -0.5;
        pose.leftShin.x = 0.7;
        pose.rightThigh.x = 0.2;
        pose.rightShin.x = 0.3;
    }

    applySweepPose(pose, t, sign) {
        const sweep = Math.sin(t * Math.PI);
        pose.rootPos.y = -0.42;
        pose.spine.x = 0.5;
        pose.spine.y = (t * Math.PI * 1.5) * sign;

        pose.leftArm.x = 0.6;
        pose.leftForearm.x = 1.6;
        pose.rightArm.x = 0.6;

        // Sweeping leg extension
        pose.rightThigh.x = -1.45 * sweep;
        pose.rightShin.x = 0.1;
        pose.leftThigh.x = -1.1;
        pose.leftShin.x = 1.7;
    }

    applyThrowPose(pose, t, sign) {
        let f = Math.sin(t * Math.PI);
        pose.rootPos.x = f * 0.4 * sign;
        pose.spine.x = 0.2 * f;

        // Double grab arms
        pose.leftArm.x = 1.4 * f;
        pose.leftForearm.x = 0.5 * f;
        pose.rightArm.x = 1.4 * f;
        pose.rightForearm.x = 0.5 * f;

        pose.leftThigh.x = -0.4;
        pose.rightThigh.x = 0.3;
    }

    // --- SIGNATURE SPECIAL MOVES ---

    applyEWGFPose(pose, t, sign) {
        // Electric Wind God Fist: Crouch dash surge into electric thunder uppercut
        if (t < 0.28) {
            // Crouch dash forward
            const dash = t / 0.28;
            pose.rootPos.y = -0.25 * dash;
            pose.rootPos.x = dash * 0.45 * sign;
            pose.spine.x = 0.4 * dash;
            pose.rightArm.x = 0.3;
            pose.rightForearm.x = 1.8;
            pose.leftThigh.x = -0.8;
            pose.rightThigh.x = 0.5;
        } else {
            // Explosive skyward electric uppercut
            const up = (t - 0.28) / 0.72;
            const snap = up < 0.3 ? Math.pow(up / 0.3, 3) : 1.0 - (up - 0.3) / 0.7;
            pose.rootPos.y = snap * 0.32;
            pose.rootPos.x = (0.45 + snap * 0.2) * sign;
            pose.spine.x = -snap * 0.4;
            pose.spine.y = -snap * 0.5 * sign;

            pose.rightArm.x = 2.7 * snap + 0.3;
            pose.rightForearm.x = 1.1 * snap;
            pose.leftArm.x = 0.4;
            pose.leftForearm.x = 1.2;

            pose.leftThigh.x = -0.4;
            pose.leftShin.x = 0.6;
            pose.rightThigh.x = 0.3;
        }
    }

    applyDeathfistPose(pose, t, sign) {
        // Paul's Phoenix Smasher: Deep stance step + bone-shattering straight thrust
        let thrust = 0;
        if (t < 0.35) {
            thrust = Math.pow(t / 0.35, 3);
        } else if (t < 0.65) {
            thrust = 1.0;
        } else {
            thrust = (1.0 - t) / 0.35;
        }

        pose.rootPos.y = -thrust * 0.15;
        pose.rootPos.x = thrust * 0.65 * sign; // Massive forward lunge
        pose.spine.x = thrust * 0.25;
        pose.spine.y = -thrust * 0.75 * sign;

        // Deathfist right arm
        pose.rightShoulder.x = thrust * 0.4;
        pose.rightArm.x = 1.65 * thrust;
        pose.rightArm.z = -0.05;
        pose.rightForearm.x = 0.0; // Straight locked fist

        pose.leftArm.x = 0.5;
        pose.leftForearm.x = 1.7;

        pose.leftThigh.x = -0.8 * thrust - 0.2;
        pose.leftShin.x = 0.9 * thrust + 0.4;
        pose.rightThigh.x = 0.7 * thrust;
        pose.rightShin.x = 0.1;
    }

    applyCapoeiraSpinPose(pose, t, sign) {
        // Eddy's Meia Lua de Compasso: Handstand wheel kick
        const spinAngle = t * Math.PI * 2;
        const handstand = Math.sin(t * Math.PI);

        pose.rootPos.y = -handstand * 0.28;
        pose.rootPos.x = Math.sin(spinAngle) * 0.25 * sign;
        pose.spine.x = 0.8 * handstand;
        pose.spine.y = spinAngle * sign;

        // Ground touching hands
        pose.leftArm.x = 1.4 * handstand;
        pose.rightArm.x = 1.4 * handstand;

        // Spinning whip legs
        pose.rightThigh.x = -1.6 * handstand;
        pose.rightShin.x = 0.1;
        pose.leftThigh.x = 0.4;
        pose.leftShin.x = 0.8;
    }

    applyDropkickPose(pose, t, sign) {
        // King's Flying Dropkick
        const arc = Math.sin(t * Math.PI);
        pose.rootPos.y = arc * 0.9;
        pose.rootPos.x = t * 0.9 * sign;

        pose.spine.x = -1.2 * arc; // Body horizontal in midair
        pose.leftArm.x = -0.5 * arc;
        pose.rightArm.x = -0.5 * arc;

        // Both legs thrust straight out
        pose.leftThigh.x = -1.65 * arc;
        pose.leftShin.x = 0.05;
        pose.rightThigh.x = -1.65 * arc;
        pose.rightShin.x = 0.05;
    }

    applySwordSpinPose(pose, t, sign) {
        // Yoshimitsu Cyclone Blade Whirlwind
        const spins = t * Math.PI * 4; // Double 360 spin
        pose.rootRot.y += spins * sign;
        pose.rootPos.y = Math.sin(t * Math.PI) * 0.2;

        pose.rightArm.x = 1.5;
        pose.rightArm.z = -0.8;
        pose.rightForearm.x = 0.1;

        pose.leftArm.x = 1.5;
        pose.leftArm.z = 0.8;
        pose.leftForearm.x = 0.1;

        pose.leftThigh.x = -0.3;
        pose.rightThigh.x = 0.3;
    }

    applyRageArtPose(pose, t, sign) {
        // Cinematic multi-strike super sequence
        const cycle = (t * 4) % 1;
        const phase = Math.floor(t * 4);

        if (phase === 0) {
            this.applyEWGFPose(pose, cycle, sign);
        } else if (phase === 1) {
            this.applyRightKickPose(pose, cycle, sign);
        } else if (phase === 2) {
            this.applyDeathfistPose(pose, cycle, sign);
        } else {
            this.applyLauncherPose(pose, cycle, sign);
        }
    }

    // --- HIT REACTIONS & JUGGLES ---

    applyHitHighPose(pose, t, sign) {
        const recoil = Math.sin(t * Math.PI);
        pose.rootPos.x = -recoil * 0.22 * sign;
        pose.spine.x = -recoil * 0.35;
        pose.spine.y = recoil * 0.25 * sign;
        pose.head.x = -recoil * 0.45;

        pose.leftArm.x = recoil * 0.4;
        pose.rightArm.x = recoil * 0.4;
    }

    applyHitMidPose(pose, t, sign) {
        const gut = Math.sin(t * Math.PI);
        pose.rootPos.x = -gut * 0.25 * sign;
        pose.rootPos.y = -gut * 0.08;
        pose.spine.x = gut * 0.45; // Hunched over in pain
        pose.head.x = gut * 0.3;

        pose.leftArm.x = 0.3;
        pose.rightArm.x = 0.3;
    }

    applyHitLowPose(pose, t, sign) {
        const trip = Math.sin(t * Math.PI);
        pose.rootPos.x = -trip * 0.18 * sign;
        pose.rootPos.y = -trip * 0.15;
        pose.leftShin.x = trip * 0.8;
        pose.rightShin.x = trip * 0.8;
        pose.spine.x = trip * 0.3;
    }

    applyJugglePose(pose, t, sign) {
        // Airborne vulnerable tumble state for combo juggling
        const tumble = t * Math.PI * 2;
        pose.spine.x = -0.6;
        pose.spine.y = Math.sin(tumble) * 0.3 * sign;

        pose.leftArm.x = 1.1;
        pose.rightArm.x = 1.1;
        pose.leftThigh.x = -0.8;
        pose.rightThigh.x = -0.5;
        pose.leftShin.x = 1.1;
        pose.rightShin.x = 0.9;
    }

    applyKnockdownPose(pose, t, sign) {
        pose.rootPos.y = -0.75;
        pose.spine.x = -1.55; // Lying flat on ground
        pose.head.x = 0.2;

        pose.leftArm.x = 0.1;
        pose.leftArm.z = 0.8;
        pose.rightArm.x = 0.1;
        pose.rightArm.z = -0.8;

        pose.leftThigh.x = 0.1;
        pose.rightThigh.x = 0.1;
        pose.leftShin.x = 0.1;
        pose.rightShin.x = 0.1;
    }

    applyGetupPose(pose, t, sign) {
        // Tech roll getup
        const roll = (1 - t);
        pose.rootPos.y = -0.75 * roll;
        pose.spine.x = -1.55 * roll + (1 - roll) * 0.1;
        pose.leftThigh.x = -0.6 * (1 - roll);
        pose.rightThigh.x = 0.3 * (1 - roll);
    }

    applyBlockStaggerPose(pose, t, sign) {
        const f = Math.sin(t * Math.PI);
        pose.rootPos.x = -f * 0.12 * sign;
        this.applyGuardPose(pose, 1, sign);
    }

    applyVictoryPose(pose, t, characterId, sign) {
        const loop = Math.sin(t * 4) * 0.03;
        pose.rootPos.y = loop;

        if (characterId === 'jin' || characterId === 'heihachi') {
            // Crossed arms Mishima victory stance
            pose.spine.x = -0.05;
            pose.leftArm.x = 0.9;
            pose.leftArm.z = 0.55;
            pose.leftForearm.x = 1.7;
            pose.rightArm.x = 0.9;
            pose.rightArm.z = -0.55;
            pose.rightForearm.x = 1.7;
            pose.leftThigh.x = -0.2;
            pose.rightThigh.x = 0.2;
        } else if (characterId === 'paul') {
            // Fist pump "I'm the toughest guy in the universe!"
            pose.rightArm.x = 2.5;
            pose.rightForearm.x = 1.2;
            pose.leftArm.x = 0.3;
            pose.spine.x = -0.15;
        } else {
            // Classic martial arts salute / bow
            pose.leftArm.x = 1.1;
            pose.rightArm.x = 1.1;
            pose.leftForearm.x = 1.5;
            pose.rightForearm.x = 1.5;
            pose.spine.x = 0.15;
        }
    }
}

window.animationController = new AnimationController();
