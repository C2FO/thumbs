Thumbs.helpers = (function () {
    var _super = {
        _super: (function () {
            function findSuper(methodName, childObject) {
                var object = childObject;
                while (object[methodName] === childObject[methodName]) {
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

    return {
        super: _super
    };
})();
