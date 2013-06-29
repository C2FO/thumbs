Thumbs.TemplateView = (function () {

    //helper to set a shared templater. Defaults to _.template
    Thumbs.templater = (function () {
        //bring a private templater into scope
        var templater = _.template;
        return function __templater(tmplr) {
            if (tmplr) {
                //if a templater was passed in then set it
                templater = tmplr;
                return templater;
            } else {
                //otherwise just get the templater
                return templater;
            }
        };
    }());

    var TemplateView = Thumbs.View.extend({
        templater: null,
        template: null,

        initialize: function (options) {
            this._super("initialize", arguments);
            if (!this.templater) {
                this.templater = Thumbs.templater();
            }

            if (_.isString(this.template)) {
                this._template = this.templater(this.template);
            } else if (_.isFunction(this.template)) {
                this._template = this.template;
            } else {
                throw "Unexpected template property type";
            }
        },

        getTemplateData: function () {
            return (this.model || this.collection) ? (this.model || this.collection)["toJSON"]() : {};
        },

        fillTemplate: function (data) {
            if (this._template) {
                return this._template(data || this.getTemplateData());
            } else {
                return null;
            }
        },

        renderTemplate: function () {
            if (this._template) {
                var template = this.fillTemplate();
                if (template) {
                    this.$el.html(template);
                }
            }

            return  this;
        },

        render: function () {
            return this.renderTemplate()._super("render", arguments);
        }
    });

    return TemplateView;
})();
