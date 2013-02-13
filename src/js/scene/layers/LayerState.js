// Copyright 2002-2012, University of Colorado

var scenery = scenery || {};

(function(){
  scenery.LayerState = function() {
    this.preferredLayerTypes = [];
    
    this.typeDirty = true;
    this.nextLayerType = null;
  }
  
  var LayerState = scenery.LayerState;
  LayerState.prototype = {
    constructor: LayerState,
    
    pushPreferredLayerType: function( layerType ) {
      this.preferredLayerTypes.push( layerType );
    },
    
    popPreferredLayerType: function( layerType ) {
      this.preferredLayerTypes.pop();
    },
    
    getPreferredLayerType: function() {
      if ( this.preferredLayerTypes.length !== 0 ) {
        return this.preferredLayerTypes[this.preferredLayerTypes.length - 1];
      } else {
        return null;
      }
    },
    
    switchToType: function( layerType ) {
      this.typeDirty = true;
      this.nextLayerType = layerType;
    },
    
    // called so that we can finalize a layer switch (instead of collapsing unneeded layers)
    markSelf: function() {
      if ( this.typeDirty ) {
        this.layerChange();
      }
    },
    
    getCurrentLayerType: function() {
      return this.nextLayerType;
    },
    
    bestPreferredLayerTypeFor: function( defaultTypeOptions ) {
      for ( var i = this.preferredLayerTypes.length - 1; i >= 0; i-- ) {
        var preferredType = this.preferredLayerTypes[i];
        if ( _.some( defaultTypeOptions, function( defaultType ) { return preferredType.supports( defaultType ); } ) ) {
          return preferredType;
        }
      }
      
      // none of our stored preferred layer types are able to support any of the default type options
      return null;
    },
    
    layerChange: function() {
      throw new Error( 'not implemented: create and hook up layers, and we need to handle layer metadata' );
    }
  };
})();
