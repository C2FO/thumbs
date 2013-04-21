describe("Thumbs.View", function () {

    var View = Thumbs.View.extend({
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
        template: '<p>Hello</p>'
    });

    var TestModel = Thumbs.Model.extend({});

    beforeEach(function () {
        this.model = new TestModel({firstName: "Bob", lastName: "Yukon"})
        this.view = new TestView({ model: this.model });
    });

    describe("on rendering", function () {

        describe("subviews", function () {
            var TestMainView = View.extend({ template: '<div id="test"></div>' }),
                TestSubView = View.extend({ template: '<div class="foo"></div>' }),
                view = null, subview = null;
            beforeEach(function () {
                view = new TestMainView(),
                    subview = new TestSubView();
            });

            xit("should add itself to the thumbs registry", function () {
                expect(Thumbs.viewById(view.thumbsId)).toEqual(view);
            });

            it("should be able to render a subview to a given selector in an unrendered view", function () {
                view.addSubView('#test', subview);
                view.render();
                expect(view.$el).toContain('.foo');
            });

            it("should call undelegateEvents on the old view before replacing it with the new", function () {
                var sv2 = new TestSubView();
                var undelegateSpy = sinon.spy(sv2, 'undelegateEvents');
                view.addSubView('#test', sv2);
                view.addSubView('#test', subview);
                expect(undelegateSpy).toHaveBeenCalled();
            });

            it("should be able to render a subview to a given selector in an already rendered view", function () {
                view.render();
                view.addSubView('#test', subview);
                expect(view.$el).toContain('.foo');
            });

            it("should remove a subview from a given selector", function () {
                view.addSubView('#test', subview);
                view.removeSubView('#test');
                view.render();
                expect(view.$('#test')).toBeEmpty();
            });
        });
    });

    describe('on removing', function () {
        it('should undelegate events', function () {
            var spy = sinon.spy(this.view, 'undelegateEvents');
            this.view.render();
            this.view.remove();
            expect(spy).toHaveBeenCalled();
        });

        xit("should remove itself from the thumbs registry if the element is removed", function () {
            this.view.remove();
            this.view.setElement(null);
            expect(Thumbs.viewById(this.view.thumbsId)).toBeUndefined();
        });
    });

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
});

