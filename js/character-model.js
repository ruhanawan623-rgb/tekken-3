/**
 * TEKKEN 3 - 3D Character Rig Builder & Fighter Visuals
 * Constructs articulated 3D humanoid skeletal meshes with character-specific
 * costumes, hairstyles, accessories, and glowing aura trails.
 */

class FighterModelBuilder {
    constructor() {
        this.materialsCache = {};
    }

    /**
     * Build 3D Fighter hierarchy for a given character
     * @param {THREE} THREE - Three.js namespace
     * @param {string} characterId - 'jin', 'paul', 'eddy', 'king', 'yoshimitsu', 'heihachi'
     * @param {number} playerIndex - 1 (P1) or 2 (P2)
     */
    buildModel(THREE, characterId = 'jin', playerIndex = 1) {
        const root = new THREE.Group();
        root.name = `fighter_root_${playerIndex}`;

        const config = this.getCharacterConfig(characterId, playerIndex);
        const mats = this.createMaterials(THREE, config);

        // --- SKELETAL HIERARCHY ---
        const pelvis = new THREE.Group();
        pelvis.position.y = 1.05;
        root.add(pelvis);

        // Pelvis Mesh
        const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.22, 10);
        const pelvisMesh = new THREE.Mesh(pelvisGeo, mats.pants);
        pelvisMesh.castShadow = true;
        pelvis.add(pelvisMesh);

        // Spine & Chest
        const spine = new THREE.Group();
        spine.position.y = 0.12;
        pelvis.add(spine);

        const chestGeo = new THREE.BoxGeometry(0.52, 0.44, 0.32);
        const chestMesh = new THREE.Mesh(chestGeo, mats.chest);
        chestMesh.position.y = 0.24;
        chestMesh.castShadow = true;
        spine.add(chestMesh);

        // Optional Belt / Sash
        if (config.hasBelt) {
            const beltGeo = new THREE.TorusGeometry(0.25, 0.04, 8, 16);
            const beltMesh = new THREE.Mesh(beltGeo, mats.belt);
            beltMesh.rotation.x = Math.PI / 2;
            beltMesh.position.y = 0.02;
            spine.add(beltMesh);
        }

        // Neck & Head
        const neck = new THREE.Group();
        neck.position.y = 0.48;
        spine.add(neck);

        const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const headMesh = new THREE.Mesh(headGeo, mats.skin);
        headMesh.position.y = 0.14;
        headMesh.castShadow = true;
        neck.add(headMesh);

        // Custom Hair / Mask
        this.attachHeadDetails(THREE, neck, config, mats);

        // --- ARMS ---
        // Left Arm
        const leftShoulder = new THREE.Group();
        leftShoulder.position.set(-0.35, 0.38, 0);
        spine.add(leftShoulder);

        const leftArm = new THREE.Group();
        leftShoulder.add(leftArm);

