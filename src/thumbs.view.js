Thumbs.View = (function () {
    var viewRegistry = Thumbs.viewRegistry;

    function splitParts(m, cb) {
        return _.each(m.split(Thumbs.MULTI_ARG_TOKEN), function (m) {
            cb(_.map(m.split(Thumbs.KEY_VALUE_TOKEN), function (m) {
                return $.trim(m);
            }));
        });
    }

    function setElData($el, data, type) {
        var thumbsId;
        if ((thumbsId = $el.attr("thumbs-id"))) {
            $el = viewRegistry.get(thumbsId) || $el;
        }

        if (type) {
            //if we have a type then we can try to look up the type function on the element
            if ("function" === typeof $el[type]) {
                $el[type](data);
            } else {
                //otherwise set it as an attribute
                if ($el.attr) {
                    $el.attr(type, data);
                } else if ($el instanceof View) {
                    $el[type] = data;
                } else {
                    throw new Error("unable to determine how to set data on " + $el);
                }
            }
        } else {
            //otherwise try to infer the type
            if ($el.is && $el.is("input")) {
                //if we are a checkbox or radio then go ahead an assumed checked
                if ($el.is("[type=checkbox], [type=radio]")) {
                    $el.attr("checked", data);
                } else {
                    //otherwise set the value of the input element
                    $el.val(data);
                }
            } else if ($el instanceof View && $el.val) {
                $el.val(data);
            } else if ($el.text) {
                //if we are not an input assume it is text
                $el.text(data);
            } else {
                throw new Error("unable to determine how to set data on " + $el);
            }
        }
    }

    var View = Backbone.View.extend(Thumbs._super).extend({
        _subviews: null,
        __subviews: null,
        __identifiers: null,
        __monitors: null,
        __events: null,

        initialize: function () {
            _.bindAll(this, "setElData", "__updateValues", "__setValues", "setupType", "setupBind", "setupClassBind", "setupEventBind", "findThumbsBind", "turnOnModelListeners", "turnOffModelListeners", "setupBinders");
            this.thumbsId = viewRegistry.uniqueId();
            viewRegistry.add(this);
            this._subviews = {};
            this.__subviews = [];
            this.__identifiers = [];
            this.__monitors = {};
            this.__events = {};
            this.events = _.clone(this.events || {});
            this._super('initialize', arguments);
            if (this.$el) {
                this.$el.attr("thumbs-id", this.thumbsId);
            }
        },

        __updateValues: function () {
            if (this.model && this.model instanceof Thumbs.Model) {
                return this.__setValues(this.model.changedAttributes());
            }

            return this;
        },

        __setValues: function (values) {
            var monitors = this.__monitors;
            if (monitors) {
                _.each(values, function (val, key) {
                    var mon = monitors[key];
                    if (mon) {
                        _.each(mon, function (fn) {
                            fn(val);
                        });
                    }
                });
            }
        },

        setElData: function (el, data, type, attribute) {
            return this.checkFormatting(el, data, type);
        },

        setupType: function (m, el, type) {
            var monitors = this.__monitors;
            if (!(m in monitors)) {
                monitors[m] = [];
            }
            monitors[m].push(_.bind(function (data) {
                if ("function" === typeof el) {
                    el(data, m);
                } else {
                    this.setElData(el, data, type, m);
                }
            }, this));
        },

        setupBind: function (el) {
            if (viewRegistry.getEnclosingView(el) === this) {
                var $el = $(el), setupType = this.setupType;
                splitParts($el.data("thumbs-bind"), function (mParts) {
                    if (mParts.length === 1) {
                        setupType(mParts[0], el);
                    } else if (mParts.length === 2) {
                        setupType(mParts[1], el, mParts[0]);
                    } else {
                        throw new TypeError("Invalid data-thumbs-bind definition");
                    }
                });
            }
        },

        setupClassBind: function (el) {
            if (viewRegistry.getEnclosingView(el) === this) {
                var $el = $(el), setupType = this.setupType;
                splitParts($el.data("thumbs-bind-class"), function (mParts) {
                    if (mParts.length === 2) {
                        var clazz = mParts[0];
                        setupType(mParts[1], function (data) {
                            $el.toggleClass(clazz, !!data);
                        });
                    } else {
                        throw new TypeError("Invalid data-thumbs-bind-class definition");
                    }
                });
            }
        },

        setupEventBind: function (el) {
            if (viewRegistry.getEnclosingView(el) === this) {
                var events = this.__events;
                var $el = $(el), view = this;
                splitParts($el.data("thumbs-bind-event"), function (mParts) {
                    if (mParts.length === 2) {
                        var event = mParts[0], eventListeners = events[event];
                        if (!eventListeners) {
                            eventListeners = events[event] = [];
                        }
                        eventListeners.push(view[mParts[1]]);
                    } else {
                        throw new TypeError("Invalid data-thumbs-bind-class definition");
                    }
                });
            }
        },


        findThumbsBind: function () {
            var setupBind = this.setupBind,
                setupClassBind = this.setupClassBind,
                setupEventBind = this.setupEventBind;
            this.$("[data-thumbs-bind]").not("[data-thumbs-view]").each(function () {
                setupBind(this);
            });
            this.$("[data-thumbs-bind-event]").not("[data-thumbs-view]").each(function () {
                setupEventBind(this);
            });

            this.$("[data-thumbs-bind-class]").not("[data-thumbs-view]").each(function () {
                setupClassBind(this);
            });
            if(!this.$el.is("[data-thumbs-view]")){
                if (this.$el.is("[data-thumbs-bind]")) {
                    setupBind(this.el);
                }
                if (this.$el.is("[data-thumbs-bind-class]")) {
                    setupClassBind(this.el);
                }
                if (this.$el.is("[data-thumbs-bind-event]")) {
                    setupEventBind(this.el);
                }
            }

            return this;
        },

        turnOnModelListeners: function () {
            var model = this.model || this.collection;
            if (model) {
                var monitors = this.__monitors, events = this.__events;
                if (monitors) {
                    _.each(this.__monitors, function (modelListeners, event) {
                        modelListeners.fn = function (model, val) {
                            _.each(modelListeners, function (l) {
                                l.apply(this, [val]);
                            }, this);
                        };
                        model.on("change:" + event, modelListeners.fn, this);
                    }, this);
                }
                if (events) {
                    _.each(this.__events, function (eventListeners, event) {
                        eventListeners.fn = function () {
                            var args = arguments;
                            _.each(eventListeners, function (l) {
                                l.apply(this, args);
                            }, this);
                        };
                        model.on(event, eventListeners.fn, this);
                    }, this);
                }
            }
            return this;
        },

        turnOffModelListeners: function () {
            var model = this.model || this.collection;
            if (model) {
                var monitors = this.__monitors, events = this.__events;
                if (monitors) {
                    //loop through each monitor and turn them off
                    _.each(this.__monitors, function (modelListeners, event) {
                        model.off("change:" + event, modelListeners.fn, this);
                    }, this);
                }
                if (events) {
                    //loop through bound events and turn them off
                    _.each(this.__events, function (eventListeners, event) {
                        model.off(event, eventListeners.fn, this);
                    }, this);
                }
            }
            return this;
        },


        setupBinders: function () {
            var model = this.model || this.collection;
            //turn off previous model listeners incase render is called more than once
            this.turnOffModelListeners()
                //find new ones
                .findThumbsBind()
                //turn them on again
                .turnOnModelListeners();
            if (model) {
                this.__setValues(model.attributes);
            }
            return this;
        },

        removeIdentifiers: function () {
            _.each(this.__identifiers, function (id) {
                this[id] = this['$' + id] = null;
            }, this);
            this.__identifiers = [];
        },

        checkForIdentifiers: function () {
            var self = this;
            this.removeIdentifiers();
            this.$('[data-thumbs-id]').each(function (el) {
                if (viewRegistry.getEnclosingView(this) === self) {
                    var $this = $(this);
                    var id = $this.data('thumbs-id');
                    self[id] = this;
                    self['$' + id] = viewRegistry.getByNode(this) || $this;
                    self.__identifiers.push(id);
                }
            });
            return this;
        },

        updateIdentifiers: function() {
            var self = this;
            //loop through identifiers and update any view references that have not been set
            //this is necessary after nested views because we don't know how deep the view will be nested
            //when the subview is done rendering and the enclosing view will not be the parent view trying
            //to reference it
            _.each(self.__identifiers, function(id) {
                $(self[id]).attr("thumbs-id");
                var view = viewRegistry.get($(self[id]).attr("thumbs-id"));
                if(view){
                    self['$' + id] = view;
                }

            });
            return this;
        },

        findEl: function () {
            var setElement = _.bind(this.setElement, this);
            //find an elements that are marked with data-thumbs-el
            var el = this.$("[data-thumbs-el]").first().get();
            if (el.length) {
                //we found some!
                el = el[0];
                //ensure that its not already our dom element
                if (el !== this.el) {
                    //set it
                    setElement(el);
                }
            }
            return this;
        },

        checkFormatting: function (el, data, type) {
            var formatter, $el = $(el), args = Array.prototype.slice.call(arguments, 0);
            data = args.length > 1 ? data : $el.text();
            data = (data !== null && "undefined" !== typeof data) ? data : "";
            formatter = $el.data("thumbs-format");

            splitParts(formatter || "", function (formatterParts) {
                if (formatterParts.length === 2) {
                    type = formatterParts[0];
                    formatter = formatterParts[1];
                } else {
                    formatter = formatterParts.pop();
                }
            });

            if (formatter && "function" === typeof this[formatter]) {
                data = this[formatter](data);
            }

            setElData($el, data, type);

            return this;
        },

        renderFormatters: function () {
            var self = this;
            this.$('[data-thumbs-format]').not("[data-thumbs-view]").each(function () {
                self.checkFormatting(this);
            });

            return this;
        },

        setElement: function () {
            var ret = this._super("setElement", arguments);
            if (this.el) {
                this.$el.attr("thumbs-id", this.thumbsId);
            } else {
                viewRegistry.remove(this.thumbsId);
            }
            return this;
        },

        addSubView: function (selector, view) {
            if (view) {
                this.removeSubView(selector);
                this._subviews[selector] = view;
                view.setElement(this.$(selector)).render();
            }

            return this;
        },

        removeSubView: function (selector) {
            var view = this._subviews[selector];
            if (view) {
                view.setElement(null);
                view.remove();
                this.$(selector).empty();
                this._subviews[selector] = null;
            }

            return this;
        },

        removeSubViews: function () {
            _.each(this._subviews, function (view, selector) {
                this.removeSubView(selector);
            }, this);

            return this;
        },

        checkForEvents: function () {
            var self = this;

            this.$('[data-thumbs-delegate]').not("[data-thumbs-view]").each(function () {
                self._bindEvents(this);
            });
            return this;
        },

        _bindEvents: function (element, subView) {
            var self = this,
                bound = false,
                thumbsView = subView || viewRegistry.get($(element).attr("thumbs-id"));
            if (subView || viewRegistry.getEnclosingView(element) === self) {
                bound = true;
                var $element = $(element), id = _.uniqueId('thumbs_');
                $element.addClass(id);
                splitParts($element.data('thumbs-delegate'), function (data) {
                    var event = data[0], func = data[1];
                    self.events[event + ' .' + id] = func;
                    if (thumbsView) {
                        //Listen to event if this is a thumbs-view
                        self.listenTo(thumbsView, event, self[func]);
                    }
                });
            }
            return bound;
        },

        render: function () {
            if (!viewRegistry.get(this.thumbsId)) {
                viewRegistry.add(this);
            }
            // this order matters
            this.checkForEvents()
                .setupBinders()
                .checkForIdentifiers()
                .renderFormatters()
                .checkForSubviews()
                .updateIdentifiers()
                .findEl()
                .assign(this._subviews)
                ._super('render', arguments);
            if (!_.isEmpty(this.events)) {
                this.delegateEvents();
            }
            return this;
        },

        assign: function (selector, view) {
            var selectors;
            if (_.isObject(selector)) {
                selectors = selector;
            } else if (selector) {
                selectors = {};
                selectors[selector] = view;
            }

            if (selectors) {
                _.each(selectors, function (view, selector) {
                    this.addSubView(selector, view);
                }, this);
            }

            return this;
        },

        _parseViewArgs: function (args) {
            /*jshint evil:true*/
            var ret = {};
            if (args) {
                try {
                    _.extend(ret, eval("with(this){({" + args + "})}"));
                } catch (e) {
                    throw new Error("Unable to parse data-thumbs-args : " + args + " : " + e.toString());
                }
            }
            return ret;
        },

        renderSubviewView: function (el) {
            var SubView = null, id, view,
                $el = $(el),
                v = $el.data('thumbs-view');
            if (v && (SubView = this[v])) {
                var args = this._parseViewArgs($el.data('thumbs-args'));
                _.extend(args, { el: el});
                view = new SubView(args);
                view.render();
                this.__subviews.push(view);
                if (!!(id = $el.data('thumbs-id'))) {
                    this["$" + id] = view;
                }
            } else {
                throw new Error("Unable to find " + v + " on view");
            }
            return view;
        },

        checkForSubviews: function () {
            var self = this;
            this.$('[data-thumbs-view]').each(function () {
                var subView = self.renderSubviewView(this);

                if ($(this).is("[data-thumbs-delegate]")) {
                    self._bindEvents(this, subView);
                }

                self.turnOffModelListeners();
                if ($(this).is("[data-thumbs-bind]")) {
                    self.setupBind(this);
                }

                if ($(this).is("[data-thumbs-bind-event]")) {
                    self.setupEventBind(this);
                }

                if ($(this).is("[data-thumbs-bind-class]")) {
                    self.setupClassBind(this);
                }
                if (self.$el.is("[data-thumbs-view]")) {
                    if (self.$el.is("[data-thumbs-bind]")) {
                        self.setupBind(self.el);
                    }
                    if (self.$el.is("[data-thumbs-bind-class]")) {
                        self.setupClassBind(self.el);
                    }
                    if (self.$el.is("[data-thumbs-bind-event]")) {
                        self.setupEventBind(self.el);
                    }
                }
                self.turnOnModelListeners();

                if (self.model) {
                    self.__setValues(self.model.attributes);
                }

                if ($(this).is("[data-thumbs-format]")) {
                    self.checkFormatting(this);
                }
            });

            return this;
        },

        remove: function () {
            if (this.__subviews.length) {
                _.each(this.__subviews, function (subview) {
                    subview.remove();
                });

                this.__subviews = [];
            }
            this.stopListening();
            this.removeSubViews();
            this.turnOffModelListeners();
            this.removeIdentifiers();
            this.undelegateEvents();
            viewRegistry.remove(this.thumbsId);
            this.__monitors = {};
            this.__events = {};
            this._super('remove', arguments);
            return this;
        }
    });

    return View;
})();
