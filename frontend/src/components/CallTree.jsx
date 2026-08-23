function NodeCard({
    node,
    onSelect,
    selectedCallId
}) {
    if (!node) {
        return null;
    }

    const parameters = node.parameters || {};

    const parameterText = Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");

    const isSelected =
        selectedCallId === node.callId;

    return (
        <button
            type="button"
            className={`recursion-node ${
                isSelected
                    ? "recursion-node-selected selected"
                    : ""
            }`}
            onClick={() => onSelect(node)}
        >
            <div className="node-method">
                {node.methodName}
            </div>

            {parameterText && (
                <div className="node-parameters">
                    {parameterText}
                </div>
            )}

            <div className="node-return">
                → {node.returnValue ?? "—"}
            </div>
        </button>
    );
}


/* =========================================================
   RECURSION TREE
   ========================================================= */

function RecursionTree({
    node,
    onSelect,
    selectedCallId
}) {
    if (!node) {
        return null;
    }

    const children = node.children || [];

    /*
     * The backend stores recursive calls in
     * left-to-right order.
     *
     * Example:
     *
     * fib(n - 1) + fib(n - 2)
     *
     * children[0] = fib(n - 1)
     * children[1] = fib(n - 2)
     */

    const leftChild = children[0] || null;
    const rightChild = children[1] || null;

    const hasChildren =
        leftChild !== null ||
        rightChild !== null;

    return (
        <div className="recursion-subtree">

            {/* =================================================
                CURRENT NODE
               ================================================= */}

            <div className="recursion-node-wrapper">
                <NodeCard
                    node={node}
                    onSelect={onSelect}
                    selectedCallId={selectedCallId}
                />
            </div>


            {/* =================================================
                CONNECTOR + CHILDREN
               ================================================= */}

            {hasChildren && (
                <>
                    {/* Parent → children connector */}

                    <div className="tree-connector">

                        <div className="vertical-line" />

                        <div className="horizontal-line" />

                    </div>


                    {/* Children */}

                    <div className="recursion-children">

                        {/* ================================
                            LEFT CHILD
                           ================================= */}

                        <div className="recursion-child left-child">

                            {leftChild ? (
                                <RecursionTree
                                    node={leftChild}
                                    onSelect={onSelect}
                                    selectedCallId={
                                        selectedCallId
                                    }
                                />
                            ) : (
                                <div className="empty-child" />
                            )}

                        </div>


                        {/* ================================
                            RIGHT CHILD
                           ================================= */}

                        <div className="recursion-child right-child">

                            {rightChild ? (
                                <RecursionTree
                                    node={rightChild}
                                    onSelect={onSelect}
                                    selectedCallId={
                                        selectedCallId
                                    }
                                />
                            ) : (
                                <div className="empty-child" />
                            )}

                        </div>

                    </div>
                </>
            )}

        </div>
    );
}


/* =========================================================
   CALL TREE
   ========================================================= */

export default function CallTree({
    root,
    onSelect,
    selectedCallId
}) {
    if (!root) {
        return (
            <div className="call-tree-empty">
                No execution tree available.
            </div>
        );
    }


    /*
     * The backend root is normally:
     *
     * main()
     *   |
     *   └── fib(4)
     *
     * Keep main visible separately so that
     * the actual recursion tree starts below it.
     */

    const children = root.children || [];

    const algorithmRoot =
        children.length === 1
            ? children[0]
            : root;


    return (
        <div className="recursion-tree">

            {/* =================================================
                MAIN
               ================================================= */}

            {root.methodName === "main" &&
                children.length === 1 && (

                    <div className="main-call">

                        <NodeCard
                            node={root}
                            onSelect={onSelect}
                            selectedCallId={
                                selectedCallId
                            }
                        />

                        {/* main → fib connector */}

                        <div className="main-connector" />

                    </div>
                )}


            {/* =================================================
                RECURSION TREE
               ================================================= */}

            <RecursionTree
                node={algorithmRoot}
                onSelect={onSelect}
                selectedCallId={selectedCallId}
            />

        </div>
    );
}