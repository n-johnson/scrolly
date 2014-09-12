Scrolly.js
==========

A jQuery plugin for making scrollable containers with headers that snap into place - and is entirely free of dependencies, besides jQuery of course.

###############
### Picture ###
###############

## Features
 - Headers snap into place when they reach the top or bottom of screen instead of disappearing.
 - They then can be clicked on to bring their content back into focus.
 - Uses a MutationObserver to notify of DOM changes and readjusts absolute positioning afterwards.
 - Exthensible. Well-commented code makes modification easy. I tried to use design patterns which wouldn't restrict future changes - large of small

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
              <h3 class="content-header">Section 1</h3>
              <div class="body">
                  <p>Body text</p>
              </div>
          </div>
          <div class="section">
              <h3 class="content-header">Section 2</h3>
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
	  - `h3.content-header` - Header
	  - `div.body` - main content

This skeleton structure is required - within `div.body` you are able to do whatever you would like.

[In a future release this will be simplified scroll-pane could be automatically added by the plugin to simplify the base javascript.]

## Browser Compatibility

Tested in latest Firefox and Chrome. Safari *should* work but I can't test it.

IE11 is required for it to work 100% out of the box. Previous versions will work too, with the limit that it won't handle dynamically modified content. A polyfill exists to support IE9. Earlier compatibility is possible by writing a fallback that doesn't use "modern" methods to watch for DOM changes.

## Options

Plugin options can be set when the plugin is initialized by including an object as the function's argument.

``` javascript
$('#example').Scrolly({
    options: ...
});
```
#### The Options

`scrollTime` - How long (in milliseconds) the jQuery animation will take to scroll when a link is clicked. (DEFAULT = 750ms)

## Known issues

- Doesn't play 100% nice with pageUp/pageDown, it pages too much content at once to be useful.
  - Bind the keypress event and intercept those keys. Instead move up or down just one section of content.
- Pressing the Home key from the bottom results in the list being displayed out of order. Scrolling through corrects in automatically. I haven't looked into why this occurs.
- Small issue with appending elements. It works fine everywhere except the final section OUTSIDE of div.body. The height for the final section is calculated from the body.
  - To fix just change it to calculate the height from all children - :after won't be a child.
- Final div won't reopen after it closes (from a click, scrolling it works normal)
  - Instead of treating the final section special everywhere, let's just add an additional - hidden - section that simply serves as a reference point for where the final section ends. This will fix the issue with appending elements outside of the body class of the final section as well.
