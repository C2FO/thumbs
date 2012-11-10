describe("Thumbs.Class", function () {

    var Animal = Thumbs.Class.extend({});

    beforeEach(function () {
    });

    afterEach(function () {
    });

    it("should inherit the extend method", function () {
        var spy = sinon.spy();
        var Dog = Animal.extend({
            bark: spy
        });
        var Poodle = Dog.extend({});
        expect(Poodle.prototype.bark).toBeAFunction();
        var dog = new Poodle();
        dog.bark();
        expect(spy).toHaveBeenCalledOnce();
    });

    it("should inherit the _super method", function () {
        var Dog = Animal.extend({
            bark: function () {
                return 'woof';
            }
        });

        var Poodle = Dog.extend({
            bark: function () {
                return this._super('bark', arguments) + ' ruff';
            }
        });

        var dog = new Poodle();
        expect(dog.bark()).toBe('woof ruff');
    });

    it("should inherit Thumbs.Events", function () {
        var Dog = Animal.extend({
            bark: function () {
                this.trigger('bark', true);
            }
        });

        var spy = sinon.spy();
        var dog = new Dog();
        dog.on('bark', spy);
        dog.bark();
        expect(spy).toHaveBeenCalledOnce();
    });

    it("should receive a unique id", function () {
        var animal = new Animal();
        expect(animal.cid).toBeDefined();
    });
});