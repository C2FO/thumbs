Thumbs.History = (function () {
    var History = Backbone.History.extend({
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
                matched = this._super('loadUrl', arguments);
                if (!matched) {
                    if (this.options.notFoundRedirect) {
                        this.navigate(this.options.notFoundRedirect, { trigger: true });
                        matched = true;
                    }
                }
            }

            return matched;
        }
    });

    // create new history instance
    Thumbs.history = Backbone.history = new History();

    return History;
})();
