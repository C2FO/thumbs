(function () {

    var root = this;
    var ArrayProto = Array.prototype;
    var slice = ArrayProto.slice;

    function argsToArray(args) {
        return slice.call(args, 0);
    }

    var thumbs = {};

    // Require Underscore, if we're on the server, and it's not already present.
    var _ = root._;
    if (!_ && ('undefined' !== typeof require )) {
        _ = require('underscore');
    }
    // Require Backbone, if we're on the server, and it's not already present.
    var Backbone = root.Backbone;
    if (!Backbone && ('undefined' !== typeof require)) {
        Backbone = require('underscore');
    }

    _.extend(thumbs, Backbone);

    // Current version of the library. Keep in sync with `package.json`.
    thumbs.VERSION = '0.0.0';
    thumbs.MULTI_ARG_TOKEN = / +/;
    thumbs.KEY_VALUE_TOKEN = ":";


    //copy over Backbones $ for dom
    var Model = thumbs.Model, View = thumbs.View, Collection = thumbs.Collection, Router = thumbs.Router, History = thumbs.History;

    function splitParts(m, cb) {
        return _.each(m.split(thumbs.MULTI_ARG_TOKEN), function (m) {
            cb(_.map(m.split(thumbs.KEY_VALUE_TOKEN), function (m) {
                return $.trim(m);
            }));
        });
    }

    var _super = {
        _super: (function _super() {

            function findSuper(methodName, childObject) {
                var object = childObject;
                while (object[methodName] === childObject[methodName]) {
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
        initialize: function initialize() {
        }
    });

    thumbs.Class = Class;

    Class.extend = Model.extend = View.extend = Collection.extend = Router.extend = History.extend = extend;
    Model = thumbs.Model = Model.extend(_super);
    View = thumbs.View = View.extend(_super);
    Collection = thumbs.Collection = Collection.extend(_super);
    Router = thumbs.Router = Router.extend(_super);

    var EventDelegator = {
        render: function render() {
            this._super('render', arguments);
            this.checkForEvents();
            return this;
        },

        checkForEvents: function checkForEvents() {
            var self = this;
            this.events = this.events || {};
            this.$('[data-thumbs-delegate]').each(function () {
                var $this = $(this), id = _.uniqueId('thumbs_');
                $this.addClass(id);
                splitParts($this.data('thumbs-delegate'), function (data) {
                    var event = data[0], func = data[1];
                    self.events[event + ' .' + id] = func;
                });
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

        render: function render() {
            this._super('render', arguments);
            this.checkForIdentifiers();
            return this;
        },

        remove: function () {
            _.each(this.__identifiers, function (id) {
                this[id] = this['$' + id] = null;
            }, this);
            this.__identifiers = [];
            return this._super('remove', arguments);
        },

        checkForIdentifiers: function checkForIdentifiers() {
            var self = this;
            this.$('[data-thumbs-id]').each(function (el) {
                var $this = $(this);
                var id = $this.data('thumbs-id');
                self[id] = this;
                self['$' + id] = $this;
                self.__identifiers.push(id);
            });
            return this;
        }
    };

    var Binder = {

        __monitors: null,

        __events: null,

        initialize: function initialize() {
            this._super("initialize", arguments);
            this.__monitors = {};
            this.__events = {};
        },

        __updateValues: function setValues() {
            if (this.model && this.model instanceof Model) {
                return this.__setValues(this.model.changedAttributes());
            }
        },

        __setValues: function __setValues(values) {
            var monitors = this.__monitors;
            if (monitors) {
                _.each(values, function changedEach(val, key) {
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

        setElData: function setElData(el, data, type, attribute) {
            if (this.checkFormatting) {
                this.checkFormatting(el, data, type);
            } else {
                data = (data !== null && "undefined" !== typeof data) ? data : "";
                var $el = this.$(el);
                if (type) {
                    if ("function" === typeof $el[type]) {
                        $el[type](data);
                    } else {
                        $el.attr(type, data);
                    }
                } else {
                    if ($el.is("input")) {
                        if ($el.is("[type=checkbox], [type=radio]")) {
                            $el.attr("checked", data);
                        } else {
                            $el.val(data);
                        }
                    } else {
                        $el.text(data);
                    }
                }
            }
        },

        findThumbsBind: function findThumbsBind() {
            var monitors = this.__monitors, events = this.__events, setElData = _.bind(this.setElData, this);

            function setupType(m, el, type) {
                if (!(m in monitors)) {
                    monitors[m] = [];
                }
                monitors[m].push(function monitor(data) {
                    if ("function" === typeof el) {
                        el(data, m);
                    } else {
                        setElData(el, data, type, m);
                    }
                });
            }

            function setupBind(el) {
                var $el = $(el);
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

            function setupClassBind(el) {
                var $el = $(el);
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

            var view = this;

            function setupEventBind(el) {
                var $el = $(el);
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

        turnOnModelListeners: function turnOnModelListeners() {
            var model = this.model || this.collection;
            if (model) {
                _.each(this.__monitors, function (modelListeners, event) {
                    modelListeners.fn = function eventListenersFn(model, val) {
                        _.each(modelListeners, function (l) {
                            l.apply(this, [val]);
                        }, this);
                    };
                    model.on("change:" + event, modelListeners.fn, this);
                });
                _.each(this.__events, function (eventListeners, event) {
                    eventListeners.fn = function eventListenersFn() {
                        var args = arguments;
                        _.each(eventListeners, function (l) {
                            l.apply(this, args);
                        }, this);
                    };
                    model.on(event, eventListeners.fn, this)
                }, this);
            }
            return this;
        },

        turnOffModelListeners: function turnOnModelListeners() {
            var model = this.model || this.collection;
            if (model) {
                _.each(this.__monitors, function (modelListeners, event) {
                    model.off("change:" + event, modelListeners.fn, this)
                });
                _.each(this.__events, function (eventListeners, event) {
                    model.off(event, eventListeners.fn, this)
                });
            }
            return this;
        },


        setupBinders: function setUpMonitors() {
            var model = this.model || this.collection;
            this.findThumbsBind().turnOnModelListeners();
            this.__setValues(model.attributes);
            return this;
        },

        render: function render() {
            this._super("render", arguments);
            if (this.model || this.collection) {
                this.setupBinders();
            }
            return this;
        },

        remove: function remove() {
            this.turnOffModelListeners();
            this.__monitors = this.__events = null;
            return this._super("remove", arguments);
        }

    };

    var Formatter = {

        checkFormatting: function checkFormatting(el, data, type) {
            var $el = this.$(el), args = argsToArray(arguments);
            data = args.length === 3 ? data : $el.text();
            data = (data !== null && "undefined" !== typeof data) ? data : "";
            var formatter = $el.data("thumbs-format");
            splitParts(formatter || "", function (formatterParts) {
                if (formatterParts.length == 2) {
                    type = formatterParts[0];
                    formatter = formatterParts[1];
                } else {
                    formatter = formatterParts.pop();
                }
            });
            if (formatter && "function" === typeof this[formatter]) {
                data = this[formatter](data);
            }
            if (type) {
                if ("function" === typeof $el[type]) {
                    $el[type](data);
                } else {
                    $el.attr(type, data);
                }
            } else {
                if ($el.is("input")) {
                    if ($el.is("[type=checkbox], [type=radio]")) {
                        $el.attr("checked", data);
                    } else {
                        $el.val(data);
                    }
                } else {
                    $el.text(data);
                }
            }
        },

        renderFormatters: function renderFormatters() {
            var checkFormatting = _.bind(this.checkFormatting, this);
            this.$("[data-thumbs-format]").each(function () {
                checkFormatting(this);
            });
            return this;
        },

        render: function render() {
            this._super("render", arguments);
            return this.renderFormatters();
        }

    };

    var ElFinder = {

        findEl: function () {
            var setElement = _.bind(this.setElement, this);
            var el = this.$("[data-thumbs-el]").first().get();
            if (el.length) {
                setElement(el[0]);
            }
            return this;
        },

        render: function () {
            return this.findEl()._super("render", arguments);
        }

    };

    thumbs.templater = (function _templater() {
        var templater = _.template;
        return function __templater(tmplr) {
            if (tmplr) {
                return (templater = tmplr);
            } else {
                return templater;
            }
        };
    }());

    thumbs.Router = Router.extend({
        route: function route(route, name, callback) {
            this._super("route", arguments);
            !thumbs.history && (thumbs.history = Backbone.history);
            return this;
        }
    });


    View = thumbs.View = View.extend(ElFinder).extend(Formatter).extend(Identifier).extend(Binder).extend(EventDelegator).extend({
        _subviews: null,

        initialize: function initialize(options) {
            this._super("initialize", arguments);
            this._subviews = {};
        },

        addSubView: function addSubView(selector, view) {
            this.removeSubView(selector);
            this._subviews[selector] = view;
            view.setElement(this.$(selector)).render();
            //this.assign(this._subviews);
            return this;
        },

        removeSubView: function removeSubView(selector) {
            var view = this._subviews[selector];
            if (view) {
                // undelegate events, but we won't remove the element
                view.setElement(null);
                view.remove();
                this.$(selector).empty();
                delete this._subviews[selector];
            }
            return this;
        },

        removeSubViews: function removeSubViews() {
            _.each(this._subviews, function (view, selector) {
                this.removeSubView(selector);
            }, this);
            return this;
        },

        // default render functionality is to set the el html to the
        // compiled template run with the model data
        // override if that's not what's needed
        render: function render() {
            this._super("render", arguments);
            this.assign(this._subviews);
            return this;
        },

        assign: function assign(selector, view) {
            var selectors;
            if (_.isObject(selector)) {
                selectors = selector;
            } else if (selector) {
                selectors = {};
                selectors[selector] = view;
            }
            if (selectors) {
                _.each(selectors, function (view, selector) {
                    view.setElement(this.$(selector)).render();
                }, this);
            }

            return this;
        },

        // when a view is removed, remove all event bindings
        remove: function remove() {
            this.undelegateEvents();
            this.removeSubViews();
            return this._super('remove', arguments);
        }
    });

    thumbs.TemplateView = View.extend({
        /**@lends thumbs.TemplateView.prototype*/

        /**
         * The the `templater` to use to compile this view template. If not specified them {@link thumbs.templater}
         * will be used.
         *
         * @example
         *
         * var MyView = thumbs.TemplateView.extend({
         *     templater : function(template){
         *          return Handlebars.compile(template);
         *     },
         *
         *     template : "<div>{{firstName}}</div>"
         * })
         *
         * @function
         */
        templater: thumbs.templater(),

        /**
         * The template string for this view.
         *
         * @example
         * var MyView = thumbs.TemplateView.extend({
         *     template : "<div>{{firstName}}</div>"
         * });
         *
         */
        template: null,

        initialize: function (options) {
            this._super("initialize", arguments);
            if (this.template) {
                this._template = this.templater(this.template);
            }
        },

        /**
         * Gathers data to be interpolated into the template. By default serializes the model to json.
         *
         * @example
         * var MyView = thumbs.TemplateView.extend({
         *     template : "<div><div>{{i18n.hello}}<div> <div>{{firstName}}</div> </div>",
         *     getTemplateData : function(){
         *         var data = this._super("getTemplateData", arguments);
         *         data.i18n = {hello : "Hello"};
         *         return data;
         *     }
         * });
         *
         * @return {Object} Object with key value pairs to be interpolated into the View.
         */
        getTemplateData: function () {
            return this.model ? this.model.toJSON() : {};
        },

        /**
         * Fills the template with the data gathered from {@link thumbs.TemplateView#getTemplateData}
         * @return {thumbs.TemplateView} this for chaining.
         */
        fillTemplate: function fillTemplate() {
            if (this._template) {
                return this._template(this.getTemplateData());
            } else {
                return null;
            }
        },

        /**
         * Renders the the template.
         *
         * @return this
         */
        renderTemplate: function renderTemplate() {
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

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = thumbs;
        }
    } else if ("function" === typeof define) {
        define(function () {
            return thumbs;
        });
    } else {
        this.thumbs = thumbs;
    }


}).call(this);
