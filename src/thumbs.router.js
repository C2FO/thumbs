Thumbs.Router = Backbone.Router.extend(Thumbs.super).extend({
    route: function (route, name, callback) {
        if (!Thumbs.history) {
            Thumbs.history = Backbone.history;
        }
        return this._super('route', arguments);
    }
});
