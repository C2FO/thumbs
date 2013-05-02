Thumbs.viewRegistry = (function () {
    var _hash = {},
        _length = 0;

    function __getById(id) {
        return "string" === typeof id ? _hash[id] : id;
    }

    function _getByNode(node) {
        return node ? _hash[node.thumbsId || node.getAttribute("thumbs-id")] : undefined;
    }

    function _toArray() {
        return _.values(_hash);
    }


    function _getUniqueId() {
        return _.uniqueId("thumbs_view_");
    }

    function _getViews(node) {
        var ret = [];

        function gatherViews(root) {
            var thumbsId, node, view;
            for (node = root.firstChild; node; node = node.nextSibling) {
                if (node.nodeType === 1) {
                    if ((thumbsId = node.getAttribute("thumbs-id")) && (view = _hash[thumbsId])) {
                        ret.push(view);
                    }
                }
            }
        }

        gatherViews(node);
        return ret;
    }

    function __addView(view) {
        var id = view.thumbsId;
        if (_hash.hasOwnProperty(id)) {
            throw new Error("Tried to register view with id " + id + " but that id is already registered");
        }
        if (id) {
            _hash[id] = view;
            _length++;
        }
    }

    function __removeView(id) {
        if (_hash.hasOwnProperty(id)) {
            delete _hash[id];
            _length--;
        }
    }

    function _getEnclosingView(searchNode) {
        var id, node = searchNode;
        while (node) {
            if (node !== searchNode && (id = node.nodeType === 1 && node.getAttribute("thumbs-id"))) {
                return _hash[id];
            }
            node = node.parentNode;
        }
        return null;
    }

    return {
        _hash: _hash,
        getEnclosingView: _getEnclosingView,
        remove: __removeView,
        add: __addView,
        "get": __getById,
        uniqueId: _getUniqueId,
        getSubViews: _getViews,
        getByNode: _getByNode,
        toArray: _toArray
    };
})();
