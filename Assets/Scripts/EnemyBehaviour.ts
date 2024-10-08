import { Player } from "./PlayerSingleton";

@component
export class EnemyBehaviour extends BaseScriptComponent {
	@input
	forwardSpeed: number;

	@input
	turnSpeed: number;

	@input
	playerObj: SceneObject;

	@input
	damageRange: number;

	@input
	damage: number;

	@input maxHealth: number;

	@input
	experienceGained: number;

	health: number;
	enemy = this.getSceneObject();
	private player = Player.getInstance();
	sounds: AudioComponent[] =
		this.getSceneObject().getComponents("AudioComponent");

	private healthText: Text3D = this.getSceneObject().getComponent("Text3D");

	frame = 0;

	justSpawned = true;
	jumpscare = false;

	onAwake() {
		this.health = this.maxHealth;
		this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
	}

	public takeDamage(damage: number): void {
		this.health -= damage;
		this.healthText.text =
			this.health % 1 === 0
				? this.health + "/" + this.maxHealth
				: this.health.toPrecision(1) + "/" + this.maxHealth;
		if (this.health <= 0) {
			this.kill();
		} else {
			this.sounds[1].play(0);
		}
	}

	private kill(): void {
		this.player.addScore(this.experienceGained);
		if (this.getSceneObject()) {
			this.getSceneObject().destroy();
		}
	}

	onUpdate() {
		if (this.getSceneObject() === null) {
			return;
		}
		if (this.justSpawned == true) {
			this.spawn();
			// print("spawn scale")
		} else {
			this.move();
			// print("movement")
		}

		this.pollPlayer();
	}

	private pollPlayer(): void {
		let playerPos: vec3 = this.playerObj.getTransform().getWorldPosition();
		let currPos: vec3 = this.enemy.getTransform().getWorldPosition();
		let dist = playerPos.distance(currPos);
		if (dist < this.damageRange) {
			this.player.takeDamage(this.damage);
			this.kill();
		}
	}

	private lose(): void {
		// jumpscare lol
		// give it 30 frames
		this.frame += 1;
		if (this.frame == 31) {
			this.frame = 0;
			this.jumpscare = false;
		}
		this.enemy
			.getTransform()
			.setWorldScale(
				this.enemy
					.getTransform()
					.getWorldScale()
					.mult(new vec3(2, 2, 2))
			);
	}

	private spawn(): void {
		this.sounds[0].play(0);
		this.frame += 1;
		if (this.frame == 16) {
			this.frame = 0;
			this.justSpawned = false;
		}
		this.enemy
			.getTransform()
			.setWorldScale(
				this.enemy
					.getTransform()
					.getWorldScale()
					.mult(new vec3(1.25, 1.25, 1.25))
			);
		// print(this.enemy.getTransform().getWorldScale());
	}

	private move(): void {
		this.frame += 1;
		if (this.frame == 31) this.frame = 0;

		//Get vector from enemy to player
		let playerPos: vec3 = this.playerObj.getTransform().getWorldPosition();

		let currPos: vec3 = this.enemy.getTransform().getWorldPosition();

		let dir_vec: vec3 = playerPos.sub(currPos);

		dir_vec = dir_vec.normalize();

		//go to new position

		let newPos = currPos.add(
			this.enemy
				.getTransform()
				.forward.uniformScale(this.forwardSpeed * getDeltaTime())
		);

		this.enemy.getTransform().setWorldPosition(newPos);

		//rotate toward player a bit

		let newRot = quat.lookAt(dir_vec, vec3.up());

		this.enemy
			.getTransform()
			.setWorldRotation(
				quat.slerp(
					this.enemy.getTransform().getWorldRotation(),
					newRot,
					this.turnSpeed * getDeltaTime()
				)
			);
	}
}
