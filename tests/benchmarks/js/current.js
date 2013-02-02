
(function(){
    
    var main = $( '#main' );
    
    sceneBench( 'Fast On Current', function( deferred ) {
        deferred.resolve();
    } );
    
    sceneBench( 'canvas creation', function( deferred ) {
        var canvas = document.createElement( 'canvas' );
        deferred.resolve();
    } );
    
    sceneBench( 'canvas/context creation', function( deferred ) {
        var canvas = document.createElement( 'canvas' );
        var context = phet.canvas.initCanvas( canvas );
        deferred.resolve();
    } );
})();
