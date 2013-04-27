Thumbs.super = (function (Thumbs, Backbone) {
    var _extend = Backbone.Model.extend;

    Thumbs.extend = function(prototype, staticProps) {
        var child = _extend.apply(this, arguments);
        child.prototype.__getConstructor = function () {
            return child;
        };

        return child;
    };

    Backbone.Model.extend = Backbone.Collection.extend = Backbone.View.extend = Backbone.History.extend = Backbone.Router.extend = Thumbs.extend;

    var _super = {
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

    return _super;
})(Thumbs, Backbone);
