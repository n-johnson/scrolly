/**
 * Scrolly.js v1.0.0
 *   - jQuery sidebar plugin
 * (c) 2014 Nathan Johnson <mail@njohnson.ms>
 * Copyright 2014 All Rights Reserved
 */

; //jsBeautifer won't leave it on the next line. Still serves it's purpose here.
(function($, window, document, undefined) {

    var $window = $(window);

    var opts = { //Defaults
        scrollTime: 750 // # ms the scrolling animation will take
    };

    function Scrolly(element, options) {
        this.element = element;
        this.settings = $.extend({}, opts, options);

        this.init();
    }
    /**
     * init - Called by plugin.
     */
    Scrolly.prototype.init = function() {
        //Cache these jQuery DOM calls - frequently used.
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

        this.sectionList = this.$sections.map(function(index, element) {
            var staticHeaderAbove = $(this)
                .children('h3')
                .attr('id', 'scrolly-pos-' + (index))
                .clone()
                .addClass('hidden');
            var staticHeaderBelow = staticHeaderAbove.clone();

            headerContainer.append(staticHeaderAbove);
            footerContainer.append(staticHeaderBelow);

            return new Section($(this), staticHeaderAbove, staticHeaderBelow);
        }).get();

        //Absolute div resized to prevent headers from overlapping the scrollbar
        this.$sidebar.children('.section-headers').width(this.$sections.width());

        this.addListeners();

        //Simulate scroll event to complete setup - sets the correct headers to be visible
        this.onScroll();
    };


    /**
     * onScroll - Bound to browser 'scroll' event.
     *   - For latest chrome + FF calling it every iteration shouldn't
     *     be a problem, but for compatibility with older browsers which
     *     may fire this event every single pixel scrolled, a rate limiting
     *     function is needed.
     * @param {Event} scrollEvent - Not used. May use in the future
     */
    Scrolly.prototype.onScroll = function(scrollEvent) {
        var self = this;

        var scrollPos = this.$scrollPane.scrollTop(),
            offsetAbove = self.offsetTracker.getOffset('above') * self.headerHeight,
            offsetBelow = self.offsetTracker.getOffset('below') * self.headerHeight;

        //Iterates over the sections and checks if they have scrolled off 
        //or scrolled back in.
        self.sectionList.forEach(function(ele) {
            var deltaPostion = ele._top - scrollPos;

            if (deltaPostion <= (offsetAbove)) { //Snap-top
                self.toggleSnap(true, ele.staticAbove, 'above');

            } else if (deltaPostion > (self.visibleHeight - offsetBelow)) { //Snap-bottom
                self.toggleSnap(true, ele.staticBelow, 'below');

            } else { // Visible
                self.toggleSnap(false, ele.staticBelow, 'below');
                self.toggleSnap(false, ele.staticAbove, 'above');
            }
        });
    };

    /**
     * toggleSnap - Snaps a section to the top/bottom when it is crossed by scrolling
     * @param  {boolean} snapOn - true -> snap || false -> un-snap
     * @param  {[Element]} element - jQuery element of the target section
     * @param  {[string]} tag - 'above' or 'below'
     */
    Scrolly.prototype.toggleSnap = function(snapOn, element, tag) {
        var start = !element.hasClass('hidden'); // Inverse because toggle on = hidden off

        if (snapOn !== start) { //New snap
            this.offsetTracker.modify(tag, snapOn);

            if (tag === 'above') { //The last & only last header snapped to the top should have the .opened class
                var offset = this.offsetTracker.getOffset('above');

                this.$sidebar.find('.above > h3:nth-child(' + offset + ')').addClass('opened');
                this.$sidebar.find('.above > h3:not(:nth-child(' + offset + '))').removeClass('opened');
            }
            //Toggle relevant classes for any new snap - above or below, add or remove.
            element.toggleClass('hidden');
            element.toggleClass('closed');
        }
    };

    /**
     * Wrapper where all event listeners are added. Called after plugin initialization
     */
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
        this.$sidebar.find('h3.content-header').click(function(e) {
            var clickedElement = $(this),
                parent = clickedElement.parent(),
                sectionID = parseInt(clickedElement.get(0).id.replace('scrolly-pos-', ''), 10),
                headerTotalAbove = 0,
                sectionOffset = 0;

            if ((sectionID + 1) === self.$sections.length) { //Last section, when snapped to the top
                sectionOffset = (self.$sections[sectionID].offsetTop);
                headerTotalAbove = ((sectionID) * self.headerHeight);
            } else {
                sectionOffset = (self.$sections[sectionID + 1].offsetTop); //This would throw an exception for the final section
                headerTotalAbove = ((sectionID + 1) * self.headerHeight);
            }

            if (parent.is('.section')) { // Visible & open -> only moves up
                return self.scrollTo(sectionOffset - headerTotalAbove);

            } else if (parent.is('.section-headers.above')) { //Scroll to section on all except the last one - which is hidden
                if (sectionID + 1 === self.offsetTracker.getOffset('above')) { // The last open element docked on top
                    return self.scrollTo(sectionOffset - headerTotalAbove);

                } else {
                    return self.scrollTo((self.$sections[sectionID].offsetTop) - (sectionID * self.headerHeight));
                }

            } else if (parent.is('.section-headers.below')) {
                /**
                 * Currently brings the div up to where bottom of expanded div is touching the bottom
                 *     - As opposed to sending it all the way to the top closing everything in between
                 *     - Potentially should determine which behavior is better based on screen size.
                 */
                var relativeOffset = self.$sections[sectionID].offsetTop,
                    sectionHeight = self.$sections.eq(sectionID).height();

                if ((sectionID + 1) === self.$sections.length) { //Ignoring the height of ::after
                    var extra = self.headerHeight + 16 + 16; //Missing from calc below. Header + margins
                    sectionHeight = self.$sections.eq(sectionID).children('.body').height() + extra;
                }
                console.log(relativeOffset, sectionHeight);
                return self.scrollTo(relativeOffset - (self.visibleHeight - sectionHeight));

            }
        });

        /* 4.) Pipe scroll wheel actions to .scroll-pane when hovering an absolute header section
             - If not your scrolling is stolen by the absolute block
             - CSS pointer-events: none would do this too, but it also would prevent clicks,
               and you could click on what is underneath without realizing it
           NOTE: This limits browswer compatibility, however this is not a primary function of 
                 the plugin and outside of scrolling on the header div itself, no functionality lost.*/
        this.$sidebar.find('.section-headers').bind('mousewheel DOMMouseScroll', function(e) {
            e.preventDefault();
            var targetPosition;
            if (e.type == 'mousewheel') {
                targetPosition = (e.originalEvent.wheelDelta * -1);
            } else if (e.type == 'DOMMouseScroll') {
                targetPosition = e.originalEvent.detail * 40;
            }

            return self.$scrollPane.scrollTop(targetPosition + self.$scrollPane.scrollTop());
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
                    /*var mutatedNodes = $(mutation.removedNodes);
                        If necessary, we could check the make sure the height was actually affected.
                    */
                    self.sectionList.forEach(function(ele) {
                        ele.update();
                    });
                }
            });
        }
    };

    /**
     * scrollTo - Wrapper for jQuery scrolling animation
     * @param  {integer} scrollTo - position to scroll to
     */
    Scrolly.prototype.scrollTo = function(scrollTo) {
        var self = this;

        this.$scrollPane
            .animate({
                scrollTop: scrollTo
            }, {
                duration: self.settings.scrollTime
            })
            .promise()
            .done(function() {});
    };
    /**
     * updateWindowHeight - Updates visibleHeight with new browser height.
     * @param  {integer} newHeight
     */
    Scrolly.prototype.updateWindowHeight = function(newHeight) {
        this.visibleHeight = newHeight;
    };

    /**
     * Tracks how many headers are locked on top and on bottom without
     * having to search the DOM for it - rather it is called when a
     * header is snapped into place.
     */
    Scrolly.prototype.offsetTracker = {
        /**
         * modify - increments or decrements specied tag
         * @param  {string} tag - marker (above & below used presently)
         * @param  {boolean} add - true -> increment || else -> decrement
         */
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

        /**
         * getOffset - Lookup how many headers are snapped to a given tag
         * @param  {string} tag
         * @return {integer} - Number of headers at tag
         */
        getOffset: function(tag) {
            if (typeof this._offset[tag] === 'undefined') { //First usage
                this._offset[tag] = 0;
            }
            return this._offset[tag];
        },

        /**
         * _offset - Map of tag -> # attached headers
         * @type {Object}
         */
        _offset: {}
    };

    function Section(element, staticAbove, staticBelow) {
        this.element = element.get(0);
        this.staticAbove = staticAbove;
        this.staticBelow = staticBelow;
        this._top = this.element.offsetTop;
        this._bottom = this._top + this.element.offsetHeight;
    }

    Section.prototype.update = function() {
        this._top = this.element.offsetTop;
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
