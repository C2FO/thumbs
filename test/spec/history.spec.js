describe("Thumbs.History", function() {

    var spies = {
        router: sinon.spy(),
        star: sinon.stub().returns(true),
        routeOne: sinon.stub().returns(true),
        routeTwo: sinon.stub().returns(true),
        routeThree: sinon.stub().returns(true),
        returnFalse: sinon.stub().returns(false)
    };

    var AppRouter = Thumbs.Router.extend({
        routes: {
            "": "index",
            "route/one": "routeOne",
            "route2/:id1/:id2": "routeTwo",
            "last": "lastRoute"
        },

        preRoutes: {
            "all": [spies.star],
            "route/one": spies.routeOne,
            "route2/:id1/:id2": [spies.routeTwo, spies.routeThree],
            "last": [spies.returnFalse, spies.routeOne]
        },

        index: function() {},

        routeOne: function() {},

        routeTwo: function(id1, id2) {},

        lastRoute: function() {}
    });

    beforeEach(function() {
        this.router = new AppRouter();

        _.each(spies, function(preRouteSpy) {
            preRouteSpy.reset();
        });

        try {
            Thumbs.history.start({silent: true});
        } catch (ignore) {}
        this.router.navigate("somewhere");
    });

    afterEach(function() {
        Thumbs.history.stop();
    });

    it('has the routes set up correctly', function () {
        expect(this.router.routes['']).toEqual('index');
        expect(this.router.routes['route/one']).toEqual('routeOne');
        expect(this.router.routes['route2/:id1/:id2']).toEqual('routeTwo');
        expect(this.router.routes['last']).toEqual('lastRoute');
    });

    it('should fire "all" preRoute on "index" route', function() {
        var routerSpy = spies.router,
            starPreRoute = spies.star, 
            unmatchedPreRoute = spies.routeOne;

        this.router.bind('route:index', routerSpy, this);
        this.router.navigate('', {trigger: true});

        expect(routerSpy).toHaveBeenCalledOnce();
        expect(routerSpy).toHaveBeenCalledWithExactly();

        expect(starPreRoute).toHaveBeenCalledOnce();
        expect(starPreRoute).toHaveBeenCalledWithExactly();

        expect(starPreRoute.calledBefore(routerSpy)).toBe(true);
        expect(unmatchedPreRoute).toHaveNotBeenCalled();
    });

    it('should fire 1 specific preRoute after the "all" preRoute fires', function() {
        var routerSpy = spies.router,
            starPreRoute = spies.star,
            specificPreRoute = spies.routeOne,
            unmatchedPreRoute = spies.routeTwo;

        this.router.bind('route:routeOne', routerSpy, this);
        this.router.navigate('route/one', {trigger: true});

        expect(routerSpy).toHaveBeenCalledOnce();
        expect(routerSpy).toHaveBeenCalledWithExactly();

        expect(starPreRoute).toHaveBeenCalledOnce();
        expect(starPreRoute).toHaveBeenCalledWithExactly();

        expect(specificPreRoute).toHaveBeenCalledOnce();
        expect(specificPreRoute).toHaveBeenCalledWithExactly();

        expect(starPreRoute.calledBefore(specificPreRoute)).toBe(true);
        expect(specificPreRoute.calledBefore(routerSpy)).toBe(true);

        expect(unmatchedPreRoute).toHaveNotBeenCalled();
    });

    it('should fire 2 specific preRoutes after the "all" preRoute', function() {
        var routerSpy = spies.router,
            starPreRoute = spies.star,
            specificPreRoute1 = spies.routeTwo,
            specificPreRoute2 = spies.routeThree,
            unmatchedPreRoute = spies.routeOne;

        this.router.bind('route:routeTwo', routerSpy, this);
        this.router.navigate('route2/12/34', {trigger: true});

        expect(routerSpy).toHaveBeenCalledOnce();
        expect(routerSpy).toHaveBeenCalledWithExactly("12", "34");

        expect(starPreRoute).toHaveBeenCalledOnce();
        expect(starPreRoute).toHaveBeenCalledWithExactly();

        expect(specificPreRoute1).toHaveBeenCalledOnce();
        expect(specificPreRoute1).toHaveBeenCalledWithExactly();

        expect(specificPreRoute2).toHaveBeenCalledOnce();
        expect(specificPreRoute2).toHaveBeenCalledWithExactly();

        expect(starPreRoute.calledBefore(specificPreRoute1)).toBe(true);
        expect(specificPreRoute1.calledBefore(specificPreRoute2)).toBe(true);
        expect(specificPreRoute2.calledBefore(routerSpy)).toBe(true);

        expect(unmatchedPreRoute).toHaveNotBeenCalled();
    });

    it('should stop navigation if preRoute returns "false"', function() {
        var routerSpy = spies.router,
            starPreRoute = spies.star,
            specificPreRoute1 = spies.returnFalse,
            specificPreRoute2 = spies.routeOne,
            unmatchedPreRoute = spies.routeThree;

        this.router.bind('route:lastRoute', routerSpy, this);
        this.router.navigate('last', {trigger: true});

        expect(starPreRoute).toHaveBeenCalledOnce();
        expect(starPreRoute).toHaveBeenCalledWithExactly();

        expect(specificPreRoute1).toHaveBeenCalledOnce();
        expect(specificPreRoute1).toHaveBeenCalledWithExactly();

        expect(specificPreRoute2).toHaveNotBeenCalled();
        expect(routerSpy).toHaveNotBeenCalled();

        expect(unmatchedPreRoute).toHaveNotBeenCalled();
    });
});