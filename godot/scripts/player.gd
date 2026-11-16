extends CharacterBody3D
## First-person YSL exploration controller; touch is consumed from CityHUD.
@export var walk_speed: float = 5.0
@export var run_speed: float = 8.5
@onready var head: Node3D = $Head
@onready var hud = $"../HUD/CityHUD"
var mouse_sens: float = 0.0023
var touch_sens: float = 0.0035

func _ready() -> void:
    if not DisplayServer.is_touchscreen_available():
        Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
    elif event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        _look(event.relative, mouse_sens)
    elif event is InputEventMouseButton and event.pressed and not hud.map_open:
        Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _look(amount: Vector2, sensitivity: float) -> void:
    rotate_y(-amount.x * sensitivity)
    head.rotate_x(-amount.y * sensitivity)
    head.rotation.x = clampf(head.rotation.x, -1.42, 1.42)

func _physics_process(dt: float) -> void:
    if hud.map_open:
        velocity.x = 0.0
        velocity.z = 0.0
        if not is_on_floor(): velocity.y -= 16.0 * dt
        move_and_slide()
        return
    var delta_look: Vector2 = hud.consume_look()
    if delta_look.length_squared() > 0.001: _look(delta_look, touch_sens)
    var keys := Vector2(
        (1.0 if Input.is_key_pressed(KEY_D) else 0.0) - (1.0 if Input.is_key_pressed(KEY_A) else 0.0),
        (1.0 if Input.is_key_pressed(KEY_S) else 0.0) - (1.0 if Input.is_key_pressed(KEY_W) else 0.0)
    )
    var input_dir: Vector2 = (keys + hud.move_vector).limit_length(1.0)
    var world: Vector3 = global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)
    world.y = 0.0
    var speed: float = run_speed if hud.running or Input.is_key_pressed(KEY_SHIFT) else walk_speed
    velocity.x = move_toward(velocity.x, world.x * speed, dt * 20.0)
    velocity.z = move_toward(velocity.z, world.z * speed, dt * 20.0)
    if not is_on_floor():
        velocity.y -= 16.0 * dt
    elif hud.consume_jump() or Input.is_key_pressed(KEY_SPACE):
        velocity.y = 6.0
    else:
        velocity.y = -0.15
    move_and_slide()
