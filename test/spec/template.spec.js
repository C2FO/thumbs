describe("Thumbs.TemplatingView", function () {
    describe('templating data', function () {

        var TestView = Thumbs.TemplateView.extend({
            template: '<p>Hello</p>'
        });

        var TestModel = Thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });
        it('add the template to the view', function () {
            this.view.render();
            expect(this.view.$el).toHaveText("Hello");
        });
    });

    describe("passing a compiled template", function () {
        it ("should accept a compiled template function", function () {
            var tmpl = _.template('<div id="foo"><div class="bar"></span></div>'),
                TestView = Thumbs.TemplateView.extend({
                    template: tmpl
                });

            var view = new TestView();
            expect(typeof view.template).toBe('function');
            view.render();
            expect(view.$el).toContain('#foo');
        });

        it("throws an error if the template is of an invalid type", function () {
            var TestView = Thumbs.TemplateView.extend({
                template: {invalid: true}
            });
            expect(function () {new TestView();}).toThrow();
        });
    });

    describe('templating data with interpolation', function () {

        var TestView = Thumbs.TemplateView.extend({
            template: '<div><div id="firstName"><%= firstName %></div><div id="lastName"><%= lastName %></div></div>'
        });

        var TestModel = Thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });
        it('should compile and interpolate the data', function () {
            this.view.render();
            expect(this.view.$('#firstName')).toHaveText("Bob");
            expect(this.view.$('#lastName')).toHaveText("Yukon");
        });

        it("should compile and interpolate collection data", function () {
            var TestCollectionView = Thumbs.TemplateView.extend({
                template: '<div><div class="firstName"><%= firstName %></div><div class="lastName"><%= lastName %></div>',
                render: function () {
                    var data = this.getTemplateData();
                    _.each(data, function (name) {
                        this.$el.append(this.fillTemplate(name));
                    }, this);
                    return this;
                }
            });
            var TestCollection = Thumbs.Collection.extend({ model: TestModel });
            var coll = new TestCollection();
            coll.add({ firstName: "Bob", lastName: "Yukon" });
            coll.add({ firstName: "Frank", lastName: "Mountie" });
            coll.add({ firstName: "Bill", lastName: "Maple" });
            var view = new TestCollectionView({ collection: coll }).render();
            expect(view.$('.firstName').length).toBe(coll.length);
            expect(view.$('.lastName').length).toBe(coll.length);
        });
    });

    describe("overriding getTemplateData", function () {
        var TestView = Thumbs.TemplateView.extend({
            template: '<div><div id="hello"><%= i18n.hello %></div> <div id="firstName"><%= firstName %></div><div id="lastName"><%= lastName %></div></div>',
            getTemplateData: function getTemplateData() {
                var data = this._super("getTemplateData", arguments);
                data.i18n = {hello: "Hello"};
                return data;
            }
        });

        var TestModel = Thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"});
            this.view = new TestView({ model: this.model });
        });

        it('should add the template to the view', function () {
            this.view.render();
            expect(this.view.$('#hello')).toHaveText("Hello");
            expect(this.view.$('#firstName')).toHaveText("Bob");
            expect(this.view.$('#lastName')).toHaveText("Yukon");
        });
    });
});

