/**
 * Scrolly.js v1.0.0
 *   - jQuery sidebar plugin
 * (c) 2014 Nathan Johnson <mail@njohnson.ms>
 * Copyright 2014 All Rights Reserved
 */


/*
 *** Add semicolon before anon function. fucking jshint gets mad and it's annoying
 */

var qqq, extoff; //Delete these 
(function($, window, document, undefined) {

    var $window = $(window);

    var opts = { //Delete unles we need options
        propertyName: "value"
    };

    function Section(element, staticAbove, staticBelow) {
        qqq = element.get(0); //Delete
        this.element = element.get(0);
        this.staticAbove = staticAbove;
        this.staticBelow = staticBelow;
        this._top = this.element.offsetTop; /* Only accurate with no HTML changes. Need to make update method */
        this._bottom = this._top + this.element.offsetHeight;
    }

    Section.prototype.update = function() {
        console.log('udpate'.this._top);
        this._top = this.element.offsetTop;
    };

    function Scrolly(element, options) {
        this.element = element;
        this.settings = $.extend({}, opts, options);

        d = this.init(); // All
    }

    /**
     * DELETE object references should be relative to $sidebar in order to support multiple sidebars on a single page.
     */
    Scrolly.prototype.init = function() {
        this.$sidebar = $(this.element);
        this.$scrollPane = this.$sidebar.find('.scroll-pane');
        this.$sections = this.$scrollPane.find('.section');

        this.visibleHeight = $window.height(); //Initial viewport height. Updates on window resize
        this.headerHeight = this.$sections.find('h3').innerHeight();

        //Create New Div For Static Headers
        this.$sidebar.prepend('<div class="section-headers above"></div>');
        this.$sidebar.append('<div class="section-headers below"></div>');

        var headerContainer = this.$sidebar.children('.section-headers.above'),
            footerContainer = this.$sidebar.children('.section-headers.below');

        //Ideally should load new DOM elements to an array and append all at once
        this.sectionList = this.$sections.map(function(index, element) {
            var staticHeaderAbove = $(this)
                .children('h3')
                .clone()
                .addClass('hidden')
                .attr('id', 'scrolly-pos-' + (index));
            var staticHeaderBelow = staticHeaderAbove.clone();

            headerContainer.append(staticHeaderAbove);
            footerContainer.append(staticHeaderBelow);

            return new Section($(this), staticHeaderAbove, staticHeaderBelow);
        }).get();

        //Absolute div resized to prevent overlapping the scrollbar
        this.$sidebar.children('.section-headers').width(this.$sections.width());

        this.addListeners();

        this.onScroll(); //Simulate scroll event to complete setup - sets the correct headers to be visible

        extoff = this.offsetTracker; //DELETE
        return this;
    };

    Scrolly.prototype.onScroll = function(scrollEvent) {
        var self = this;
        var scrollPos = this.$scrollPane.scrollTop();

        self.sectionList.forEach(function(ele) {
            var deltaPostion = ele._top - scrollPos;

            var offsetAbove = self.offsetTracker.getOffset('above') * self.headerHeight,
                offsetBelow = self.offsetTracker.getOffset('below') * self.headerHeight;

            console.log({
                delta: deltaPostion,
                above: offsetAbove,
                below: offsetBelow
            });
            console.log(ele.element.className, 'snaptop', ele._top, scrollPos, deltaPostion, offsetAbove);
            if (deltaPostion <= (offsetAbove + 1)) { //Snap-top
                self.toggleSnap(true, ele.staticAbove, 'above');

            } else if (deltaPostion > (self.visibleHeight - offsetBelow)) { //Snap-bottom
                self.toggleSnap(true, ele.staticBelow, 'below');

            } else { // Visible
                self.toggleSnap(false, ele.staticBelow, 'below');
                self.toggleSnap(false, ele.staticAbove, 'above');
            }
        });
    };

    Scrolly.prototype.addListeners = function() {
        var self = this;

        //1.) Scroll
        this.$scrollPane.scroll(function(e) {
            return self.onScroll(e);
        });

        //2.) Window Resize
        $window.resize(function() {
            self.updateWindowHeight($window.height());
        });

        //3.) Clickable headers - all h3 elements within the div plugin executed on
        this.$sidebar.find('h3').click(function(e) {
            var clickedElement = $(this),
                parent = clickedElement.parent();

            if (parent.is('.section')) {
                console.log(clickedElement);
                self.scrollTo(e.target.offsetTop);
            } else if (parent.is('.section-headers.above')) {

            } else if (parent.is('.section-headers.below')) {
                var sectionID = parseInt(clickedElement.get(0).id.replace('scrolly-pos-', ''), 10);
                self.scrollTo(self.$sections[sectionID].offsetTop);
                /*console.log(sectionID);*/
            }
        });

        //4.) Pipe scroll wheel actions to .scroll-pane when hovering an absolute header section
        //      - If not your scrolling is stolen by the absolute block
        //      - CSS pointer-events: none would do this too, but it also would prevent clicks,
        //        and you could click on what is underneath without realizing it
        this.$sidebar.find('.section-headers').bind('mousewheel DOMMouseScroll', function(e) {
            console.log(e);
            e.preventDefault();
            var scrollTo;
            if (e.type == 'mousewheel') {
                scrollTo = (e.originalEvent.wheelDelta * -1);
            } else if (e.type == 'DOMMouseScroll') {
                scrollTo = 40 * e.originalEvent.detail;
            }

            self.$scrollPane.scrollTop(scrollTo + self.$scrollPane.scrollTop());
        });

        //5.) Watch the sidebar for any DOM changes which may effect the height - then
        //    recalculate absolute positions
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var myObserver = new MutationObserver(mutationHandler);

        //--- Add a target node to the observer. Can only add one node at a time.
        this.$scrollPane.each(function() {
            myObserver.observe(this, {
                childList: true,
                characterData: true,
                attributes: true,
                subtree: true
            });
        });

        function mutationHandler(mutationRecords) {
            console.info("mutationHandler:");

            mutationRecords.forEach(function(mutation) {
                if (typeof mutation.removedNodes === "object") {
                    /*var jq = $(mutation.removedNodes);
                        If necessary, we could check the make sure the height was actually affected.
                    */
                    self.sectionList.forEach(function(ele) {
                        ele.update();
                    });
                }
            });
        }
    };

    Scrolly.prototype.toggleSnap = function(snapOn, element, tag) {
        var start = !element.hasClass('hidden'); // Inverse because toggle on = hidden off

        if (snapOn !== start) { //New snap event
            element.toggleClass('hidden');
            this.offsetTracker.modify(tag, snapOn);
            /*console.log('offset test:', tag, this.offsetTracker.getOffset(tag));*/

        } else {
            //Ignore
        }
    };

    /**
     * Tracks how many headers are locked on top and on bottom without
     * having to search the DOM for it - rather it is called when a
     * header is locked.
     * @type {Object}
     */
    Scrolly.prototype.offsetTracker = {
        modify: function(tag, add) {
            if (typeof this._offset[tag] === 'undefined') {
                this._offset[tag] = 0;
            }

            if (add) {
                this._offset[tag]++;
            } else {
                this._offset[tag]--;
            }
        },
        getOffset: function(tag) {
            if (typeof this._offset[tag] === 'undefined') {
                this._offset[tag] = 0;
            }
            console.log(tag, this._offset[tag]);
            return this._offset[tag];
        },
        _offset: {}
    };

    Scrolly.prototype.scrollTo = function(position) {
        var self = this;

        var ss = position - (this.offsetTracker.getOffset('above') * this.headerHeight);
        console.log(position, ss, this.offsetTracker.getOffset('above'));

        this.$scrollPane
            .animate({
                scrollTop: ss,
                duration: 3000,
                step: function() {

                }
            })
            .promise()
            .done(function() {});
    };

    Scrolly.prototype.updateWindowHeight = function(newHeight) {
        this.visibleHeight = newHeight;
    };

    $.fn.Scrolly = function(options) {
        this.each(function() {
            if (!$.data(this, 'Scrolly')) {
                $.data(this, 'Scrolly', new Scrolly(this, options));
            }
        });

        return this;
    };

})(jQuery, window, document);

var x, d;
$(document).ready(function() {
    x = $('#sidebar').Scrolly();
});
