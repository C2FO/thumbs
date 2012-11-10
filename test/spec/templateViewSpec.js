describe("thumbs.TemplatingView", function () {


    describe('templating data', function () {

        var TestView = thumbs.TemplateView.extend({
            template: '<p>Hello</p>'
        });

        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"})
            this.view = new TestView({ model: this.model });
        });
        it('add the template to the view', function () {
            this.view.render();
            expect(this.view.$el).toHaveText("Hello");
        });
    });

    describe('templating data with interpolation', function () {

        var TestView = thumbs.TemplateView.extend({
            template: '<div><div id="firstName"><%= firstName %></div><div id="lastName"><%= lastName %></div></div>'
        });

        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"})
            this.view = new TestView({ model: this.model });
        });
        it('should compile and interpolate the data', function () {
            this.view.render();
            expect(this.view.$('#firstName')).toHaveText("Bob");
            expect(this.view.$('#lastName')).toHaveText("Yukon");
        });

    });

    describe("overriding getTemplateData", function () {
        var TestView = thumbs.TemplateView.extend({
            template: '<div><div id="hello"><%= i18n.hello %></div> <div id="firstName"><%= firstName %></div><div id="lastName"><%= lastName %></div></div>',
            getTemplateData: function getTemplateData() {
                var data = this._super("getTemplateData", arguments);
                data.i18n = {hello: "Hello"};
                return data;
            }
        });

        var TestModel = thumbs.Model.extend({});

        beforeEach(function () {
            this.model = new TestModel({firstName: "Bob", lastName: "Yukon"})
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

