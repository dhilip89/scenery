// Copyright 2013-2015, University of Colorado Boulder

/**
 * Displays mouse and touch areas when they are customized. Expensive to display!
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Shape = require( 'KITE/Shape' );

  var scenery = require( 'SCENERY/scenery' );
  require( 'SCENERY/util/Trail' );

  function PointerAreaOverlay( display, rootNode ) {
    this.display = display;
    this.rootNode = rootNode;

    var svg = this.svg = document.createElementNS( scenery.svgns, 'svg' );
    svg.style.position = 'absolute';
    svg.setAttribute( 'class', 'mouseTouchAreaOverlay' );
    svg.style.top = 0;
    svg.style.left = 0;
    svg.style[ 'pointer-events' ] = 'none';

    function resize( width, height ) {
      svg.setAttribute( 'width', width );
      svg.setAttribute( 'height', height );
      svg.style.clip = 'rect(0px,' + width + 'px,' + height + 'px,0px)';
    }

    display.onStatic( 'displaySize', function( dimension ) {
      resize( dimension.width, dimension.height );
    } );
    resize( display.width, display.height );

    this.domElement = svg;
  }

  scenery.register( 'PointerAreaOverlay', PointerAreaOverlay );

  inherit( Object, PointerAreaOverlay, {
    addShape: function( shape, color, isOffset ) {
      var path = document.createElementNS( scenery.svgns, 'path' );
      var svgPath = shape.getSVGPath();

      // temporary workaround for https://bugs.webkit.org/show_bug.cgi?id=78980
      // and http://code.google.com/p/chromium/issues/detail?id=231626 where even removing
      // the attribute can cause this bug
      if ( !svgPath ) { svgPath = 'M0 0'; }

      if ( svgPath ) {
        // only set the SVG path if it's not the empty string
        path.setAttribute( 'd', svgPath );
      }
      else if ( path.hasAttribute( 'd' ) ) {
        path.removeAttribute( 'd' );
      }

      path.setAttribute( 'style', 'fill: none; stroke: ' + color + '; stroke-dasharray: 5, 3; stroke-dashoffset: ' + ( isOffset ? 5 : 0 ) + '; stroke-width: 3;' );
      this.svg.appendChild( path );
    },

    update: function() {
      var that = this;
      var svg = this.svg;
      var rootNode = this.rootNode;

      while ( svg.childNodes.length ) {
        svg.removeChild( svg.childNodes[ svg.childNodes.length - 1 ] );
      }

      new scenery.Trail( rootNode ).eachTrailUnder( function( trail ) {
        var node = trail.lastNode();
        if ( !node.isVisible() ) {
          // skip this subtree if the node is invisible
          return true;
        }
        if ( ( node.mouseArea || node.touchArea ) && trail.isVisible() ) {
          var transform = trail.getTransform();

          if ( node.mouseArea ) {
            that.addShape( transform.transformShape( node.mouseArea.isBounds ? Shape.bounds( node.mouseArea ) : node.mouseArea ), 'rgba(0,0,255,0.8)', true );
          }
          if ( node.touchArea ) {
            that.addShape( transform.transformShape( node.touchArea.isBounds ? Shape.bounds( node.touchArea ) : node.touchArea ), 'rgba(255,0,0,0.8)', false );
          }
        }
      } );
    },

    dispose: function() {

    }
  } );

  return PointerAreaOverlay;
} );
