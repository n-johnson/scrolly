Scrolly.js
==========

A jQuery plugin for making scrollable containers with headers that snap into place.

###############
### Picture ###
###############

## Usage

Include `scrolly.js` and `scrolly.css` in your project.

Run the initalization method once the DOM is ready.

``` javascript
    $(document).ready(function() {
        $('#sidebar').Scrolly();
    });
```

#### HTML Structure

``` HTML
  <div id="sidebar">
      <div class="scroll-pane">
          <div class="section">
              <h3>Section 1</h3>
              <div class="body">
                  <p>Body text</p>
              </div>
          </div>
          <div class="section">
              <h3>Section 2</h3>
              <div class="body">
                  <p>Body text</p>
              </div>
          </div>          
      </div>
  </div>  
```

- `div#sidebar` is the main container. It can be given any name - it is the element Scrolly should be loaded onto.
  - `div.scroll-pane` should be the only child of the primary container. Scrolly will build additional siblings surrounding it.
    - `div.section` - Where your data begins.
	  - `h3` - Header
	  - `div.body` - main content

This skeleton structure is required - within body you are able to do whatever you would like.

[In a future release this will be simplified scroll-pane could be automatically added by the plugin to simplify the base javascript.]

## Options

Plugin options can be set when the plugin is initialized by including an object as the function's argument.

``` javascript
$('#example').Scrolly({
    options: ...
});
```
#### The Options

`scrollTime` - How long (in milliseconds) the jQuery animation will take to scroll when a link is clicked. (DEFAULT = 750ms)