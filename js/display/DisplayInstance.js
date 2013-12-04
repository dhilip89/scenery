// Copyright 2002-2013, University of Colorado

/**
 * An instance that is specific to the display (not necessarily a global instance, could be in a Canvas cache, etc),
 * that is needed to tracking instance-specific display information, and signals to the display system when other
 * changes are necessary.
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define( function( require ) {
  'use strict';
  
  var inherit = require( 'PHET_CORE/inherit' );
  var scenery = require( 'SCENERY/scenery' );
  
  var globalIdCounter = 1;
  
  scenery.DisplayInstance = function DisplayInstance( trail ) {
    this.id = globalIdCounter++;
    this.trail = trail;
    this.parent = null; // will be set as needed
    this.children = [];
    this.childrenTracks = []; // TODO use this for tracking what children changes occurred, and thus where we need to stitch
    
    this.state = null; // filled in with rendering state later
    
    this.selfDrawable = null;
    this.groupDrawable = null; // e.g. backbone or non-shared cache
    this.sharedCacheDrawable = null;
    
    // references into the linked list of drawables (null if nothing is drawable under this)
    this.firstDrawable = null;
    this.lastDrawable = null;
  };
  var DisplayInstance = scenery.DisplayInstance;
  
  inherit( Object, DisplayInstance, {
    appendInstance: function( instance ) {
      this.children.push( instance );
    }
  } );
  
  return DisplayInstance;
} );
