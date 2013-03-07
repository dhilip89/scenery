// Copyright 2002-2012, University of Colorado

/**
 * Cubic Bezier segment.
 *
 * See http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf for info
 *
 * @author Jonathan Olson <olsonsjc@gmail.com>
 */

define( function( require ) {
  "use strict";
  
  var assert = require( 'ASSERT/assert' )( 'scenery' );

  var scenery = require( 'SCENERY/scenery' );
  
  var Bounds2 = require( 'DOT/Bounds2' );
  var Vector2 = require( 'DOT/Vector2' );
  
  var Segment = require( 'SCENERY/shapes/segments/Segment' );
  var Piece = require( 'SCENERY/shapes/pieces/Piece' );

  Segment.Cubic = function( start, control1, control2, end, skipComputations ) {
    this.start = start;
    this.control1 = control1;
    this.control2 = control2;
    this.end = end;
    
    // allows us to skip unnecessary computation in the subdivision steps
    if ( skipComputations ) {
      return;
    }
    
    this.startTangent = this.tangentAt( 0 ).normalized();
    this.endTangent = this.tangentAt( 1 ).normalized();
    
    if ( start.equals( end, 0 ) && start.equals( control1, 0 ) && start.equals( control2, 0 ) ) {
      this.invalid = true;
      return;
    }
    
    // from http://www.cis.usouthal.edu/~hain/general/Publications/Bezier/BezierFlattening.pdf
    this.r = control1.minus( start ).normalized();
    this.s = this.r.perpendicular();
    
    var a = start.times( -1 ).plus( control1.times( 3 ) ).plus( control2.times( -3 ) ).plus( end );
    var b = start.times( 3 ).plus( control1.times( -6 ) ).plus( control2.times( 3 ) );
    var c = start.times( -3 ).plus( control1.times( 3 ) );
    var d = start;
    
    var aPerp = a.perpendicular();
    var bPerp = b.perpendicular();
    var aPerpDotB = aPerp.dot( b );
    
    this.tCusp = -0.5 * ( aPerp.dot( c ) / aPerpDotB );
    this.tDeterminant = this.tCusp * this.tCusp - ( 1 / 3 ) * ( bPerp.dot( c ) / aPerpDotB );
    if ( this.tDeterminant >= 0 ) {
      var sqrtDet = Math.sqrt( this.tDeterminant );
      this.tInflection1 = this.tCusp - sqrtDet;
      this.tInflection2 = this.tCusp + sqrtDet;
    }
    
    this.bounds = Bounds2.NOTHING;
    this.bounds = this.bounds.withPoint( this.start );
    this.bounds = this.bounds.withPoint( this.end );
    
  };
  Segment.Cubic.prototype = {
    // position: (1 - t)^3*start + 3*(1 - t)^2*t*control1 + 3*(1 - t) t^2*control2 + t^3*end
    positionAt: function( t ) {
      var mt = 1 - t;
      return this.start.times( mt * mt * mt ).plus( this.control1.times( 3 * mt * mt * t ) ).plus( this.control2.times( 3 * mt * t * t ) ).plus( this.end.times( t * t * t ) );
    },
    
    // derivative: -3 p0 (1 - t)^2 + 3 p1 (1 - t)^2 - 6 p1 (1 - t) t + 6 p2 (1 - t) t - 3 p2 t^2 + 3 p3 t^2
    tangentAt: function( t ) {
      var mt = 1 - t;
      return this.start.times( -3 * mt * mt ).plus( this.control1.times( 3 * mt * mt - 6 * mt * t ) ).plus( this.control2.times( 6 * mt * t - 3 * t * t ) ).plus( this.end.times( t * t ) );
    },
    
    toRS: function( point ) {
      var firstVector = point.minus( this.start );
      return new Vector2( firstVector.dot( this.r ), firstVector.dot( this.s ) );
    },
    
    subdivided: function( skipComputations ) {
      // de Casteljau method
      // TODO: add a 'bisect' or 'between' method for vectors?
      var left = this.start.plus( this.control1 ).times( 0.5 );
      var right = this.control2.plus( this.end ).times( 0.5 );
      var middle = this.control1.plus( this.control2 ).times( 0.5 );
      var leftMid = left.plus( middle ).times( 0.5 );
      var rightMid = middle.plus( right ).times( 0.5 );
      var mid = leftMid.plus( rightMid ).times( 0.5 );
      return [
        new Segment.Cubic( this.start, left, leftMid, mid, skipComputations ),
        new Segment.Cubic( mid, rightMid, right, this.end, skipComputations )
      ];
    },
  };
  
  return Segment.Cubic;
} );
