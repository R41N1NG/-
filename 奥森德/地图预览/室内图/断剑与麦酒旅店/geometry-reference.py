import bpy, math
from mathutils import Vector
from pathlib import Path

OUT=Path('/workspace/work')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1)
    m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.9
    return m
paper=material('paper',(.78,.68,.51));plaster=material('plaster',(.78,.71,.58));wood=material('wood',(.39,.26,.15));lightwood=material('light wood',(.57,.40,.23));stone=material('stone',(.56,.50,.40));dark=material('recess',(.13,.10,.075));window=material('window',(.87,.82,.68));floor=material('floor',(.65,.49,.30))

def box(name,loc,size,mat=wood):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);return o
def beam(name,a,b,width=.1,mat=wood):
    a,b=Vector(a),Vector(b);o=box(name,(a+b)/2,(width,width,(b-a).length),mat);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def slab(name,x0,x1,y0,y1,z=0,mat=floor):return box(name,((x0+x1)/2,(y0+y1)/2,z-.12),(x1-x0,y1-y0,.24),mat)
def wall(name,x0,x1,y,z0,z1,mat=plaster):return box(name,((x0+x1)/2,y,(z0+z1)/2),(x1-x0,.18,z1-z0),mat)
def door_wall(name,x0,x1,y,doors,h=3.25):
    last=x0
    for x,w in sorted(doors):
        l,r=x-w/2,x+w/2
        if l>last:wall(name+' plaster',last,l,y,0,h)
        wall(name+' lintel infill',l,r,y,2.45,h)
        for side in [l,r]:box(name+' doorpost',(side,y-.12,1.25),(.12,.17,2.5))
        box(name+' lintel',(x,y-.12,2.5),(w+.2,.18,.16))
        box(name+' closed door',(x,y,1.20),(w-.12,.09,2.4),lightwood)
        last=r
    if last<x1:wall(name+' plaster',last,x1,y,0,h)
    beam(name+' head',(x0,y-.12,h),(x1,y-.12,h),.18)

def east_wall():
    x=12;h=3.25
    for y0,y1 in [(-7,-4.7),(-2.5,.1),(2.4,7)]:box('east wall',(x,(y0+y1)/2,h/2),(.2,y1-y0,h),plaster)
    for y0,y1 in [(-4.7,-2.5),(.1,2.4)]:
        box('east window sill infill',(x,(y0+y1)/2,.48),(.2,y1-y0,.96),plaster)
        box('east window upper infill',(x,(y0+y1)/2,2.88),(.2,y1-y0,.74),plaster)
        box('east window light',(x+.02,(y0+y1)/2,1.73),(.04,y1-y0,1.54),window)
        for y in [y0,y1,(y0+y1)/2]:beam('window mullion',(x-.13,y,1),(x-.13,y,2.48),.08)
        beam('window cross',(x-.13,y0,1.7),(x-.13,y1,1.7),.08)
    for y in [-7,-4.7,-2.5,.1,2.4,7]:beam('east post',(x-.18,y,0),(x-.18,y,h),.18)
    beam('east head',(x, -7,h),(x,7,h),.2)

def rail(name,a,b):
    a,b=Vector(a),Vector(b)
    n=max(1,int((b-a).length/.7))
    for i in range(n+1):
        q=a.lerp(b,i/n);beam(name+' post',q,q+Vector((0,0,.85)),.075)
    beam(name+' handrail',a+Vector((0,0,.85)),b+Vector((0,0,.85)),.09)

def stairs(z=0,upper=False):
    # Two flights share the same 3D coordinates; upper uses the same stair translated down one storey.
    z0=z-3.2 if upper else z
    n=10;rise=.16;run=.32
    for i in range(n):
        y=2.1+run*(i+.5);top=z0+rise*(i+1)
        box('lower stair tread',(8.65,y,top-.08),(1.3,run,.16),lightwood)
    slab('turn landing',8,11.5,5.3,6.2,z0+1.6,lightwood)
    for i in range(n):
        y=5.3-run*(i+.5);top=z0+1.6+rise*(i+1)
        box('upper stair tread',(10.85,y,top-.08),(1.3,run,.16),lightwood)
    slab('upper arrival',10.2,11.5,1.2,2.1,z0+3.2,lightwood)
    for x in [8,9.3]:rail('lower flight railing',(x,2.1,z0),(x,5.3,z0+1.6))
    for x in [10.2,11.5]:rail('upper flight railing',(x,5.3,z0+1.6),(x,2.1,z0+3.2))
    rail('landing railing',(8,6.2,z0+1.6),(11.5,6.2,z0+1.6))
    if upper:
        rail('well west',(8,2.1,0),(8,6.2,0));rail('well east',(11.5,2.1,0),(11.5,6.2,0));rail('well north',(8,6.2,0),(11.5,6.2,0));rail('well front',(8,2.1,0),(10.1,2.1,0))

def table(x,y,w=3,d=1.2):
    box('table top',(x,y,.84),(w,d,.14),lightwood)
    for xx in [-w/2+.25,w/2-.25]:
        for yy in [-d/2+.16,d/2-.16]:box('table leg',(x+xx,y+yy,.4),(.13,.13,.8))
    for s in [-1,1]:
        box('bench top',(x,y+s*(d/2+.5),.46),(w,.34,.12),lightwood)
        for xx in [-w/2+.3,w/2-.3]:box('bench leg',(x+xx,y+s*(d/2+.5),.22),(.14,.22,.44))

def barrel(x,y):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.45,depth=.85,location=(x,y,.43));o=bpy.context.object;o.name='barrel';o.data.materials.append(lightwood)
    for z in [.18,.65]:
        bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=4,location=(x,y,z),major_radius=.45,minor_radius=.035);bpy.context.object.data.materials.append(wood)

