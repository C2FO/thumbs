(function () {

    var root = this;
    var ArrayProto = Array.prototype;
    var slice = ArrayProto.slice;

    //private method to slice arguments
    function argsToArray(args) {
        return slice.call(args, 0);
    }

    //setup our namespace
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
        if (type) {
            //if we have a type then we can try to look up the type function on the element
            if ("function" === typeof $el[type]) {
                $el[type](data);
            } else {
                //otherwise set it as an attribute
                $el.attr(type, data);
            }
        } else {
            //otherwise try to infer the type
            if ($el.is("input")) {
                //if we are a checkbox or radio then go ahead an assumed checked
                if ($el.is("[type=checkbox], [type=radio]")) {
                    $el.attr("checked", data);
                } else {
                    //otherwise set the value of the input element
                    $el.val(data);
                }
            } else {
                //if we are not an input assume it is text
                $el.text(data);
            }
        }
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

        removeIdentifiers: function removeIdentifiers() {
            _.each(this.__identifiers, function (id) {
                this[id] = this['$' + id] = null;
            }, this);
            this.__identifiers = [];
        },

        checkForIdentifiers: function checkForIdentifiers() {
            var self = this;
            this.removeIdentifiers();
            this.$('[data-thumbs-id]').each(function (el) {
                var $this = $(this);
                var id = $this.data('thumbs-id');
                self[id] = this;
                self['$' + id] = $this;
                self.__identifiers.push(id);
            });
            return this;
        },

        render: function render() {
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

        initialize: function initialize() {
            this._super("initialize", arguments);
            this.__monitors = {};
            this.__events = {};
            _.bindAll(this, "setElData", "__updateValues", "__setValues", "setupType", "setupBind",
                "setupClassBind", "setupEventBind", "findThumbsBind", "turnOnModelListeners", "turnOffModelListeners",
                "setupBinders");
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
            this.checkFormatting(el, data, type);

        },

        setupType: function setupType(m, el, type) {
            var monitors = this.__monitors;
            if (!(m in monitors)) {
                monitors[m] = [];
            }
            var setElData = this.setElData;
            monitors[m].push(function monitor(data) {
                if ("function" === typeof el) {
                    el(data, m);
                } else {
                    setElData(el, data, type, m);
                }
            });
        },

        setupBind: function setupBind(el) {
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
        },

        setupClassBind: function setupClassBind(el) {
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
        },

        setupEventBind: function setupEventBind(el) {
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
        },


        findThumbsBind: function _findThumbsBind() {
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

        turnOnModelListeners: function turnOnModelListeners() {
            var model = this.model || this.collection;
            if (model) {
                var monitors = this.__monitors, events = this.__events;
                if (monitors) {
                    _.each(this.__monitors, function (modelListeners, event) {
                        modelListeners.fn = function eventListenersFn(model, val) {
                            _.each(modelListeners, function (l) {
                                l.apply(this, [val]);
                            }, this);
                        };
                        model.on("change:" + event, modelListeners.fn, this);
                    });
                }
                if (events) {
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

        render: function render() {
            this._super("render", arguments);
            //setup out binders
            this.setupBinders();
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

        renderFormatters: function renderFormatters() {
            var checkFormatting = _.bind(this.checkFormatting, this);
            //find all formatters and check the current formatting
            this.$("[data-thumbs-format]").each(function () {
                checkFormatting(this);
            });
            return this;
        },

        render: function render() {
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

    //helper to set a shared templater. Defaults to _.template
    thumbs.templater = (function _templater() {
        //bring a private templater into scope
        var templater = _.template;
        return function __templater(tmplr) {
            if (tmplr) {
                //if a templater was passed in then set it
                return (templater = tmplr);
            } else {
                //otherwise just get the templater
                return templater;
            }
        };
    }());

    //override the router so we can set our history
    thumbs.Router = Router.extend({
        route: function(route, name, callback) {
            this._super("route", arguments);
            //set thumbs.history for API uniformity
            !thumbs.history && (thumbs.history = Backbone.history);
            return this;
        }
    });


    //extend our view
    View = thumbs.View = View.extend(ElFinder).extend(Formatter).extend(Identifier).extend(Binder).extend(EventDelegator).extend({
        _subviews: null,

        initialize: function initialize(options) {
            this._super("initialize", arguments);
            this._subviews = {};
        },

        //call to add a subview at the given selector
        addSubView: function addSubView(selector, view) {
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
        removeSubView: function removeSubView(selector) {
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
        removeSubViews: function removeSubViews() {
            //go through each and remove it
            _.each(this._subviews, function (view, selector) {
                this.removeSubView(selector);
            }, this);
            return this;
        },

        render: function render() {
            this._super("render", arguments);
            //assign all our subviews
            return this.assign(this._subviews);
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
                    //call add subview this ensures we dont have orphaned views
                    this.addSubView(selector, view);
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
        templater: null,

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
            if (!this.templater) {
                this.templater = thumbs.templater();
            }
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
            return (this.model || this.collection) ? (this.model || this.collection)["toJSON"]() : {};
        },

        /**
         * Fills the template with the data gathered from {@link thumbs.TemplateView#getTemplateData}
         * @return {thumbs.TemplateView} this for chaining.
         */
        fillTemplate: function fillTemplate(data) {
            data = data || this.getTemplateData();
            if (this._template) {
                return this._template(data);
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
