// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jesse Greenberg
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );

  var DATA_VISITED = 'data-visited';
  var DATA_VISITED_LINEAR = 'data-visited-linear';

  function VirtualCursor() {

    /**
     * Get the accessible text for this element.  An element will have accessible text if it contains
     * accessible markup, of is one of many defined elements that implicitly have accessible text.
     *
     * @param  {DOMElement} element searching through
     * @return {string}
     */
    var getAccessibleText = function( element ) {

      // filter out structural elements that do not have accessible text
      if ( element.getAttribute( 'class' ) === 'ScreenView' ) {
        return null;
      }
      if ( element.getAttribute( 'aria-hidden' ) ) {
        return null;
      }
      if ( element.hidden ) {
        return null;
      }

      // search for accessibility mark up in the pararllel DOM, these elements have accessible text
      if ( element.getAttribute( 'aria-labelledby' ) ) {
        var labelElement = document.getElementById( element.getAttribute( 'aria-labelledby' ) );
        if ( !labelElement ) {
          console.log( 'Missing labelled element with aria-labelledby id' );
          return null;
        }
        return labelElement.textContent;
      }
      if ( element.getAttribute( 'aria-describedby' ) ) {
        var descriptionElement = document.getElementById( element.getAttribute( 'aria-describedby' ) );
        if ( !descriptionElement ) {
          console.log( 'Missing labelled element with aria-describedby id' );
          return null;
        }
        return descriptionElement.textContent;
      }
      if ( element.tagName === 'P' ) {
        return element.textContent;
      }
      if ( element.tagName === 'H2' ) {
        return 'heading level 2 ' + element.textContent;
      }
      if ( element.tagName === 'H3' ) {
        return 'heading level 3 ' + element.textContent;
      }
      if ( element.tagName === 'BUTTON' ) {
        return element.textContent + ' button';
      }
      if ( element.tagName === 'INPUT' ) {
        if ( element.type === 'reset' ) {
          return element.getAttribute( 'value' );
        }
        if ( element.type === 'checkbox' ) {
          var checkedString = element.checked ? ' checked' : ' not checked';
          return element.textContent + ' checkbox' + checkedString;
        }
      }


      // search for elements in the parallel DOM that will have implicit accessible text without markup

      return null;
    };

    var clearVisited = function( element, visitedFlag ) {
      element.removeAttribute( visitedFlag );
      for ( var i = 0; i < element.children.length; i++ ) {
        clearVisited( element.children[ i ], visitedFlag );
      }
    };

    /**
     * Go to next element in the parallel DOM that has accessible text content.  If an element has
     * text content, it is returned.  Otherwise,
     * @param {DOMElement} element
     * @return {string} visitedFlag - a flag for which 'data-*' attribute to set as we search through the tree
     */
    var goToNextItem = function( element, visitedFlag ) {
      if ( getAccessibleText( element ) ) {
        if ( !element.getAttribute( visitedFlag ) ) {
          element.setAttribute( visitedFlag, true );
          return element;
        }
      }
      for ( var i = 0; i < element.children.length; i++ ) {
        var nextElement = goToNextItem( element.children[ i ], visitedFlag );

        if ( nextElement ) {
          return nextElement;
        }
      }
    };


    /**
     * Get a 'linear' representation of the DOM, collapsing the accessibility tree into an array that
     * can be traversed.
     *
     * @param {DOMElement} element
     * @return {array<DOMElement>} linearDOM
     */
    var getLinearDOM = function( element ) {

      clearVisited( element, DATA_VISITED_LINEAR );

      var linearDOM = [];

      var nextElement = goToNextItem( element, DATA_VISITED_LINEAR );
      while ( nextElement ) {
        linearDOM.push( nextElement );
        nextElement = goToNextItem( element, DATA_VISITED_LINEAR );
      }

      return linearDOM;
    };

    // if the user presses right or down, move the cursor to the next dom element with accessibility markup
    // It will be difficult to synchronize the virtual cursor with tab navigation so we are not implementing
    // this for now.
    document.addEventListener( 'keydown', function( k ) {
      var selectedElement = null;
      var accessibilityDOMElement = document.body.getElementsByClassName( 'accessibility' )[ 0 ];
      if ( k.keyCode === 39 || k.keyCode === 40 ) {

        selectedElement = goToNextItem( accessibilityDOMElement, DATA_VISITED );

        if ( !selectedElement ) {
          clearVisited( accessibilityDOMElement, DATA_VISITED );
          selectedElement = goToNextItem( accessibilityDOMElement, DATA_VISITED );
        }
      }

      // title h2 longtext somethingElse
      // visited visited visited not-visited
      //
      else if ( k.keyCode === 37 || k.keyCode === 38 ) {
        var listOfAccessibleElements = getLinearDOM( accessibilityDOMElement );

        var foundAccessibleText = false;
        for ( var i = listOfAccessibleElements.length - 1; i >= 0; i-- ) {
          if ( listOfAccessibleElements[ i ].getAttribute( DATA_VISITED ) ) {
            listOfAccessibleElements[ i ].removeAttribute( DATA_VISITED );

            if ( i !== 0 ) {
              selectedElement = listOfAccessibleElements[ i - 1 ];
              foundAccessibleText = true;
            }
            else {
              selectedElement = null;
              foundAccessibleText = false;
            }

            break;
          }
        }

        // Wrap backwards, going from the end of the linearized DOM
        if ( !foundAccessibleText ) {
          selectedElement = listOfAccessibleElements[ listOfAccessibleElements.length - 1 ];

          for ( i = 0; i < listOfAccessibleElements.length - 1; i++ ) {
            listOfAccessibleElements[ i ].setAttribute( DATA_VISITED, true );
          }
        }
      }

      if ( selectedElement ) {
        if ( selectedElement.getAttribute( 'tabindex' ) || selectedElement.tagName === 'BUTTON' ) {
          selectedElement.focus();
        }

        var accessibleText = getAccessibleText( selectedElement );
        parent && parent.updateAccessibilityReadoutText && parent.updateAccessibilityReadoutText( accessibleText );
      }
    } );

  }

  return inherit( Object, VirtualCursor, {} );
} );