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

    var TestModel = thumbs.Model.extend({});

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

            it("should add itself to the thumbs registry", function () {
                expect(thumbs.viewById(view.thumbsId)).toEqual(view);
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

        it("should remove itself from the thumbs registry if the element is removed", function () {
            this.view.remove();
            expect(thumbs.viewById(this.view.thumbsId)).toBeUndefined();
        });
    });
});

