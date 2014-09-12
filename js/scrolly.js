/**
 * Scrolly.js v1.0.0
 *   - jQuery sidebar plugin
 * (c) 2014 Nathan Johnson <mail@njohnson.ms>
 * Copyright 2014 All Rights Reserved
 */


/*
 *** Add semicolon before anon function. fucking jshint gets mad and it's annoying
 */
(function($, window, document, undefined) {

    var $window = $(window);

    var opts = { //Delete unles we need options
        scrollTime: 750 // # ms the scrolling animation will take
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

    function Scrolly(element, options) {
        this.element = element;
        this.settings = $.extend({}, opts, options);

        this.init();
    }

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

        //Ideally should load new DOM elements to an array and append all at once. for n=10 @ initilization, not necessary
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
     * onStroll - Function called everytime the browswer emits a 'scroll' event
     *   - For latest chrome + FF calling it every iteration shouldn't
     *     be a problem, but for compatibility with older browsers who
     *     may fire this event every single pixel scrolled, a rate limiting
     *     function is needed.
     */
    Scrolly.prototype.onScroll = function(scrollEvent) {
        var self = this;
        var scrollPos = this.$scrollPane.scrollTop();

        var offsetAbove = self.offsetTracker.getOffset('above') * self.headerHeight,
            offsetBelow = self.offsetTracker.getOffset('below') * self.headerHeight;

        //Iterates over the sections and checks if they have scrolled off 
        //or scrolled back in.
        self.sectionList.forEach(function(ele) {
            var deltaPostion = ele._top - scrollPos;

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

    /**
     * toggleSnap - Snaps a section to the top/bottom when it is crossed by scrolling
     * @param  {boolean} snapOn - true -> snap || false -> un-snap
     * @param  {[Element]} element - jQuery element of the target section
     * @param  {[string]} tag - 'above' or 'below'
     */
    Scrolly.prototype.toggleSnap = function(snapOn, element, tag) {
        var start = !element.hasClass('hidden'); // Inverse because toggle on = hidden off

        if (snapOn !== start) { //New snap event
            this.offsetTracker.modify(tag, snapOn);

            if (tag === 'above') { // A more optimal solution can be written
                var offset = this.offsetTracker.getOffset('above');

                this.$sidebar.find('.above > h3:nth-child(' + offset + ')').addClass('opened');
                this.$sidebar.find('.above > h3:not(:nth-child(' + offset + '))').removeClass('opened');
            }

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
        /*  this.$sidebar.find('h3').click(function(e) {
            var clickedElement = $(this),
                parent = clickedElement.parent(),
                sectionID = parseInt(clickedElement.get(0).id.replace('scrolly-pos-', ''), 10);

            var opened = clickedElement.hasClass('open'),
                closed = clickedElement.hasClass('closed');

            if (opened && closed) { //This never *should* happen
                clickedElement.removeClass('opened');
            } else if (!opened && !closed) {
                clickedElement.addClass('closed');
            } else {
                clickedElement.toggleClass('opened');
                clickedElement.toggleClass('closed');
            }

            //self.scrollTo(sectionID, clickedElement);
            console.log('click on ', sectionID);
            console.log(parent);


        });*/

        this.$sidebar.find('h3').click(function(e) {
            var clickedElement = $(this),
                parent = clickedElement.parent(),
                sectionID = parseInt(clickedElement.get(0).id.replace('scrolly-pos-', ''), 10);

            console.log('click on ', sectionID);

            if (parent.is('.section')) { // Visible & open -> only moves up
                console.log('parent is .section');
                var c = (self.$sections[sectionID + 1].offsetTop) - ((sectionID + 1) * self.headerHeight);
                console.log('Middle:', sectionID, c);
                self.scrollTo(c);

            } else if (parent.is('.section-headers.above')) {
                console.log('parent is .section-headers.above', sectionID, self.offsetTracker.getOffset('above'));
                if (sectionID + 1 === self.offsetTracker.getOffset('above')) { // The last open element docked on top
                    self.scrollTo((self.$sections[sectionID + 1].offsetTop) - ((sectionID + 1) * self.headerHeight));
                } else {
                    self.scrollTo((self.$sections[sectionID].offsetTop) - (sectionID * self.headerHeight));
                }

            } else if (parent.is('.section-headers.below')) {
                console.log('parent is below', self.$scrollPane.scrollTop(), (self.$sections[sectionID].offsetTop));
                console.log('section height: ', self.$sections.eq(sectionID).height());
                console.log('screen height: ', self.visibleHeight);
                /*var o = (self.$sections[sectionID].offsetTop) - (sectionID * self.headerHeight) + (self.visibleHeight - clickedElement.height());*/
                var o = (self.$sections[sectionID].offsetTop) - (self.visibleHeight - self.$sections.eq(sectionID).height());
                self.scrollTo(o);
            }


            /*            if (elem > 0) {
                scrollTo = sectionID + elem;
                console.log('just bumping up the bottom a bit');
            } else {
                scrollTo = (self.$sections[sectionID].offsetTop) - (sectionID * this.headerHeight);
                console.log(scrollTo, this.offsetTracker.getOffset('above'));
                console.log('Headers above:', sectionID);
            }*/


        });

        //4.) Pipe scroll wheel actions to .scroll-pane when hovering an absolute header section
        //      - If not your scrolling is stolen by the absolute block
        //      - CSS pointer-events: none would do this too, but it also would prevent clicks,
        //        and you could click on what is underneath without realizing it
        this.$sidebar.find('.section-headers').bind('mousewheel DOMMouseScroll', function(e) {
            e.preventDefault();
            var targetPosition;
            if (e.type == 'mousewheel') {
                targetPosition = (e.originalEvent.wheelDelta * -1);
            } else if (e.type == 'DOMMouseScroll') {
                targetPosition = e.originalEvent.detail * 40;
            }

            self.$scrollPane.scrollTop(targetPosition + self.$scrollPane.scrollTop());
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
            /*console.log(tag, this._offset[tag]);*/
            return this._offset[tag];
        },
        _offset: {}
    };

    Scrolly.prototype.scrollTo = function(scrollTo) {
        var self = this;

        this.$scrollPane
            .animate({
                scrollTop: scrollTo
            }, {
                duration: self.settings.scrollTime,
                step: function(a) {
                    //console.log('step', a);
                }
            })
            .promise()
            .done(function() {});
    };

    /*
    Scrolly.prototype.scrollTo = function(sectionID, elem) {
        var self = this,
            scrollTo = 0;

        if (elem > 0) {
            scrollTo = sectionID + elem;
            console.log('just bumping up the bottom a bit');
        } else {
            scrollTo = (self.$sections[sectionID].offsetTop) - (sectionID * this.headerHeight);
            console.log(scrollTo, this.offsetTracker.getOffset('above'));
            console.log('Headers above:', sectionID);
        }

        this.$scrollPane
            .animate({
                scrollTop: scrollTo
            }, {
                duration: 250,
                step: function(a) {
                    //console.log('step', a);
                }
            })
            .promise()
            .done(function() {});

    };
*/
    /*Scrolly.prototype.scrollTo = function(position, scrollingDown) {
        var self = this;

        var fixedHeaders = this.offsetTracker.getOffset('above');
        if (scrollingDown)
            fixedHeaders--;

        var ss = position - (fixedHeaders * this.headerHeight);

        console.log(position, ss, this.offsetTracker.getOffset('above'));
        console.log('Headers above:', fixedHeaders);


        this.$scrollPane
            .animate({
                scrollTop: ss
            }, {
                duration: 250,
                step: function(a) {
                    //console.log('step', a);
                }
            })
            .promise()
            .done(function() {});
    };*/

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
