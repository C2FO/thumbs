Thumbs.Class = (function () {

    var Class = function (options) {
        this.cid = _.uniqueId("class");
        this.initialize.apply(this, arguments);
    };

    _.extend(Class.prototype, Backbone.Events, Thumbs._super, {
        initialize: function () {}
    });

    Class.extend = Thumbs.extend;

    return Class;
})();
