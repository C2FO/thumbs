Thumbs.Router = Backbone.Router.extend(Thumbs.super).extend({
    preRoutes: null,

    _bindRoutes: function () {
        if (this.preBind && _.isFunction(this.preBind)) {
            this.preBind();
        }
        this._super('_bindRoutes', arguments);
    },

    route: function (route, name, callback) {
        if (!Thumbs.history) {
            Thumbs.history = Backbone.history;
        }

        this._super('route', arguments);

        this.setupPreRoute('all', route);
        this.setupPreRoute(null, route);

        return this;
    },

    setupPreRoute: function (path, route) {
        var checks, callback, preRoute;
        if (!path) {
            path = route;
            preRoute = "pre-route_" + route;
        } else {
            preRoute = "pre-route_" + path + route;
        }

        if (this.preRoutes && this.preRoutes[path]) {
            callback = this.preRoutes[path];

            if (_.isString(callback)) {
                callback = this[callback];
            } else if (_.isArray(callback)) {
                checks = callback;
                callback = _.bind(function () {
                    var i, result = true;
                    for (i = 0; i < checks.length; ++i) {
                        result = checks[i].apply(this);
                        if (!result) {
                            break;
                        }
                    }

                    return result;
                }, this);
            }

            if (!_.isRegExp(preRoute)) {
                preRoute = this._routeToRegExp(preRoute);
            }

            Thumbs.history.route(preRoute, _.bind(function () {
                return callback.apply(this);
            }, this));
        }

        return this;
    }
});
