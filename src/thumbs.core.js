// @echo banner
(function () {
    /*globals module:true,exports:true,define:true,require:true*/

    var root = this;

    function defineThumbs(Backbone, _) {
        var previousThumbs = root.Thumbs,
            Thumbs = {},
            _extend = Backbone.Model.extend;

        Backbone.Thumbs = Thumbs;

        Thumbs.MULTI_ARG_TOKEN = / +/;
        Thumbs.KEY_VALUE_TOKEN = ":";

        Thumbs.noConflict = function () {
            root.Thumbs = previousThumbs;
            return this;
        };

        Thumbs.viewRegistry = (function () {
            var _hash = {},
                _length = 0;

            var viewRegistry = {
                _hash: _hash,
                getEnclosingView: function (searchNode) {
                    var id, node = searchNode;
                    while (node) {
                        if (node !== searchNode && (id = node.nodeType === 1 && node.getAttribute("thumbs-id"))) {
                            return _hash[id];
                        }
                        node = node.parentNode;
                    }
                    return null;
                },
                remove: function (id) {
                    if (_hash.hasOwnProperty(id)) {
                        delete _hash[id];
                        _length--;
                    }
                },
                add: function (view) {
                    var id = view.thumbsId;
                    if (_hash.hasOwnProperty(id)) {
                        throw new Error("Tried to register view with id " + id + " but that id is already registered");
                    }
                    if (id) {
                        _hash[id] = view;
                        _length++;
                    }
                },
                get: function (id) {
                    return "string" === typeof id ? _hash[id] : id;
                },
                uniqueId: function () {
                    return _.uniqueId("thumbs_view_");
                },
                getSubViews: function (node) {
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
                },
                getByNode: function (node) {
                    return node ? _hash[node.thumbsId || node.getAttribute("thumbs-id")] : undefined;
                },
                toArray: function () {
                    return _.values(_hash);
                }
            };

            return viewRegistry;
        })();

        Thumbs.viewByNode = Thumbs.viewRegistry.getByNode;
        Thumbs.viewById = Thumbs.viewRegistry.get;


        Thumbs.extend = function(prototype, staticProps) {
            var child = _extend.apply(this, arguments);
            child.prototype.__getConstructor = function () {
                return child;
            };

            return child;
        };

        Backbone.Model.extend = Backbone.Collection.extend = Backbone.View.extend = Backbone.History.extend = Backbone.Router.extend = Thumbs.extend;

        Thumbs._super = {
            _super: (function () {
                function findSuper(methodName, childObject) {
                    var object = childObject;
                    while (object[methodName] === childObject[methodName] && object.__getConstructor) {
                        var constructor = object.__getConstructor();
                        object = constructor['__super__'];
                    }

                    return object;
                }

                return function(methodName, args) {
                    if (!this._superCallObjects) {
                        this._superCallObjects = {};
                    }

                    var result,
                    currentObject = this._superCallObjects[methodName] || this,
                    parentObject = findSuper(methodName, currentObject);

                    this._superCallObjects[methodName] = parentObject;

                    result = parentObject[methodName].apply(this, args || {});
                    delete this._superCallObjects[methodName];
                    return result;
                };
            })()
        };

        // add Backbone.Events to the Thumbs namespace
        Thumbs.Events = Backbone.Events;

        // @include ./thumbs.class.js
        // @include ./thumbs.model.js
        // @include ./thumbs.collection.js
        // @include ./thumbs.router.js
        // @include ./thumbs.view.js
        // @include ./thumbs.templateView.js

        return Thumbs;
    }


    if (typeof exports === 'object') {
        var underscore = require('undersore'),
            backbone = require('backbone');

        module.exports = defineThumbs(backbone, underscore);
    } else  if (typeof define === 'function' && define.amd) {
        define(['underscore', 'backbone'], function (_, Backbone) {
            return defineThumbs(Backbone, _);
        });
    } else {
        root.Thumbs = root.thumbs = defineThumbs(root.Backbone, root._);
    }

}).call(this);
