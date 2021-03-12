
bl_info = {
    'name': 'PhsxProperty',
    "author": "gara",
    "blender": (2, 80, 0),
    "category": "3DView",
    "description": "Setta la custom property del comportamento fisico per export verso THREE.js",
    "location": "N-Panel -> GIGA",
    "version": (0, 1),
}

import bpy

class OBJECT_OT_setToStatic(bpy.types.Operator):
    bl_idname = 'object.set_to_static'
    bl_label = 'Static'
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        objs = bpy.context.selected_objects

        for obj in objs:
            obj["PhsxBehavior"] = 0
            obj.select_set(False)
            obj.select_set(True)
    
        return {"FINISHED"}
    
    
class OBJECT_OT_setToDynamic(bpy.types.Operator):
    bl_idname = 'object.set_to_dynamic'
    bl_label = 'Dynamic'
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        objs = bpy.context.selected_objects

        for obj in objs:
            obj["PhsxBehavior"] = 1
            obj.select_set(False)
            obj.select_set(True)
    
        return {"FINISHED"}
    
    
class OBJECT_OT_setToNoCollision(bpy.types.Operator):
    bl_idname = 'object.set_to_nocollision'
    bl_label = 'No collision'
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        objs = bpy.context.selected_objects

        for obj in objs:
            obj["PhsxBehavior"] = 2
            obj.select_set(False)
            obj.select_set(True)
    
        return {"FINISHED"}
    
    
class OBJECT_OT_setToNone(bpy.types.Operator):
    bl_idname = 'object.set_to_none'
    bl_label = 'None'
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        objs = bpy.context.selected_objects

        for obj in objs:
            del obj["PhsxBehavior"]
            obj.select_set(False)
            obj.select_set(True)
    
        return {"FINISHED"}
    
    
class PANEL_PT_panel1(bpy.types.Panel):
    bl_idname = "PANEL_PT_panel1"
    bl_label = "Set physics behavior"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "GIGA"
    bl_context = "objectmode"
        
    def draw(self, context):
        layout = self.layout
        
        self.layout.operator("object.set_to_static")
        self.layout.operator("object.set_to_dynamic")
        self.layout.operator("object.set_to_nocollision")
        self.layout.operator("object.set_to_none")
    
    
classes = (
    OBJECT_OT_setToStatic,
    OBJECT_OT_setToDynamic,
    OBJECT_OT_setToNoCollision,
    OBJECT_OT_setToNone,
    PANEL_PT_panel1
)
    
def register():
    for c in classes:
        bpy.utils.register_class(c)
    #bpy.types.TOPBAR_MT_file_export.append(menu_func_export)
def unregister():
    for c in reversed(classes):
        bpy.utils.unregister_class(c)
    #bpy.types.TOPBAR_MT_file_export.remove(menu_func_export)
if __name__ == "__main__":
    register()