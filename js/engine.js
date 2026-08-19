/**
 * TEKKEN 3 - 3D WebGL Graphics Engine & Arena Manager
 * Handles Three.js rendering, dynamic camera tracking, particle VFX (electric sparks,
 * shockwaves, dust), and 3D fight environments (Dojo, Cyber Rooftop, Sunset Shrine).
 */

class GraphicsEngine {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;

        // Stage & Environment
        this.currentStage = 'dojo';
        this.stageGroup = null;
        this.ambientLight = null;
        this.dirLight = null;
        this.spotLight = null;

        // Dynamic Camera Parameters
        this.cameraTarget = { x: 0, y: 1.2, z: 0 };
        this.cameraShake = 0;
        this.cameraZoom = 1.0;
        this.isCinematicKO = false;
        this.cinematicAngle = 0;

        // Particle VFX
        this.particles = [];
        this.maxParticles = 600;
        this.particleGeo = null;

        this.initialized = false;
    }

    init(containerElement) {
        if (this.initialized) return;
        this.container = containerElement;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c0d14);
        this.scene.fog = new THREE.FogExp2(0x0c0d14, 0.025);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);
        this.camera.position.set(0, 2.0, 5.8);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        this.container.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Build default stage
        this.buildStage(this.currentStage);

        // Particles
        this.setupParticleSystem();

        // Clock
        this.clock = new THREE.Clock();

        // Resize Listener
        window.addEventListener('resize', () => this.onResize());

        this.initialized = true;
    }

    setupLighting() {
        this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.65);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xfff4e0, 1.4);
        this.dirLight.position.set(4, 9, 6);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 25;
        this.dirLight.shadow.camera.left = -6;
        this.dirLight.shadow.camera.right = 6;
        this.dirLight.shadow.camera.top = 6;
        this.dirLight.shadow.camera.bottom = -6;
        this.dirLight.shadow.bias = -0.001;
        this.scene.add(this.dirLight);

        // Dynamic colored rim spotlight
        this.spotLight = new THREE.SpotLight(0x00aaff, 1.2);
        this.spotLight.position.set(-5, 6, -3);
        this.spotLight.angle = Math.PI / 4;
        this.spotLight.penumbra = 0.5;
        this.scene.add(this.spotLight);
    }

    buildStage(stageId = 'dojo') {
        this.currentStage = stageId;
        if (this.stageGroup) {
            this.scene.remove(this.stageGroup);
        }

        this.stageGroup = new THREE.Group();
        this.scene.add(this.stageGroup);

        if (stageId === 'dojo') {
            this.buildMishimaDojo();
        } else if (stageId === 'cyber') {
            this.buildCyberTokyo();
        } else if (stageId === 'shrine') {
            this.buildSunsetShrine();
        }
    }

    buildMishimaDojo() {
        this.scene.background = new THREE.Color(0x140d0a);
        this.scene.fog.color = new THREE.Color(0x140d0a);
        this.ambientLight.color.setHex(0xffddbb);
        this.ambientLight.intensity = 0.7;
        this.dirLight.color.setHex(0xffecd0);
        this.spotLight.color.setHex(0xd4ac0d);

        // Tatami / Wood Floor
        const floorGeo = new THREE.PlaneGeometry(24, 24);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x4a2e18,
            roughness: 0.6,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.stageGroup.add(floor);

        // Tatami Ring Border
        const ringGeo = new THREE.RingGeometry(5.4, 5.6, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xb58900, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.stageGroup.add(ring);

        // Dojo Wooden Pillars & Shoji Wall Background
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x24150c, roughness: 0.8 });
        const paperMat = new THREE.MeshBasicMaterial({ color: 0xf5f0e1 });

        for (let i = -4; i <= 4; i++) {
            // Pillars
            const pillarGeo = new THREE.CylinderGeometry(0.22, 0.22, 6, 8);
            const pillar = new THREE.Mesh(pillarGeo, wallMat);
            pillar.position.set(i * 2.5, 3, -6.5);
            pillar.castShadow = true;
            this.stageGroup.add(pillar);

            // Shoji screens
            if (i < 4) {
                const screenGeo = new THREE.PlaneGeometry(2.3, 4.5);
                const screen = new THREE.Mesh(screenGeo, paperMat);
                screen.position.set(i * 2.5 + 1.25, 2.8, -6.4);
                this.stageGroup.add(screen);
            }
        }

        // Stone lanterns with warm glow
        for (let x of [-4.5, 4.5]) {
            const lanternGeo = new THREE.BoxGeometry(0.6, 1.4, 0.6);
            const lanternMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
            const lantern = new THREE.Mesh(lanternGeo, lanternMat);
            lantern.position.set(x, 0.7, -3.5);
            lantern.castShadow = true;
            this.stageGroup.add(lantern);

            const glowLight = new THREE.PointLight(0xffaa33, 1.2, 5);
            glowLight.position.set(x, 1.2, -3.5);
            this.stageGroup.add(glowLight);
        }
    }

    buildCyberTokyo() {
        this.scene.background = new THREE.Color(0x060814);
        this.scene.fog.color = new THREE.Color(0x060814);
        this.ambientLight.color.setHex(0x1a2a4a);
        this.ambientLight.intensity = 0.5;
        this.dirLight.color.setHex(0x00ffff);
        this.spotLight.color.setHex(0xff0066);

        // Wet Glossy Rooftop
        const floorGeo = new THREE.PlaneGeometry(26, 26);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x111625,
            roughness: 0.15,
            metalness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.stageGroup.add(floor);

        // Cyber Grid Lines
        const grid = new THREE.GridHelper(26, 26, 0x00ffff, 0x1a3355);
        grid.position.y = 0.01;
        this.stageGroup.add(grid);

        // Background Cyber Skyscrapers & Holograms
        for (let i = 0; i < 14; i++) {
            const h = 8 + Math.random() * 12;
            const w = 2 + Math.random() * 3;
            const bldgGeo = new THREE.BoxGeometry(w, h, w);
            const bldgMat = new THREE.MeshStandardMaterial({
                color: 0x0a101f,
                roughness: 0.5,
                metalness: 0.6
            });
            const bldg = new THREE.Mesh(bldgGeo, bldgMat);
            const angle = (i / 14) * Math.PI * 1.8 + 0.5;
            const dist = 12 + Math.random() * 6;
            bldg.position.set(Math.sin(angle) * dist, h / 2 - 2, -Math.cos(angle) * dist);
            this.stageGroup.add(bldg);

            // Neon Window / Billboard strips
            const neonColors = [0x00ffff, 0xff007f, 0x00ff88, 0xffbb00];
            const neonMat = new THREE.MeshBasicMaterial({
                color: neonColors[i % neonColors.length]
            });
            const billboardGeo = new THREE.PlaneGeometry(w * 0.8, 1.2);
            const billboard = new THREE.Mesh(billboardGeo, neonMat);
            billboard.position.set(bldg.position.x, h * 0.65, bldg.position.z + w / 2 + 0.05);
            this.stageGroup.add(billboard);
        }
    }

    buildSunsetShrine() {
        this.scene.background = new THREE.Color(0x3a1510);
        this.scene.fog.color = new THREE.Color(0x3a1510);
        this.ambientLight.color.setHex(0xff7744);
        this.ambientLight.intensity = 0.8;
        this.dirLight.color.setHex(0xff9944);
        this.dirLight.position.set(-6, 4, 8);
        this.spotLight.color.setHex(0xff3300);

        // Stone Tile Ground
        const floorGeo = new THREE.PlaneGeometry(24, 24);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x3d3028,
            roughness: 0.7,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.stageGroup.add(floor);

        // Grand Torii Gate
        const redMat = new THREE.MeshStandardMaterial({ color: 0xaa2211, roughness: 0.5 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

        // Left & Right Pillars
        for (let x of [-3.5, 3.5]) {
            const pillarGeo = new THREE.CylinderGeometry(0.28, 0.32, 6.5, 12);
            const pillar = new THREE.Mesh(pillarGeo, redMat);
            pillar.position.set(x, 3.25, -6);
            pillar.castShadow = true;
            this.stageGroup.add(pillar);

            const baseGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.6, 12);
            const base = new THREE.Mesh(baseGeo, blackMat);
            base.position.set(x, 0.3, -6);
            this.stageGroup.add(base);
        }

        // Crossbeams (Kasagi & Nuki)
        const topBeamGeo = new THREE.BoxGeometry(9.2, 0.45, 0.5);
        const topBeam = new THREE.Mesh(topBeamGeo, blackMat);
        topBeam.position.set(0, 6.4, -6);
        this.stageGroup.add(topBeam);

        const midBeamGeo = new THREE.BoxGeometry(8.0, 0.35, 0.4);
        const midBeam = new THREE.Mesh(midBeamGeo, redMat);
        midBeam.position.set(0, 5.2, -6);
        this.stageGroup.add(midBeam);
    }

    // --- PARTICLE & COMBAT VFX ---

    setupParticleSystem() {
        this.particlePool = [];
        this.activeParticles = [];

        // Pre-allocate 300 particle meshes
        const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);

        for (let i = 0; i < 300; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 1 });
            const p = new THREE.Mesh(sparkGeo, mat);
            p.visible = false;
            this.scene.add(p);
            this.particlePool.push(p);
        }
    }

    /**
     * Spawn signature Tekken 3 comic-electric hit sparks
     */
    spawnHitSparks(pos, intensity = 'medium', isCounter = false, isElectric = false) {
        const count = isCounter ? 28 : intensity === 'heavy' ? 22 : 12;
        const color = isElectric ? 0x00ffff : isCounter ? 0xff0044 : intensity === 'heavy' ? 0xff8800 : 0xffea00;

        for (let i = 0; i < count; i++) {
            const p = this.particlePool.pop();
            if (!p) break;

            p.material.color.setHex(color);
            p.material.opacity = 1.0;
            p.position.copy(pos);
            p.position.x += (Math.random() - 0.5) * 0.2;
            p.position.y += (Math.random() - 0.5) * 0.2;
            p.position.z += (Math.random() - 0.5) * 0.2;

            const speed = 2.5 + Math.random() * 4.5 * (isCounter ? 1.5 : 1);
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;

            p.userData = {
                vel: new THREE.Vector3(
                    Math.cos(theta) * Math.cos(phi) * speed,
                    Math.sin(phi) * speed + 1.5,
                    Math.sin(theta) * Math.cos(phi) * speed
                ),
                life: 0.25 + Math.random() * 0.25,
                maxLife: 0.25 + Math.random() * 0.25,
                gravity: 9.8,
                scale: isCounter ? 1.8 : intensity === 'heavy' ? 1.4 : 0.9
            };

            p.scale.setScalar(p.userData.scale);
            p.visible = true;
            this.activeParticles.push(p);
        }

        // Camera Shake trigger on impacts
        this.addCameraShake(intensity === 'heavy' || isCounter ? 0.22 : 0.08);
    }

    spawnBlockSparks(pos) {
        for (let i = 0; i < 10; i++) {
            const p = this.particlePool.pop();
            if (!p) break;

            p.material.color.setHex(0x66ccff);
            p.material.opacity = 1.0;
            p.position.copy(pos);

            const speed = 1.8 + Math.random() * 2.5;
            const theta = Math.random() * Math.PI * 2;

            p.userData = {
                vel: new THREE.Vector3(Math.cos(theta) * speed, Math.random() * 2.0, Math.sin(theta) * speed),
                life: 0.18,
                maxLife: 0.18,
                gravity: 6.0,
                scale: 0.8
            };

            p.scale.setScalar(p.userData.scale);
            p.visible = true;
            this.activeParticles.push(p);
        }
        this.addCameraShake(0.04);
    }

    spawnDust(pos) {
        for (let i = 0; i < 8; i++) {
            const p = this.particlePool.pop();
            if (!p) break;

            p.material.color.setHex(0xaaaaaa);
            p.material.opacity = 0.6;
            p.position.set(pos.x + (Math.random() - 0.5) * 0.4, 0.05, pos.z + (Math.random() - 0.5) * 0.4);

            p.userData = {
                vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 0.8 + 0.2, (Math.random() - 0.5) * 1.5),
                life: 0.35,
                maxLife: 0.35,
                gravity: -0.5, // Float up
                scale: 1.2
            };

            p.scale.setScalar(p.userData.scale);
            p.visible = true;
            this.activeParticles.push(p);
        }
    }

    updateParticles(dt) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            const data = p.userData;

            data.life -= dt;
            if (data.life <= 0) {
                p.visible = false;
                this.activeParticles.splice(i, 1);
                this.particlePool.push(p);
                continue;
            }

            // Physics integration
            p.position.addScaledVector(data.vel, dt);
            data.vel.y -= data.gravity * dt;

            // Fade & shrink
            const progress = data.life / data.maxLife;
            p.material.opacity = progress;
            p.scale.setScalar(data.scale * progress);
        }
    }

    addCameraShake(amount) {
        this.cameraShake = Math.max(this.cameraShake, amount);
    }

    /**
     * Dynamic Tekken 3 Camera Tracker
     */
    updateCamera(p1Pos, p2Pos, dt) {
        if (!this.camera) return;

        if (this.isCinematicKO) {
            // Dramatic 360 slow motion orbit on K.O.!
            this.cinematicAngle += dt * 1.2;
            const midX = (p1Pos.x + p2Pos.x) * 0.5;
            const midZ = (p1Pos.z + p2Pos.z) * 0.5;
            const dist = 3.2;

            this.camera.position.x = midX + Math.sin(this.cinematicAngle) * dist;
            this.camera.position.z = midZ + Math.cos(this.cinematicAngle) * dist;
            this.camera.position.y = 1.1 + Math.sin(this.cinematicAngle * 0.5) * 0.3;
            this.camera.lookAt(midX, 1.1, midZ);
            return;
        }

        // Smooth fighter mid-point tracking
        const midX = (p1Pos.x + p2Pos.x) * 0.5;
        const midY = (p1Pos.y + p2Pos.y) * 0.5;
        const midZ = (p1Pos.z + p2Pos.z) * 0.5;
        const fighterDist = Math.hypot(p1Pos.x - p2Pos.x, p1Pos.z - p2Pos.z);

        // Desired camera position
        const targetDist = Math.max(4.6, Math.min(8.0, fighterDist * 1.45 + 1.8));
        const targetHeight = 1.9 + (midY * 0.4);

        this.cameraTarget.x += (midX - this.cameraTarget.x) * (dt * 5.0);
        this.cameraTarget.y += (targetHeight - this.cameraTarget.y) * (dt * 5.0);
        this.cameraTarget.z += (midZ + targetDist - this.cameraTarget.z) * (dt * 5.0);

        // Camera Shake
        let shakeX = 0;
        let shakeY = 0;
        if (this.cameraShake > 0) {
            shakeX = (Math.random() - 0.5) * this.cameraShake;
            shakeY = (Math.random() - 0.5) * this.cameraShake;
            this.cameraShake = Math.max(0, this.cameraShake - dt * 1.2);
        }

        this.camera.position.set(
            this.cameraTarget.x + shakeX,
            this.cameraTarget.y + shakeY,
            this.cameraTarget.z
        );

        this.camera.lookAt(midX, 1.25 + midY * 0.3, midZ);
    }

    startCinematicKO() {
        this.isCinematicKO = true;
        this.cinematicAngle = 0;
    }

    stopCinematicKO() {
        this.isCinematicKO = false;
    }

    render(dt) {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.updateParticles(dt);
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

window.graphicsEngine = new GraphicsEngine();
