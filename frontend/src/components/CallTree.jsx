function NodeCard({ node, onSelect }) {

    if (!node) {
        return null;
    }

    const parameters =
        node.parameters || {};

    const parameterText =
        Object.entries(parameters)
            .map(
                ([key, value]) =>
                    `${key}=${value}`
            )
            .join(", ");

    return (
        <button
            className="recursion-node"
            onClick={() => onSelect(node)}
        >

            <div className="node-method">
                {node.methodName}
            </div>

            <div className="node-parameters">
                {parameterText}
            </div>

            <div className="node-return">
                → {node.returnValue ?? "—"}
            </div>

        </button>
    );
}


function RecursionTree({
    node,
    onSelect
}) {

    if (!node) {
        return null;
    }

    const children =
        node.children || [];

    /*
     * The first child represents
     * the left recursive call.
     *
     * The second child represents
     * the right recursive call.
     *
     * This matches expressions such as:
     *
     * fib(n - 1) + fib(n - 2)
     */
    const leftChild =
        children[0] || null;

    const rightChild =
        children[1] || null;

    return (
        <div className="recursion-subtree">

            <div className="recursion-node-wrapper">

                <NodeCard
                    node={node}
                    onSelect={onSelect}
                />

            </div>

            {(leftChild || rightChild) && (

                <>

                    <div className="tree-connector">

                        <div className="vertical-line" />

                        <div className="horizontal-line" />

                    </div>

                    <div className="recursion-children">

                        <div className="recursion-child left-child">

                            {leftChild ? (

                                <RecursionTree
                                    node={leftChild}
                                    onSelect={onSelect}
                                />

                            ) : (

                                <div className="empty-child" />

                            )}

                        </div>

                        <div className="recursion-child right-child">

                            {rightChild ? (

                                <RecursionTree
                                    node={rightChild}
                                    onSelect={onSelect}
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


export default function CallTree({
    root,
    onSelect
}) {

    if (!root) {

        return (
            <div className="call-tree-empty">
                No execution tree available.
            </div>
        );
    }

    /*
     * Currently the API root is main().
     *
     * main() normally has one child:
     * the first algorithm method.
     *
     * We display main separately and
     * render the algorithm tree underneath.
     */

    const children =
        root.children || [];

    const algorithmRoot =
        children.length === 1
            ? children[0]
            : root;

    return (
        <div className="recursion-tree">

            {root.methodName === "main" &&
                children.length === 1 && (

                    <div className="main-call">

                        <NodeCard
                            node={root}
                            onSelect={onSelect}
                        />

                        <div className="main-connector" />

                    </div>

                )}

            <RecursionTree
                node={algorithmRoot}
                onSelect={onSelect}
            />

        </div>
    );
}