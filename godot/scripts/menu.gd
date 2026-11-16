extends Control
## Tiny front menu to isolate Android-editor Play failures from world loading.
func _ready() -> void:
    var bg := ColorRect.new()
    bg.color = Color(0.043, 0.074, 0.086)
    bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    add_child(bg)
    var stack := VBoxContainer.new()
    stack.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
    stack.offset_left = -340
    stack.offset_right = 340
    stack.offset_top = -245
    stack.offset_bottom = 245
    stack.add_theme_constant_override("separation", 8)
    add_child(stack)
    var name_label := Label.new()
    name_label.text = "CASANOVA V0.7"
    name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    name_label.add_theme_font_size_override("font_size", 43)
    name_label.add_theme_color_override("font_color", Color(0.95, 0.79, 0.47))
    stack.add_child(name_label)
    var caption := Label.new()
    caption.text = "CASABLANCA-INSPIRED CITY  •  2006"
    caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    caption.add_theme_font_size_override("font_size", 18)
    caption.add_theme_color_override("font_color", Color(0.79, 0.84, 0.82))
    stack.add_child(caption)
    var button := Button.new()
    button.text = "EXPLORE CITY — NORMAL MODE"
    button.custom_minimum_size = Vector2(0, 53)
    button.pressed.connect(_enter_city)
    stack.add_child(button)
    var safe_button := Button.new()
    safe_button.text = "EXPLORE CITY — REDMI SAFE MODE (1 TILE)"
    safe_button.custom_minimum_size = Vector2(0,52)
    safe_button.pressed.connect(func():get_tree().change_scene_to_file("res://scenes/city_safe.tscn"))
    stack.add_child(safe_button)
    var road_test := Button.new()
    road_test.text = "TEST THE SEVEN ROAD MODELS (SAFE: NO BUILDINGS)"
    road_test.custom_minimum_size = Vector2(0,48)
    road_test.pressed.connect(func():get_tree().change_scene_to_file("res://scenes/city_roads_test.tscn"))
    stack.add_child(road_test)
    var preview_button := Button.new()
    preview_button.text = "VIEW ALL 20 IMPORTED MODELS (ONE AT A TIME)"
    preview_button.custom_minimum_size = Vector2(0, 50)
    preview_button.pressed.connect(func():get_tree().change_scene_to_file("res://scenes/showroom.tscn"))
    stack.add_child(preview_button)
    var infra_button := Button.new()
    infra_button.text = "INSPECT 21 UPLOADED STREET INFRASTRUCTURE ASSETS"
    infra_button.custom_minimum_size = Vector2(0, 51)
    infra_button.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/infrastructure_showroom.tscn"))
    stack.add_child(infra_button)
    var car_button := Button.new()
    car_button.text = "INSPECT 19 USER-IMPORTED VEHICLES"
    car_button.custom_minimum_size = Vector2(0, 54)
    car_button.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/vehicle_showroom.tscn"))
    stack.add_child(car_button)
    var message := Label.new()
    message.text = "20 buildings • 7 roads • 19 vehicles • 21 infrastructure models • static city scenery"
    message.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    message.add_theme_font_size_override("font_size", 15)
    message.add_theme_color_override("font_color", Color(0.65, 0.74, 0.76))
    message.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    stack.add_child(message)

func _enter_city() -> void:
    get_tree().change_scene_to_file("res://scenes/city.tscn")
