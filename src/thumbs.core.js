var Thumbs = (function (Backbone, _) {

    var Thumbs = {};

    // copy Backbone's namespace over to Thumbs
    // _.extend(Thumbs, Backbone);

    var _extend = Backbone.Model.extend;

    Thumbs.MULTI_ARG_TOKEN = / +/;
    Thumbs.KEY_VALUE_TOKEN = ":";

    // @include ./thumbs.super.js
    // @include ./thumbs.class.js
    // @include ./thumbs.helpers.js
    // @include ./thumbs.model.js
    // @include ./thumbs.collection.js
    // @include ./thumbs.router.js
    // @include ./thumbs.view.js
    // @include ./thumbs.templateView.js

    this.thumbs = Thumbs;

    return Thumbs;
}).call(this, Backbone, _);