def ground():
    slab('main inn floor',-12,12,-7,7)
    slab('west courtyard',-17,-12,-2.5,3.5,0,stone)
    for y in [-2.5,3.5]:rail('courtyard fence',(-17,y,0),(-12,y,0))
    rail('courtyard west',(-17,-2.5,0),(-17,3.5,0))
    wall('north wall',-12,12,7,0,3.25)
    for x in [-12,-6,0,6,12]:beam('north timber post',(x,6.85,0),(x,6.85,3.25),.2)
    beam('north head',(-12,6.85,3.25),(12,6.85,3.25),.2)
    east_wall()
    # Kitchen enclosure and the door into the main room.
    for a,b in [(-12,-10),(-8,-5)]:wall('kitchen front',a,b,3,0,3.1)
    wall('kitchen door head',-10,-8,3,2.5,3.1)
    for x in [-10,-8]:beam('kitchen door post',(x,2.86,0),(x,2.86,2.6),.14)
    beam('kitchen lintel',(-10,2.86,2.6),(-8,2.86,2.6),.16)
    box('kitchen side',(-5,5,1.55),(.18,4,3.1),plaster)
    table(-8.4,5.1,2,1)
    box('kitchen hearth',(-10.6,6.4,.8),(1.7,1.2,1.6),stone)
    box('kitchen hearth opening',(-10.6,5.77,.65),(1.1,.04,1),dark)
    # The west passage is actually on the same floor; its frame follows the wall plane.
    for y in [-1.2,1.2]:beam('courtyard door jamb',(-12,y,0),(-12,y,2.6),.16)
    beam('courtyard door lintel',(-12,-1.2,2.6),(-12,1.2,2.6),.16)
    # Low cut faces make the visible floor edges unambiguous.
    for a,b in [(-12,-1.3),(1.3,12)]:wall('south cut wall',a,b,-7,0,.35,stone)
    box('west cut wall',(-12,-3.95,.175),(.2,5.7,.35),stone)
    box('bar body',(1.1,4.0,.48),(9.7,.82,.96),wood)
    box('bar top',(1.1,3.95,1.03),(10,.98,.16),lightwood)
    for x in [-3,-1,1,3,5]:box('bar panel',(x,3.57,.48),(1.7,.06,.72),lightwood)
    for z in [1.7,2.55]:box('bar shelf',(1.1,6.55,z),(7,.5,.12),lightwood)
    barrel(-1,5.5);barrel(.1,5.5)
    for args in [(-7,-3.8,3.2,1.2),(4.4,-3.8,3.2,1.2),(-6.4,.15,2.8,1.1),(3.5,.15,2.8,1.1)]:table(*args)
    box('main hearth',(11.1,-3,1.1),(1.8,2.1,2.2),stone)
    box('main hearth opening',(10.18,-3,.8),(.04,1.5,1.4),dark)
    stairs()

def upper():
    # A corridor cutaway: rooms beyond the closed doors are implied, not displayed as a cell grid.
    slab('corridor',-12,12,-2.2,2.2)
    slab('east landing west',7.5,8,2.2,7)
    slab('east landing east',11.5,12,2.2,7)
    slab('east landing back',8,11.5,6.2,7)
    # Entrance to the stairwell stays at its southern end, aligned with the lower floor arrival.
    door_wall('north guest partition',-12,7.5,2.2,[(-10.5,1.3),(-7.2,1.3),(-3.9,1.3),(-.6,1.3),(2.7,1.3),(6,1.3)])
    for x in [-12,-8.85,-5.55,-2.25,1.05,4.35,7.5]:beam('guest partition post',(x,2.08,0),(x,2.08,3.25),.18)
    # Continuous low cut wall: all six room doors are on the far wall only.
    wall('south section partition',-12,12,-2.2,0,.45)
    box('east corridor wall',(12,.0,1.625),(.18,4.4,3.25),plaster)
    box('east landing wall',(12,4.6,1.625),(.18,4.8,3.25),plaster)
    beam('east head',(12,-2.2,3.25),(12,7,3.25),.18)
    wall('landing north wall',7.5,12,7,0,3.25)
    box('linen cupboard',(6.5,.85,.75),(1.3,.65,1.5),lightwood)
    stairs(upper=True)

scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False
scene.render.resolution_x=1600;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(.75,.69,.58)
scene.view_settings.view_transform='Standard'
scene.view_settings.look='Medium High Contrast' if 'Medium High Contrast' in [x.name for x in scene.view_settings.bl_rna.properties['look'].enum_items] else 'None'
scene.view_settings.exposure=0;scene.view_settings.gamma=1
bpy.ops.object.light_add(type='AREA',location=(-10,-15,28));light=bpy.context.object;light.data.energy=2200;light.data.shape='DISK';light.data.size=20
bpy.ops.object.camera_add(location=(-26,-35,29));cam=bpy.context.object;direction=Vector((-1,0,1.0))-cam.location;cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=39;scene.camera=cam
scene.render.use_freestyle=True
line=scene.view_layers[0].freestyle_settings.linesets[0].linestyle;line.color=(.22,.13,.065);line.thickness=.8
base_objs=set(scene.objects)
for level,builder in [('upper-six',upper)]:
    builder()
    scene.render.filepath=str(OUT/('axon-'+level+'.png'))
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/('axon-'+level+'.blend')))
    bpy.ops.render.render(write_still=True)
    for o in list(scene.objects):
        if o not in base_objs:bpy.data.objects.remove(o,do_unlink=True)
