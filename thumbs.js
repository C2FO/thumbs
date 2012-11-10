(function () {

    var root = this;
    var ArrayProto = Array.prototype;
    var push = ArrayProto.push;
    var slice = ArrayProto.slice;
    var splice = ArrayProto.splice;

    var Thumbs;
    if (typeof exports !== 'undefined') {
        Thumbs = exports;
    } else {
        Thumbs = root.Thumbs = {};
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

    _.extend(Thumbs, Backbone);

    // Current version of the library. Keep in sync with `package.json`.
    Thumbs.VERSION = '0.0.0';


    //copy over Backbones $ for dom
    var Model = Thumbs.Model, View = Thumbs.View, Collection = Thumbs.Collection, Router = Thumbs.Router, History = Thumbs.History;

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
            }
        }())
    };

    function extend(protoProps, staticProps) {
        /*jshint validthis:true camelcase:false*/
        var parent = this;
        var child, childProto;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function () {
                parent.apply(this, arguments);
            };
        }
        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        function Surrogate() {
            this.constructor = child;
        }

        Surrogate.prototype = parent.prototype;
        childProto = child.prototype = new Surrogate();

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) {
            _.extend(child.prototype, protoProps);
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        childProto.__getConstructor = function __getConstructor() {
            return child;
        }

        return child;
    }

    function Class(options) {
        this.cid = _.uniqueId('class');
        this.initialize.apply(this, arguments);
    }

    _.extend(Class.prototype, Thumbs.Events, _super, {
        initialize: function initialize() {
        }
    });

    Thumbs.Class = Class;

    Class.extend = Model.extend = View.extend = Collection.extend = Router.extend = History.extend = extend;
    Model = Thumbs.Model = Model.extend(_super);
    View = Thumbs.View = View.extend(_super);
    Collection = Thumbs.Collection = Collection.extend(_super);
    Router = Thumbs.Router = Router.extend(_super);


    var EventMonitor = Thumbs.EventMonitor = {

        monitor: {},

        __setupListener: function __setupListener(type, model, monitor) {
            _.each(monitor, function (val, key) {
                if (_.isObject(val)) {
                    this.__setupListener(type, model[key], val);
                } else {
                    model[type]("change:" + key, this[val], this);
                }
            }, this);
        },

        startMonitor: function startMonitor() {
            this.__setupListener("on", this.model, this.monitor);
        },

        stopMonitor: function stopMonitor() {
            this.__setupListener("off", this.model, this.monitor);
        },

        render: function render() {
            this.startMonitor();
            this._super("render", arguments);
        },

        remove: function remove() {
            this.stopMonitor();
            this._super("remove", arguments);
        }
    };

    View = Thumbs.View = View.extend(EventMonitor).extend({
        _subviews: null,

        // child : null,
        // _childInstance : null,
        // channel : '',
        locals: null, // properties to add to the template for rendering

        initialize: function initialize(options) {
            this._super("render", arguments);
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
    return View;


}).call(this);