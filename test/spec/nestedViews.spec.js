describe("nesting views", function () {
    describe("delegating events", function () {
        it('should delegate events to the parent view only', function () {
            var subViewSpy = sinon.spy(),
                viewSpy = sinon.spy();

            var SubView = Thumbs.View.extend({
                clickEvent: subViewSpy
            });

            var TestView = Thumbs.TemplateView.extend({
                template: '<div data-thumbs-id="subView" data-thumbs-view="SubView"><a data-thumbs-delegate="click:clickEvent">Link</a></div>',
                SubView: SubView,
                clickEvent: viewSpy
            });

            var view = new TestView();
            view.render();
            view.$("a").click();
            expect(subViewSpy).toHaveBeenCalled();
            expect(viewSpy).toHaveBeenCalled();
        });

        it('should delegate events to the subview if not nested', function () {
            var subViewSpy = sinon.spy(),
                viewSpy = sinon.spy();

            var SubView = Thumbs.TemplateView.extend({
                template: '<a data-thumbs-delegate="click:clickEvent">Link</a>',
                clickEvent: subViewSpy
            });

            var TestView = Thumbs.TemplateView.extend({
                template: '<div data-thumbs-id="subView" data-thumbs-view="SubView"></div>',
                SubView: SubView,
                clickEvent: viewSpy
            });

            var view = new TestView();
            view.render();
            view.$("a").click();
            expect(subViewSpy).toHaveBeenCalledOnce();
            expect(viewSpy).toHaveNotBeenCalled();
        });
    });

    describe("binding", function () {
        it('should thumbs-bind on nested views to the parent model', function () {
            var TestModel = Thumbs.Model.extend({});

            var SubView = Thumbs.View.extend({
            });

            var model = new TestModel({val: "A"});
            var otherModel = new TestModel();

            var TestView = Thumbs.TemplateView.extend({
                template: '<div data-thumbs-id="subView" data-thumbs-view="SubView" data-thumbs-args="model:otherModel"><span data-thumbs-bind="val"></span></div>',
                SubView: SubView,
                otherModel: otherModel
            });

            var view = new TestView({model: model});
            view.render();
            expect(view.$("span").text()).toBe("A");
            model.set("val", "B");
            expect(view.$("span").text()).toBe("B");
        });

        it('should thumbs-bind-class on nested views to the parent view', function () {
            var TestModel = Thumbs.Model.extend({});

            var SubView = Thumbs.View.extend({
            });

            var TestView = Thumbs.TemplateView.extend({
                template: '<div data-thumbs-id="subView" data-thumbs-view="SubView"><span data-thumbs-bind-class="visible:isVisible"></span></div>',
                SubView: SubView
            });
            var model = new TestModel({isVisible: false});
            var view = new TestView({model: model});
            view.render();
            expect(view.$("span").is(".visible")).toBe(false);
            model.set("isVisible", true);
            expect(view.$("span").is(".visible")).toBe(true);
        });

        it('should thumbs-bind-event on nested views to the parent view', function () {
            var changeSpy = sinon.spy(),
                destroySpy = sinon.spy(),
                syncSpy = sinon.spy(),
                errorSpy = sinon.spy();

            var TestModel = Thumbs.Model.extend({});

            var SubView = Thumbs.View.extend({});

            var TestView = Thumbs.TemplateView.extend({
                template: '<div data-thumbs-el data-thumbs-bind-event="change:modelChange destroy:modelDestroy sync:modelSync error:modelError">' +
                    '   <button data-thumbs-bind="val:lastName"></button>' +
                    '</div>',
                SubView: SubView,
                modelChange: changeSpy,
                modelDestroy: destroySpy,
                modelSync: syncSpy,
                modelError: errorSpy
            });

            var model = new TestModel({lastName:"test"});
            var view = new TestView({model: model});
            view.render();
            model.trigger("change");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(destroySpy).toHaveNotBeenCalled();
            expect(syncSpy).toHaveNotBeenCalled();
            expect(errorSpy).toHaveNotBeenCalled();

            model.trigger("sync");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(syncSpy).toHaveBeenCalledOnce();
            expect(errorSpy).toHaveNotBeenCalled();
            expect(destroySpy).toHaveNotBeenCalled();

            model.trigger("error");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(syncSpy).toHaveBeenCalledOnce();
            expect(errorSpy).toHaveBeenCalledOnce();
            expect(destroySpy).toHaveNotBeenCalled();

            model.trigger("destroy");
            expect(changeSpy).toHaveBeenCalledOnce();
            expect(syncSpy).toHaveBeenCalledOnce();
            expect(errorSpy).toHaveBeenCalledOnce();
            expect(destroySpy).toHaveBeenCalledOnce();
        });
    });

    describe("nested identifiers", function () {
        it('should set thumbs-id on nested views to the parent and not the child', function () {
            var SubView = Thumbs.View.extend({});

            var TestView = Thumbs.TemplateView.extend({
                template: '<div data-thumbs-id="subView" data-thumbs-view="SubView"><a data-thumbs-id="link">Link</a></div>',
                SubView: SubView
            });

            var view = new TestView();
            view.render();
            expect(view.$link).toBeDefined();
            expect(view.link).toBeDefined();
            expect(view.subView.link).toBeUndefined();

        });
    });

    describe("nested formatters", function () {
        it('should use formatters on the parent to format the nested ', function () {
            var TestModel = Thumbs.Model.extend({});
            var SubView = Thumbs.View.extend({});

            var TestView = Thumbs.TemplateView.extend({
                template: '<div data-thumbs-id="subView" data-thumbs-view="SubView">' +
                    '<div data-thumbs-format="upperCase"><%= firstName %></div>' +
                    '<div data-thumbs-format="lowerCase"><%= lastName %></div></div>',
                SubView: SubView,
                upperCase: function (data) {
                    return data.toUpperCase();
                },

                lowerCase: function (data) {
                    return data.toLowerCase();
                }
            });

            var model = new TestModel({firstName: "bob", lastName: "YUKON"});
            var view = new TestView({ model: model });
            view.render();
            expect(view.$('[data-thumbs-format="upperCase"]')).toHaveText("BOB");
            expect(view.$('[data-thumbs-format="lowerCase"]')).toHaveText("yukon");
        });
    });
});