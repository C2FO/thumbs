(function () {

    var root = this;
    var ArrayProto = Array.prototype;
    var slice = ArrayProto.slice;

    function argsToArray(args) {
        return slice.call(args, 0);
    }

    var thumbs;
    if (typeof exports !== 'undefined') {
        thumbs = exports;
    } else {
        thumbs = root.thumbs = {};
    }


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


    //copy over Backbones $ for dom
    var Model = thumbs.Model, View = thumbs.View, Collection = thumbs.Collection, Router = thumbs.Router, History = thumbs.History;

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

    var Subview = {
        _subviews: null,

        initialize: function () {
            this._super('initialize', arguments);
            this._subviews = [];
        },

        render: function () {
            this._super('render', arguments);
            this.checkForSubviews();
            return this;
        },

        remove: function () {
            this._subviews.length && _.each(this._subviews, function (subview) {
                subview.remove();
            });
            this._subviews = [];
            return this._super('remove', arguments);
        },

        checkForSubviews: function () {
            var self = this;
            this.$('[data-thumbs-view]').each(function () {
                /*jshint evil:true */
                var $this = $(this),
                    view = null,
                    v = $this.data('thumbs-view'),
                    a = $this.data('thumbs-args'),
                    args = {};

                if (a) {
                    _.each(a.split(","), function (arg) {
                        arg = arg.split(":");
                        args[arg[0]] = arg[1];
                    }, this);
                }

                _.extend(args, { el: this});

                if (v.indexOf("/") >= 0 && typeof require === "function") {
                    require([v], function (View) {
                        view = new View(args).render();
                    });
                } else if (v.indexOf(".") >= 0) {
                    // assume that this is a global path
                    eval("view = new "+v+"(args).render();");
                } else {
                    throw new Error("Unknown Subview Error");
                }

                self._subviews.push(view);
            });
        },
    };

    var EventDelegator = {
        render: function render() {
            this._super('render', arguments);
            this.checkForEvents();
            return this;
        },

        checkForEvents: function checkForEvents() {
            var self = this;
            this.events = this.events || {};
            this.$('[data-thumbs-event]').each(function () {
                var $this = $(this), data = $this.data('thumbs-event').split(':'),
                    event = data[0], func = data[1];

                var id = _.uniqueId('thumbs_');
                $this.addClass(id);
                self.events[event + ' .' + id] = func;
            });
            this.delegateEvents();
            return this;
        }
    };

    var Identifier = {
        render: function render() {
            this._super('render', arguments);
            this.checkForIdentifiers();
            return this;
        },

        checkForIdentifiers: function checkForIdentifiers() {
            var self = this;
            this.$('[data-thumbs-id]').each(function (el) {
                var $this = $(this);
                var id = $this.data('thumbs-id');
                self[id] = this;
                self['$' + id] = $this;
            });
            return this;
        }
    };

    var Binder = {

        __monitors: null,

        initialize: function initialize() {
            this._super("initialize", arguments);
            this.__monitors = {};
        },

        __updateValues: function setValues() {
            return this.__setValues(this.model.changedAttributes());
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

        setElData: function setElData(el, data, attribute) {
            if (this.checkFormatting) {
                this.checkFormatting(el, data);
            } else {
                data = (data !== null && "undefined" !== typeof data) ? data : "";
                this.$(el).text(data);
            }
        },

        setupBinders: function setUpMonitors() {
            var monitors = this.__monitors, setElData = _.bind(this.setElData, this);
            this.$("[data-thumbs-bind]").each(function () {
                var el = this, $el = $(el);
                var m = $el.data("thumbs-bind");
                if (!(m in monitors)) {
                    monitors[m] = [];
                }
                monitors[m].push(function monitor(data) {
                    setElData(el, data, m);
                });
            });
            var model = this.model;
            model.on("change", this.__updateValues, this);
            this.__setValues(model.attributes);
            return this;
        },

        render: function render() {
            this._super("render", arguments);
            if (this.model) {
                this.setupBinders();
            }
            return this;
        },

        remove: function remove() {
            if (this.model) {
                this.model.off("change", this.setValues, this);
            }
            this.__monitors = null;
            return this._super("remove", arguments);
        }

    };

    var Formatter = {

        checkFormatting: function checkFormatting(el, data) {
            var $el = this.$(el), args = argsToArray(arguments);
            data = args.length === 2 ? data : $el.text();
            data = (data !== null && "undefined" !== typeof data) ? data : "";
            var formatter = $el.data("thumbs-format");
            if (formatter && "function" === typeof this[formatter]) {
                $el.text(this[formatter](data));
            } else {
                $el.text(data);
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

    View = thumbs.View = View.extend(Subview).extend(Formatter).extend(Identifier).extend(Binder).extend(EventDelegator).extend({
        _subviews: null,

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

    return View;


}).call(this);
