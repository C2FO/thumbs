(function () {
    /*jshint strict:false*/
    /*globals Backbone, _*/

    function defineThumbs(Backbone, _) {

        var root = this;
        var ArrayProto = Array.prototype;
        var slice = ArrayProto.slice;

        //private method to slice arguments
        function argsToArray(args) {
            return slice.call(args, 0);
        }

        //setup our namespace
        var thumbs = {};


        _.extend(thumbs, Backbone);

        // Current version of the library. Keep in sync with `package.json`.
        thumbs.VERSION = '0.0.1';
        //set to change the delimiting of multiple arguments in a data-thumbs-(bind|format|...)
        thumbs.MULTI_ARG_TOKEN = / +/;
        //set to change our key/value is represented in a data-thumbs-(bind|format|...)
        thumbs.KEY_VALUE_TOKEN = ":";


        //copy over Backbones $ for dom
        var Model = thumbs.Model, View = thumbs.View, Collection = thumbs.Collection, Router = thumbs.Router, History = thumbs.History;

        //private helper to split a string based on thumbs.MULTI_ARG_TOKEN and thumbs.KEY_VALUE_TOKEN
        function splitParts(m, cb) {
            return _.each(m.split(thumbs.MULTI_ARG_TOKEN), function (m) {
                cb(_.map(m.split(thumbs.KEY_VALUE_TOKEN), function (m) {
                    return $.trim(m);
                }));
            });
        }

        //private helper to set the data of an element
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


        var viewRegistry = thumbs.viewRegistry = (function () {
            var _hash = {},
                _length = 0;

            function __getById(id) {
                return "string" === typeof id ? _hash[id] : id;
            }

            function _getByNode(node) {
                return node ? _hash[node.thumbsId || node.getAttribute("thumbs-id")] : undefined;
            }

            function _toArray() {
                return _.values(_hash);
            }


            function _getUniqueId() {
                return _.uniqueId("thumbs_view_");
            }

            function _getViews(node) {
                var ret = [];

                function gatherViews(root) {
                    var thumbsId, node, view;
                    for (node = root.firstChild; node; node = node.nextSibling) {
                        if (node.nodeType === 1) {
                            if ((thumbsId = node.getAttribute("thumbs-id")) && (view = _hash[thumbsId])) {
                                ret.push(view);
                            }
                        }
                    }
                }

                gatherViews(node);
                return ret;
            }

            function __addView(view) {
                var id = view.thumbsId;
                if (_hash.hasOwnProperty(id)) {
                    throw new Error("Tried to register view with id " + id + " but that id is already registered");
                }
                if (id) {
                    _hash[id] = view;
                    _length++;
                }
            }

            function __removeView(id) {
                if (_hash.hasOwnProperty(id)) {
                    delete _hash[id];
                    _length--;
                }
            }

            function _getEnclosingView(searchNode) {
                var id, node = searchNode;
                while (node) {
                    if (node !== searchNode && (id = node.nodeType === 1 && node.getAttribute("thumbs-id"))) {
                        return _hash[id];
                    }
                    node = node.parentNode;
                }
                return null;
            }

            return {
                _hash: _hash,
                getEnclosingView: _getEnclosingView,
                remove: __removeView,
                add: __addView,
                "get": __getById,
                uniqueId: _getUniqueId,
                getSubViews: _getViews,
                getByNode: _getByNode,
                toArray: _toArray
            };
        }());

        thumbs.viewById = viewRegistry.get;
        thumbs.viewByNode = viewRegistry.getByNode;

        var _super = {
            _super: (function _super() {

                function findSuper(methodName, childObject) {
                    var object = childObject;
                    while ((object[methodName] === childObject[methodName]) && object.__getConstructor) {
                        var constructor = object.__getConstructor();
                        object = constructor['__super__'];
                    }

                    return object;
                }

                return function __super(methodName, args) {

                    // keep track of how far up the prototype chain we have traversed
                    if (!this._superCallObjects) {
                        this._superCallObjects = {};
                    }

                    var currentObject = this._superCallObjects[methodName] || this,
                        parentObject = findSuper(methodName, currentObject);
                    this._superCallObjects[methodName] = parentObject;

                    var result = parentObject[methodName].apply(this, args || {});
                    delete this._superCallObjects[methodName];
                    return result;
                };
            }())
        };


        // this allows access to prototype.constructor.__super__
        // when _.bindAll is used
        var _extend = thumbs.Model.extend;

        function extend(protoProps, staticProps) {
            var child = _extend.apply(this, arguments);
            child.prototype.__getConstructor = function () {
                return child;
            };
            return child;
        }

        function Class(options) {
            this.cid = _.uniqueId('class');
            this.initialize.apply(this, arguments);
        }

        _.extend(Class.prototype, thumbs.Events, _super, {
            initialize: function () {
            }
        });

        thumbs.Class = Class;

        Class.extend = Model.extend = View.extend = Collection.extend = Router.extend = History.extend = extend;
        Model = thumbs.Model = Model.extend(_super);
        View = thumbs.View = View.extend(_super);
        Collection = thumbs.Collection = Collection.extend(_super);
        Router = thumbs.Router = Router.extend(_super);
        History = thumbs.History = History.extend(_super);

        var EventDelegator = {

            render: function () {
                this._super('render', arguments);
                this.checkForEvents();
                return this;
            },

            checkForEvents: function () {
                var self = this;
                this.events = this.events || {};
                this.$('[data-thumbs-delegate]').each(function () {
                    var thumbsView = viewRegistry.get($(this).attr("thumbs-id"));
                    if (viewRegistry.getEnclosingView(this) === self) {
                        var $this = $(this), id = _.uniqueId('thumbs_');
                        $this.addClass(id);
                        splitParts($this.data('thumbs-delegate'), function (data) {
                            var event = data[0], func = data[1];
                            self.events[event + ' .' + id] = func;
                            if (thumbsView) {
                                //Listen to event if this is a thumbs-view
                                self.listenTo(thumbsView, event, self[func]);
                            }
                        });
                    }
                });
                this.delegateEvents();
                return this;
            }
        };

        var Identifier = {
            __identifiers: null,

            initialize: function () {
                this.__identifiers = [];
                this._super('initialize', arguments);
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

            render: function () {
                this._super('render', arguments);
                this.checkForIdentifiers();
                return this;
            },

            remove: function () {
                this.removeIdentifiers();
                return this._super('remove', arguments);
            }
        };

        var Binder = {

            __monitors: null,

            __events: null,

            initialize: function () {
                this._super("initialize", arguments);
                this.__monitors = {};
                this.__events = {};
                _.bindAll(this, "setElData", "__updateValues", "__setValues", "setupType", "setupBind",
                    "setupClassBind", "setupEventBind", "findThumbsBind", "turnOnModelListeners", "turnOffModelListeners",
                    "setupBinders");
            },

            __updateValues: function () {
                if (this.model && this.model instanceof Model) {
                    return this.__setValues(this.model.changedAttributes());
                }
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
                return this;
            },

            setElData: function (el, data, type, attribute) {
                this.checkFormatting(el, data, type);

            },

            setupType: function (m, el, type) {
                var monitors = this.__monitors;
                if (!(m in monitors)) {
                    monitors[m] = [];
                }
                var setElData = this.setElData;
                monitors[m].push(function (data) {
                    if ("function" === typeof el) {
                        el(data, m);
                    } else {
                        setElData(el, data, type, m);
                    }
                });
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
                                $el.toggleClass(clazz, data);
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
                this.$("[data-thumbs-bind]").each(function () {
                    setupBind(this);
                });
                this.$("[data-thumbs-bind-event]").each(function () {
                    setupEventBind(this);
                });

                this.$("[data-thumbs-bind-class]").each(function () {
                    setupClassBind(this);
                });
                if (this.$el.is("[data-thumbs-bind]")) {
                    setupBind(this.el);
                }
                if (this.$el.is("[data-thumbs-bind-class]")) {
                    setupClassBind(this.el);
                }
                if (this.$el.is("[data-thumbs-bind-event]")) {
                    setupEventBind(this.el);
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

            render: function () {
                this._super("render", arguments);
                //setup out binders
                this.setupBinders();
                return this;
            },

            remove: function () {
                this.turnOffModelListeners();
                this.__monitors = {};
                this.__events = {};
                return this._super("remove", arguments);
            }

        };

        var Formatter = {

            checkFormatting: function (el, data, type) {
                //create the jquery object and pull the ars
                var $el = this.$(el), args = argsToArray(arguments);
                //if we get more than one arg then data was passed in
                data = args.length > 1 ? data : $el.text();
                //ensure that the data is not null or undefined
                data = (data !== null && "undefined" !== typeof data) ? data : "";
                //get the formatter
                var formatter = $el.data("thumbs-format");
                //split the formatter to ensure than we pull off types and methods
                splitParts(formatter || "", function (formatterParts) {
                    if (formatterParts.length === 2) {
                        //if length === 2 then we have a type and formatter
                        type = formatterParts[0];
                        formatter = formatterParts[1];
                    } else {
                        //otherwise just get the formatter
                        formatter = formatterParts.pop();
                    }
                });
                //check that the formatter exists
                if (formatter && "function" === typeof this[formatter]) {
                    data = this[formatter](data);
                }
                //now set the data
                setElData($el, data, type);
            },

            renderFormatters: function () {
                var checkFormatting = _.bind(this.checkFormatting, this);
                //find all formatters and check the current formatting
                this.$("[data-thumbs-format]").each(function () {
                    checkFormatting(this);
                });
                return this;
            },

            render: function () {
                this._super("render", arguments);
                //get our formatters and render them
                return this.renderFormatters();
            }

        };

        var ElFinder = {

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

            render: function () {
                //call findEl first!
                return this.findEl()._super("render", arguments);
            }

        };


        var Subview = {
            _subviews: null,

            initialize: function () {
                this._super('initialize', arguments);
                this.__subviews = [];
            },

            render: function () {
                this.checkForSubviews();
                this._super('render', arguments);
                return this;
            },

            remove: function () {
                if (this.__subviews.length) {
                    _.each(this.__subviews, function (subview) {
                        subview.remove();
                    });
                    this.__subviews.length = 0;
                }
                return this._super('remove', arguments);
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
                var SubView = null, id,
                    $el = $(el),
                    v = $el.data('thumbs-view');
                if (v && (SubView = this[v])) {
                    var args = this._parseViewArgs($el.data('thumbs-args'));
                    _.extend(args, { el: el});
                    var view = new SubView(args);
                    view.render();
                    this.__subviews.push(view);
                    if (!!(id = $el.data('thumbs-id'))) {
                        this["$" + id] = view;
                    }
                } else {
                    throw new Error("Unable to find " + v + " on view");
                }
                return this;
            },


            checkForSubviews: function () {
                var self = this;
                this.$('[data-thumbs-view]').each(function () {
                    self.renderSubviewView(this);
                });
            }
        };

        //helper to set a shared templater. Defaults to _.template
        thumbs.templater = (function () {
            //bring a private templater into scope
            var templater = _.template;
            return function __templater(tmplr) {
                if (tmplr) {
                    //if a templater was passed in then set it
                    templater = tmplr;
                    return templater;
                } else {
                    //otherwise just get the templater
                    return templater;
                }
            };
        }());

        //override the router so we can set our history
        thumbs.Router = Router.extend({
            preRoutes: null,

            _bindRoutes: function () {
                if (this.preBind && _.isFunction(this.preBind)) {
                    this.preBind();
                }
                this._super("_bindRoutes", arguments);
            },

            route: function (route) {
                //set thumbs.history for API uniformity
                if (thumbs.history) {
                    Backbone.history = thumbs.history;
                }

                this._super("route", arguments);

                this.setupPreRoute('all', route);
                this.setupPreRoute(null, route);

                return this;
            },

            setupPreRoute: function (path, route) {
                var preRoute;
                if (!path) {
                    path = route;
                    preRoute = "pre-route_" + route;
                } else {
                    preRoute = "pre-route_" + path + route;
                }
                if (this.preRoutes && this.preRoutes[path]) {
                    var callback;
                    if (_.isFunction(this.preRoutes[path])) {
                        callback = this.preRoutes[path];
                    } else if (_.isString(this.preRoutes[path])) {
                        callback = this[this.preRoutes[path]];
                    } else if (_.isArray(this.preRoutes[path])) {
                        var checks = this.preRoutes[path];
                        callback = _.bind(function () {
                            var result = true;
                            for(var i=0; i<checks.length; i++){
                                result = checks[i].apply(this);
                                if (!result){
                                    break;
                                }
                            }
                            return result;
                        }, this);
                    } else {
                        throw("Pre-Route must be a string or a function.");
                    }

                    if (!_.isRegExp(preRoute)) {
                        preRoute = this._routeToRegExp(preRoute);
                    }
                    thumbs.history.route(preRoute, _.bind(function () {

                        return callback.apply(this);
                    }, this));
                }
            }
        });

        //extend our view
        View = thumbs.View = View.extend(ElFinder).extend(Formatter).extend(Identifier).extend(Binder).extend(EventDelegator).extend(Subview).extend({
            _subviews: null,

            initialize: function (options) {
                this.thumbsId = viewRegistry.uniqueId();
                viewRegistry.add(this);
                this._super("initialize", arguments);
                this._subviews = {};
                if (this.$el) {
                    this.$el.attr("thumbs-id", this.thumbsId);
                }
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

            //call to add a subview at the given selector
            addSubView: function (selector, view) {
                if (view) {
                    //remove any previous subviews at the selector
                    this.removeSubView(selector);
                    //set our subview
                    this._subviews[selector] = view;
                    //now set the subviews element and render it
                    view.setElement(this.$(selector)).render();
                }
                return this;
            },

            //remove a subview at the given selector
            removeSubView: function (selector) {
                //pull it offour __subviews hash
                var view = this._subviews[selector];
                if (view) {
                    //we have a view
                    //set the views element to null so its not removed with remove is called.
                    //this will also undelegate events
                    view.setElement(null);
                    //remove it
                    view.remove();
                    //empty the selector
                    this.$(selector).empty();
                    //null out the subview
                    this._subviews[selector] = null;
                }
                return this;
            },

            //remove all registered subviews
            removeSubViews: function () {
                //go through each and remove it
                _.each(this._subviews, function (view, selector) {
                    this.removeSubView(selector);
                }, this);
                return this;
            },

            render: function () {
                this._super("render", arguments);
                //assign all our subviews
                return this.assign(this._subviews);
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
                        //call add subview this ensures we dont have orphaned views
                        this.addSubView(selector, view);
                    }, this);
                }
                return this;
            },

            // when a view is removed, remove all event bindings
            remove: function () {
                this.removeSubViews();
                this.stopListening();
                return  this._super('remove', arguments);
            }
        });


        thumbs.TemplateView = View.extend({

            templater: null,

            template: null,

            initialize: function () {
                this._super("initialize", arguments);
                if (!this.templater) {
                    this.templater = thumbs.templater();
                }
                if (this.template) {
                    this._template = this.templater(this.template);
                }
            },


            getTemplateData: function () {
                return (this.model || this.collection) ? (this.model || this.collection)["toJSON"]() : {};
            },

            fillTemplate: function (data) {
                if (this._template) {
                    return this._template(data || this.getTemplateData());
                } else {
                    return null;
                }
            },

            /**
             * Renders the the template.
             *
             * @return this
             */
            renderTemplate: function () {
                if (this._template) {
                    var template = this.fillTemplate();
                    if (template) {
                        this.$el.html(template);
                    }
                }
                return this;
            },

            render: function () {
                //call render template
                return this.renderTemplate()._super("render", arguments);

            }
        });

        History = thumbs.History = History.extend({
            notFoundRedirect: null,

            checkPreRouteHandler: function (handlers, path, fragment) {
                var result = true;
                var routeHandler = _.find(handlers, function (handler) {
                    return handler.route.test(path + fragment);
                });
                if (routeHandler && routeHandler.callback) {
                    result = routeHandler.callback(fragment);
                }
                return result;
            },

            loadUrl: function (fragmentOverride) {
                var fragment = this.fragment = this.getFragment(fragmentOverride);
                var matched = this.checkPreRouteHandler(this.handlers, 'pre-route_all', fragment);
                if (matched) {
                    matched = this.checkPreRouteHandler(this.handlers, 'pre-route_', fragment);
                }

                if (matched) {
                    matched = this._super("loadUrl", arguments);
                    if (!matched) {
                        if (this.options.notFoundRedirect) {
                            this.navigate(this.options.notFoundRedirect, {trigger: true});
                            matched = true;
                        }
                    }
                }
                return matched;
            }
        });

        thumbs.history = new History;

        return thumbs;
    }


    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineThumbs(Backbone || require("backbone"), _ || require("underscore"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineThumbs((require("backbone")), (require("underscore")));
        });
    } else {
        this.thumbs = defineThumbs(Backbone, _);
    }


}).call(this);