        const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.34, 8);
        const leftArmMesh = new THREE.Mesh(armGeo, mats.sleeves || mats.skin);
        leftArmMesh.position.y = -0.17;
        leftArmMesh.castShadow = true;
        leftArm.add(leftArmMesh);

        const leftForearm = new THREE.Group();
        leftForearm.position.y = -0.34;
        leftArm.add(leftForearm);

        const forearmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 8);
        const leftForearmMesh = new THREE.Mesh(forearmGeo, mats.gloves || mats.skin);
        leftForearmMesh.position.y = -0.16;
        leftForearmMesh.castShadow = true;
        leftForearm.add(leftForearmMesh);

        // Left Fist
        const fistGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const leftFist = new THREE.Mesh(fistGeo, mats.gloves);
        leftFist.position.y = -0.34;
        leftFist.castShadow = true;
        leftForearm.add(leftFist);

        // Right Arm
        const rightShoulder = new THREE.Group();
        rightShoulder.position.set(0.35, 0.38, 0);
        spine.add(rightShoulder);

        const rightArm = new THREE.Group();
        rightShoulder.add(rightArm);

        const rightArmMesh = new THREE.Mesh(armGeo, mats.sleeves || mats.skin);
        rightArmMesh.position.y = -0.17;
        rightArmMesh.castShadow = true;
        rightArm.add(rightArmMesh);

        const rightForearm = new THREE.Group();
        rightForearm.position.y = -0.34;
        rightArm.add(rightForearm);

        const rightForearmMesh = new THREE.Mesh(forearmGeo, mats.gloves || mats.skin);
        rightForearmMesh.position.y = -0.16;
        rightForearmMesh.castShadow = true;
        rightForearm.add(rightForearmMesh);

        // Right Fist
        const rightFist = new THREE.Mesh(fistGeo, mats.gloves);
        rightFist.position.y = -0.34;
        rightFist.castShadow = true;
        rightForearm.add(rightFist);

        // Special Weapon (Yoshimitsu Blade)
        if (config.hasBlade) {
            const bladeGroup = new THREE.Group();
            const bladeGeo = new THREE.BoxGeometry(0.05, 0.95, 0.02);
            const bladeMesh = new THREE.Mesh(bladeGeo, mats.blade);
            bladeMesh.position.y = -0.45;
            bladeGroup.add(bladeMesh);

            const hiltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8);
            const hiltMesh = new THREE.Mesh(hiltGeo, mats.belt);
            bladeGroup.add(hiltMesh);

            rightFist.add(bladeGroup);
        }

        // --- LEGS ---
        // Left Leg
        const leftThigh = new THREE.Group();
        leftThigh.position.set(-0.16, -0.12, 0);
        pelvis.add(leftThigh);

        const thighGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.44, 8);
        const leftThighMesh = new THREE.Mesh(thighGeo, mats.pants);
        leftThighMesh.position.y = -0.22;
        leftThighMesh.castShadow = true;
        leftThigh.add(leftThighMesh);

        const leftShin = new THREE.Group();
        leftShin.position.y = -0.44;
        leftThigh.add(leftShin);

        const shinGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.42, 8);
        const leftShinMesh = new THREE.Mesh(shinGeo, mats.boots || mats.pants);
        leftShinMesh.position.y = -0.21;
        leftShinMesh.castShadow = true;
        leftShin.add(leftShinMesh);

        const footGeo = new THREE.BoxGeometry(0.14, 0.09, 0.26);
        const leftFoot = new THREE.Group();
        leftFoot.position.y = -0.42;
        leftShin.add(leftFoot);

        const leftFootMesh = new THREE.Mesh(footGeo, mats.boots);
        leftFootMesh.position.set(0, -0.04, 0.06);
        leftFootMesh.castShadow = true;
        leftFoot.add(leftFootMesh);

        // Right Leg
        const rightThigh = new THREE.Group();
        rightThigh.position.set(0.16, -0.12, 0);
        pelvis.add(rightThigh);

        const rightThighMesh = new THREE.Mesh(thighGeo, mats.pants);
        rightThighMesh.position.y = -0.22;
        rightThighMesh.castShadow = true;
        rightThigh.add(rightThighMesh);

        const rightShin = new THREE.Group();
        rightShin.position.y = -0.44;
        rightThigh.add(rightShin);

        const rightShinMesh = new THREE.Mesh(shinGeo, mats.boots || mats.pants);
        rightShinMesh.position.y = -0.21;
        rightShinMesh.castShadow = true;
        rightShin.add(rightShinMesh);

        const rightFoot = new THREE.Group();
        rightFoot.position.y = -0.42;
        rightShin.add(rightFoot);

        const rightFootMesh = new THREE.Mesh(footGeo, mats.boots);
        rightFootMesh.position.set(0, -0.04, 0.06);
        rightFootMesh.castShadow = true;
        rightFoot.add(rightFootMesh);

        // Store joint references for animation controller
        const rig = {
            root: root,
            pelvis: pelvis,
            spine: spine,
            head: neck,
            leftShoulder: leftShoulder,
            leftArm: leftArm,
            leftForearm: leftForearm,
            leftFist: leftFist,
            rightShoulder: rightShoulder,
            rightArm: rightArm,
            rightForearm: rightForearm,
            rightFist: rightFist,
            leftThigh: leftThigh,
            leftShin: leftShin,
            leftFoot: leftFoot,
            rightThigh: rightThigh,
            rightShin: rightShin,
            rightFoot: rightFoot,
            config: config
        };

        return rig;
    }

    attachHeadDetails(THREE, neck, config, mats) {
        if (config.hairStyle === 'jin') {
            // Spiky black Mishima hair
            const hairGroup = new THREE.Group();
            for (let i = 0; i < 7; i++) {
                const spikeGeo = new THREE.ConeGeometry(0.06, 0.22, 5);
                const spike = new THREE.Mesh(spikeGeo, mats.hair);
                const angle = (i / 7) * Math.PI * 1.2 - 0.6;
                spike.position.set(Math.sin(angle) * 0.12, 0.28, Math.cos(angle) * 0.05 + 0.02);
                spike.rotation.set(-0.4, 0, -angle * 0.8);
                hairGroup.add(spike);
            }
            neck.add(hairGroup);
        } else if (config.hairStyle === 'paul') {
            // Paul's iconic 1-foot vertical blonde flat-top cylinder
            const hairGeo = new THREE.CylinderGeometry(0.17, 0.16, 0.55, 10);
            const hairMesh = new THREE.Mesh(hairGeo, mats.hair);
            hairMesh.position.set(0, 0.42, -0.02);
            neck.add(hairMesh);
        } else if (config.hairStyle === 'king') {
            // King's Jaguar wrestling mask with ears and muzzle
            const snoutGeo = new THREE.ConeGeometry(0.1, 0.16, 6);
            const snout = new THREE.Mesh(snoutGeo, mats.mask);
            snout.position.set(0, 0.12, 0.18);
            snout.rotation.x = Math.PI / 2;
            neck.add(snout);

            const earGeo = new THREE.ConeGeometry(0.05, 0.1, 4);
            const earL = new THREE.Mesh(earGeo, mats.mask);
            earL.position.set(-0.14, 0.3, 0);
            const earR = new THREE.Mesh(earGeo, mats.mask);
            earR.position.set(0.14, 0.3, 0);
            neck.add(earL);
            neck.add(earR);
        } else if (config.hairStyle === 'yoshi') {
            // Cyber ninja Kabuto helmet & glowing visor
            const helmGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.18, 8);
            const helm = new THREE.Mesh(helmGeo, mats.armor);
            helm.position.set(0, 0.24, 0);
            neck.add(helm);

            const visorGeo = new THREE.BoxGeometry(0.24, 0.06, 0.08);
            const visor = new THREE.Mesh(visorGeo, mats.visor);
            visor.position.set(0, 0.15, 0.16);
            neck.add(visor);
        } else if (config.hairStyle === 'eddy') {
            // Eddy dreadlocks / fade
            const hairGeo = new THREE.SphereGeometry(0.19, 8, 8);
            const hair = new THREE.Mesh(hairGeo, mats.hair);
            hair.position.set(0, 0.22, -0.04);
            neck.add(hair);
        } else if (config.hairStyle === 'heihachi') {
            // Heihachi twin side wing spikes
            const wingGeo = new THREE.ConeGeometry(0.09, 0.32, 5);
            const wingL = new THREE.Mesh(wingGeo, mats.hair);
            wingL.position.set(-0.2, 0.28, -0.04);
            wingL.rotation.z = 0.7;
            const wingR = new THREE.Mesh(wingGeo, mats.hair);
            wingR.position.set(0.2, 0.28, -0.04);
            wingR.rotation.z = -0.7;
            neck.add(wingL);
            neck.add(wingR);
        }
    }

    getCharacterConfig(id, pIndex) {
        const configs = {
            jin: {
                id: 'jin',
                name: 'JIN KAZAMA',
                country: 'JAPAN',
                fightingStyle: 'Traditional Karate',
                hairStyle: 'jin',
                hasBelt: true,
                skinColor: 0xffccaa,
                pantsColor: pIndex === 1 ? 0x111111 : 0x881111,
                chestColor: 0xffccaa, // Bare chest
                hasChestCover: false,
                glovesColor: 0xcc2222,
                bootsColor: 0xcc2222,
                hairColor: 0x1a1a1a,
                beltColor: 0x111111,
                portraitBg: '#8b0000',
                description: 'Master of Karate and Mishima Arts. Lightning-fast strikes & launchers.'
            },
            paul: {
                id: 'paul',
                name: 'PAUL PHOENIX',
                country: 'USA',
                fightingStyle: 'Judobased Brawling',
                hairStyle: 'paul',
                hasBelt: true,
                skinColor: 0xf5c69f,
                pantsColor: pIndex === 1 ? 0xb51a1a : 0x222222,
                chestColor: pIndex === 1 ? 0xb51a1a : 0x222222,
                hasChestCover: true,
                glovesColor: 0x111111,
                bootsColor: 0x111111,
                hairColor: 0xffe066,
                beltColor: 0x111111,
                portraitBg: '#b8860b',
                description: 'Powerhouse slugger. His Phoenix Smasher (Deathfist) shatters guards.'
            },
            eddy: {
                id: 'eddy',
                name: 'EDDY GORDO',
                country: 'BRAZIL',
                fightingStyle: 'Capoeira',
                hairStyle: 'eddy',
                hasBelt: true,
                skinColor: 0x965a38,
                pantsColor: pIndex === 1 ? 0x007a3d : 0x003366,
                chestColor: 0x965a38,
                hasChestCover: false,
                glovesColor: 0xf1c40f,
                bootsColor: 0xf1c40f,
                hairColor: 0x221811,
                beltColor: 0xf1c40f,
                portraitBg: '#006400',
                description: 'Fluid acrobatic breakdance strikes, relentless low/high mixups.'
            },
            king: {
                id: 'king',
                name: 'KING',
                country: 'MEXICO',
                fightingStyle: 'Lucha Pro Wrestling',
                hairStyle: 'king',
                hasBelt: false,
                skinColor: 0xddaa88,
                pantsColor: pIndex === 1 ? 0x1b4f72 : 0x641e16,
                chestColor: 0xddaa88,
                hasChestCover: false,
                glovesColor: 0x111111,
                bootsColor: 0x111111,
                maskColor: 0xd4ac0d,
                portraitBg: '#1f618d',
                description: 'Lethal luchador. Devastating throws, dropkicks, and flying elbows.'
            },
            yoshimitsu: {
                id: 'yoshimitsu',
                name: 'YOSHIMITSU',
                country: 'UNKNOWN',
                fightingStyle: 'Manji Ninjutsu',
                hairStyle: 'yoshi',
                hasBelt: true,
                hasBlade: true,
                skinColor: 0x2c3e50,
                pantsColor: pIndex === 1 ? 0x1c2833 : 0x4a235a,
                chestColor: pIndex === 1 ? 0x2e4053 : 0x512e5f,
                hasChestCover: true,
                glovesColor: 0x00ffff,
                bootsColor: 0x00ffff,
                armorColor: 0x1c2833,
                visorColor: 0x00ff88,
                bladeColor: 0x00ffff,
                beltColor: 0x00ff88,
                portraitBg: '#0e6251',
                description: 'Cybernetic Manji ninja. Armed with a mystic energy blade & evasive spins.'
            },
            heihachi: {
                id: 'heihachi',
                name: 'HEIHACHI MISHIMA',
                country: 'JAPAN',
                fightingStyle: 'Mishima Karate',
                hairStyle: 'heihachi',
                hasBelt: true,
                skinColor: 0xddbb99,
                pantsColor: 0x222222,
                chestColor: 0x222222,
                hasChestCover: true,
                glovesColor: 0x111111,
                bootsColor: 0x111111,
                hairColor: 0xcccccc,
                beltColor: 0xd4ac0d,
                portraitBg: '#4a235a',
                description: 'Iron Fist patriarch. Brutal lightning launchers & devastating power.'
            }
        };

        return configs[id] || configs.jin;
    }

    createMaterials(THREE, config) {
        const mats = {
            skin: new THREE.MeshLambertMaterial({ color: config.skinColor }),
            pants: new THREE.MeshLambertMaterial({ color: config.pantsColor }),
            chest: config.hasChestCover ? 
                   new THREE.MeshLambertMaterial({ color: config.chestColor }) : 
                   new THREE.MeshLambertMaterial({ color: config.skinColor }),
            sleeves: config.hasChestCover ? 
                     new THREE.MeshLambertMaterial({ color: config.chestColor }) : 
                     null,
            gloves: new THREE.MeshLambertMaterial({ color: config.glovesColor }),
            boots: new THREE.MeshLambertMaterial({ color: config.bootsColor }),
            hair: new THREE.MeshLambertMaterial({ color: config.hairColor || 0x222222 }),
            belt: new THREE.MeshLambertMaterial({ color: config.beltColor || 0x111111 }),
            mask: new THREE.MeshLambertMaterial({ color: config.maskColor || 0xd4ac0d }),
            armor: new THREE.MeshLambertMaterial({ color: config.armorColor || 0x222222 }),
            visor: new THREE.MeshBasicMaterial({ color: config.visorColor || 0x00ffcc }),
            blade: new THREE.MeshBasicMaterial({ color: config.bladeColor || 0x00ffff })
        };
        return mats;
    }

    /**
     * Apply pose calculations to 3D rig hierarchy
     */
    applyPoseToRig(rig, pose) {
        if (!rig || !pose) return;

        rig.root.position.x = pose.rootPos.x;
        rig.root.position.y = pose.rootPos.y;
        rig.root.position.z = pose.rootPos.z;

        rig.root.rotation.x = pose.rootRot.x;
        rig.root.rotation.y = pose.rootRot.y;
        rig.root.rotation.z = pose.rootRot.z;

        rig.spine.rotation.set(pose.spine.x, pose.spine.y, pose.spine.z);
        rig.head.rotation.set(pose.head.x, pose.head.y, pose.head.z);

        rig.leftShoulder.rotation.set(pose.leftShoulder.x, pose.leftShoulder.y, pose.leftShoulder.z);
        rig.leftArm.rotation.set(pose.leftArm.x, pose.leftArm.y, pose.leftArm.z);
        rig.leftForearm.rotation.set(pose.leftForearm.x, pose.leftForearm.y, pose.leftForearm.z);

        rig.rightShoulder.rotation.set(pose.rightShoulder.x, pose.rightShoulder.y, pose.rightShoulder.z);
        rig.rightArm.rotation.set(pose.rightArm.x, pose.rightArm.y, pose.rightArm.z);
        rig.rightForearm.rotation.set(pose.rightForearm.x, pose.rightForearm.y, pose.rightForearm.z);

        rig.leftThigh.rotation.set(pose.leftThigh.x, pose.leftThigh.y, pose.leftThigh.z);
        rig.leftShin.rotation.set(pose.leftShin.x, pose.leftShin.y, pose.leftShin.z);
        rig.leftFoot.rotation.set(pose.leftFoot.x, pose.leftFoot.y, pose.leftFoot.z);

        rig.rightThigh.rotation.set(pose.rightThigh.x, pose.rightThigh.y, pose.rightThigh.z);
        rig.rightShin.rotation.set(pose.rightShin.x, pose.rightShin.y, pose.rightShin.z);
        rig.rightFoot.rotation.set(pose.rightFoot.x, pose.rightFoot.y, pose.rightFoot.z);
    }
}

window.fighterModelBuilder = new FighterModelBuilder();
