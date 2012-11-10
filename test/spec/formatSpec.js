describe("thumbs.View Monitor", function () {
    var View = thumbs.View.extend({
        template: null,

        initialize: function (options) {
            this._super("initialize", arguments);
            if (this.template) {
                this.template = _.template(this.template);
            }
        },

        _getData: function () {
            var data = this.model ? this.model.toJSON() : this.collection ? data = this.collection.toJSON() : {};
            return data;
        },

        // default render functionality is to set the el html to the
        // compiled template run with the model data
        // override if that's not what's needed
        render: function () {
            if (this.template) {
                this.$el.html(this.template(this._getData()));
            }
            this._super("render", arguments);
            return this;
        }

    });

    var TestView = View.extend({
        template: '<p>' +
            '   <div data-thumbs-format="upperCase">{{firstName}}</div>' +
            '   <div data-thumbs-format="lowerCase">{{lastName}}</div>' +
            '</p>',

        upperCase: function (data) {
            return data.toUpperCase();
        },

        lowerCase: function (data) {
            return data.toLowerCase();
        }


    });


    var TestModel = thumbs.Model.extend({});

    describe("should format values when data-thumbs-format is specified", function () {

        it("use the specified formatter", function () {
            var model = new TestModel({firstName: "bob", lastName: "YUKON"});
            var view = new TestView({ model: model });
            view.render();
            expect(view.$('[data-thumbs-format="upperCase"]')).toHaveText("BOB");
            expect(view.$('[data-thumbs-format="lowerCase"]')).toHaveText("yukon");
        });

        it("should not format empty values", function () {
            var model = new TestModel({firstName: null, lastName: undefined});
            var view = new TestView({ model: model });
            view.render();
            expect(view.$('[data-thumbs-format="upperCase"]')).toBeEmpty();
            expect(view.$('[data-thumbs-format="lowerCase"]')).toBeEmpty();
        });


    });


});