(function () {

    var root = this;
    var ArrayProto = Array.prototype;
    var push = ArrayProto.push;
    var slice = ArrayProto.slice;
    var splice = ArrayProto.splice;

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
            data = (data !== null && "undefined" !== typeof data) ? data : "";
            this.$(el).text(data);
        },

        setupBinders: function setUpMonitors() {
            var monitors = this.__monitors, setElData = _.bind(this.setElData, this);
            this.$("[data-thumbs-bind]").each(function () {
                var $el = $(this);
                var m = $el.data("thumbs-bind");
                if (!(m in monitors)) {
                    monitors[m] = [];
                }
                monitors[m].push(function monitor(data) {
                    setElData($el, data, m);
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

    View = thumbs.View = View.extend(Binder).extend({
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
            this.setupProperties();
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

        setupProperties: function () {
            var self = this;
            this.$('[data-thumbs-id]').each(function (el) {
                var $this = $(this);
                var id = $this.data('thumbs-id');
                self[id] = this;
                self['$' + id] = $this;
            });
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
