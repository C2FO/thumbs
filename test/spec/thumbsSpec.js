describe("thumbs", function () {


    var View = thumbs.View.extend({});


    var TestView = View.extend({
        template: '<p>Hello</p>'
    });

    var TestModel = thumbs.Model.extend({});

    beforeEach(function () {
        this.model = new TestModel({firstName: "Bob", lastName: "Yukon"})
        this.view = new TestView({ model: this.model });
    });

    describe("thumbs.viewById", function () {

        it("should find a view by id", function () {
            expect(thumbs.viewById(this.view.thumbsId)).toEqual(this.view);
        });

        it("should return undefinded if the view does not exist", function () {
            expect(thumbs.viewById("hello")).toBeUndefined();
        });

        it("should return the view if it is passed in", function(){
            expect(thumbs.viewById(this.view)).toEqual(this.view);
        });

    });

    describe("thumbs.viewByNode", function () {

        it("should find a view by id", function () {
            expect(thumbs.viewByNode(this.view.el)).toEqual(this.view);
        });

        it("should return undefined if the view does not exist", function () {
            this.view.remove().setElement(null);
            expect(thumbs.viewByNode(this.view.el)).toBeUndefined();
        });

        it("should return the view if it is passed in", function(){
            expect(thumbs.viewByNode(this.view)).toEqual(this.view);
        });

    });


});

