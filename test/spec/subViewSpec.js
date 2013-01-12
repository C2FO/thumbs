describe("thumbs.View subview", function () {
    var spy = sinon.spy(),
        subTmpl = '<div id="test"><input id="test-input" value="" type="text"/><div id="first-name"></div><div id="last-name"></div></div>',
        viewTmpl = '<div id="test"><div data-thumbs-view="SubView"></div></div>',
        argsTmpl = '<div id="test"><div data-thumbs-view="SubView" data-thumbs-args="value : 1"></div></div>',
        instanceTmpl = '<div id="test"><div data-thumbs-view="SubView" data-thumbs-args="value: 1, model: model"></div></div>',
        customEventTmpl = '<div id="test"><div data-thumbs-view="SubView" data-thumbs-args="value: 1, model: model" data-thumbs-delegate="customEvent:test", data-thumbs-id="subView"></div></div>',
        view = null,
        requireMock = null;


    var TestModel = thumbs.Model.extend({});
    var SubView = thumbs.TemplateView.extend({
        value: null,
        template: subTmpl,
        initialize: function (options) {
            options = options || {};
            this.value = options.value || 0;
            this._super('initialize', arguments);
        },
        render: function () {
            this._super('render', arguments);
            this.$('#test-input').val(this.value);
            if (this.model) {
                this.$('#first-name').text(this.model.get("firstName"));
                this.$('#last-name').text(this.model.get("lastName"));
            }
            return this;
        }
    });
    var View = thumbs.View.extend({
        SubView: SubView,
        render: function (tmpl) {
            this.$el.html(tmpl);
            this._super('render', arguments);
            return this;
        },
        test:spy
    });

    beforeEach(function () {
        view = new View({model: new TestModel({firstName: "Bob", lastName: "Yukon"})});
    });

    afterEach(function () {
        view.remove();
        view = null;
    });

    it("allows the declaration of a subview", function () {
        view.render(viewTmpl);
        expect(view.$el).toContain('input#test-input');
    });

    it("should allow arguments to be passed to the subview as json", function () {
        view.render(argsTmpl);
        expect(+view.$('#test-input').val()).toBe(1);
    });

    it("should allow references to local instance properties in args", function () {
        view.render(instanceTmpl);
        expect(view.$('#first-name').text()).toBe(view.model.get("firstName"));
        expect(view.$('#last-name').text()).toBe(view.model.get("lastName"));
    });

    it("should allow references to local instance properties in args", function () {
        view.render(instanceTmpl);
        expect(view.$('#first-name').text()).toBe(view.model.get("firstName"));
        expect(view.$('#last-name').text()).toBe(view.model.get("lastName"));
    });

    it("add custom event to view", function () {
        expect(view._listeners).not.toBeDefined();
        view.render(customEventTmpl);
        expect(view._listeners).toBeDefined();
        expect(_.values(view._listeners).length).toBe(1);
        view.remove();
        expect(_.values(view._listeners).length).toBe(0);
    });

    it("should call custom events", function () {
        view.render(customEventTmpl);
        view.$subView.trigger("customEvent");
        expect(spy).toHaveBeenCalledOnce();
    });

});