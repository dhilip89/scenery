// Copyright 2002-2013, University of Colorado

/**
 * Module that includes all Scenery dependencies, so that requiring this module will return an object
 * that consists of the entire exported 'scenery' namespace API.
 *
 * The API is actually generated by the 'scenery' module, so if this module (or all other modules) are
 * not included, the 'scenery' namespace may not be complete.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define( [
  'SCENERY/scenery',
  'SCENERY/debug/DebugContext',

  'SCENERY/display/BackboneBlock',
  'SCENERY/display/Block',
  'SCENERY/display/Display',
  'SCENERY/display/DisplayInstance',
  'SCENERY/display/RenderState',

  'SCENERY/input/ButtonListener',
  'SCENERY/input/DownUpListener',
  'SCENERY/input/Event',
  'SCENERY/input/Input',
  'SCENERY/input/Key',
  'SCENERY/input/Mouse',
  'SCENERY/input/Pen',
  'SCENERY/input/Pointer',
  'SCENERY/input/SimpleDragHandler',
  'SCENERY/input/Touch',

  'SCENERY/layers/CanvasLayer',
  'SCENERY/layers/DOMLayer',
  'SCENERY/layers/Layer',
  'SCENERY/layers/LayerBoundary',
  'SCENERY/layers/LayerBuilder',
  'SCENERY/layers/LayerStrategy',
  'SCENERY/layers/LayerType',
  'SCENERY/layers/Renderer',
  'SCENERY/layers/SVGLayer',
  'SCENERY/layers/WebGLLayer',

  'SCENERY/nodes/CanvasNode',
  'SCENERY/nodes/Circle',
  'SCENERY/nodes/DOM',
  'SCENERY/nodes/Fillable',
  'SCENERY/nodes/HBox',
  'SCENERY/nodes/HTMLText',
  'SCENERY/nodes/Image',
  'SCENERY/nodes/LayoutBox',
  'SCENERY/nodes/LayoutNode',
  'SCENERY/nodes/Line',
  'SCENERY/nodes/Node',
  'SCENERY/nodes/Path',
  'SCENERY/nodes/Plane',
  'SCENERY/nodes/Rectangle',
  'SCENERY/nodes/Strokable',
  'SCENERY/nodes/Text',
  'SCENERY/nodes/VBox',

  'SCENERY/nodes/drawables/ImageWebGLDrawable',
  'SCENERY/nodes/drawables/RectangleWebGLDrawable',
  'SCENERY/nodes/drawables/WebGLNodeDrawable',

  'SCENERY/overlays/PointerOverlay',

  'SCENERY/util/AccessibilityPeer',
  'SCENERY/util/CanvasContextWrapper',
  'SCENERY/util/Color',
  'SCENERY/util/Features',
  'SCENERY/util/FixedNodeEvents',
  'SCENERY/util/Font',
  'SCENERY/util/Gradient',
  'SCENERY/util/LinearGradient',
  'SCENERY/util/LiveRegion',
  'SCENERY/util/Instance',
  'SCENERY/util/Pattern',
  'SCENERY/util/RadialGradient',
  'SCENERY/util/RenderInterval',
  'SCENERY/util/SceneImage',
  'SCENERY/util/SceneryStyle',
  'SCENERY/util/ShaderProgram',
  'SCENERY/util/Trail',
  'SCENERY/util/TrailPointer',
  'SCENERY/util/Util',

  'SCENERY/Scene'
], function( scenery // note: we don't need any of the other parts, we just need to specify them as dependencies so they fill in the scenery namespace
  ) {
  'use strict';

  return scenery;
} );
